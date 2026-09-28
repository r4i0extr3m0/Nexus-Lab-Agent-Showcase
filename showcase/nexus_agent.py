"""Nexus Agent Showcase — local-first agent runtime.

This module is intentionally small and self-contained. It demonstrates:
- intent routing
- typed tool registry
- bounded agentic loop
- tool-call validation
- execution tracing
- local Ollama integration
- safe test execution through an allowlisted tool
"""

from __future__ import annotations

import ast
import json
import operator
import os
import subprocess
import sys
import time
from dataclasses import dataclass, field
from typing import Any, Callable, Protocol

import requests


@dataclass(frozen=True)
class ToolSpec:
    name: str
    description: str
    parameters: dict[str, Any]
    handler: Callable[..., Any]


class ToolRegistry:
    def __init__(self) -> None:
        self._tools: dict[str, ToolSpec] = {}

    def register(self, spec: ToolSpec) -> None:
        if spec.name in self._tools:
            raise ValueError(f"tool already registered: {spec.name}")
        self._tools[spec.name] = spec

    def schemas(self) -> list[dict[str, Any]]:
        return [
            {
                "type": "function",
                "function": {
                    "name": spec.name,
                    "description": spec.description,
                    "parameters": spec.parameters,
                },
            }
            for spec in self._tools.values()
        ]

    def execute(self, name: str, arguments: dict[str, Any]) -> Any:
        spec = self._tools.get(name)
        if spec is None:
            raise ValueError(f"tool not registered: {name}")
        self._validate_arguments(spec, arguments)
        return spec.handler(**arguments)

    @staticmethod
    def _validate_arguments(spec: ToolSpec, arguments: dict[str, Any]) -> None:
        if not isinstance(arguments, dict):
            raise ValueError(f"tool arguments must be an object: {spec.name}")

        schema = spec.parameters
        properties = schema.get("properties", {})
        required = set(schema.get("required", []))

        missing = sorted(required - arguments.keys())
        if missing:
            raise ValueError(f"missing required arguments for {spec.name}: {missing}")

        if schema.get("additionalProperties") is False:
            unknown = sorted(set(arguments) - set(properties))
            if unknown:
                raise ValueError(f"unknown arguments for {spec.name}: {unknown}")

        type_map = {
            "string": str,
            "integer": int,
            "number": (int, float),
            "boolean": bool,
            "array": list,
            "object": dict,
        }
        for key, value in arguments.items():
            expected = properties.get(key, {}).get("type")
            expected_type = type_map.get(expected)
            if expected_type is not None:
                if not isinstance(value, expected_type) or (
                    expected in ("integer", "number") and isinstance(value, bool)
                ):
                    raise ValueError(
                        f"invalid type for {spec.name}.{key}: expected {expected}, "
                        f"got {type(value).__name__}"
                    )

    def names(self) -> list[str]:
        return sorted(self._tools)


@dataclass
class ExecutionTrace:
    request_id: str
    agent: str
    rounds: int = 0
    tool_calls: list[dict[str, Any]] = field(default_factory=list)
    latency_ms: float = 0.0
    status: str = "RUNNING"

    def finish(self, status: str, started_at: float) -> None:
        self.status = status
        self.latency_ms = round((time.perf_counter() - started_at) * 1000, 2)


class ChatProvider(Protocol):
    def chat(self, messages: list[dict[str, Any]], tools: list[dict[str, Any]]) -> dict[str, Any]:
        ...


class OllamaProvider:
    """Minimal Ollama /api/chat adapter with bounded retry behavior."""

    def __init__(
        self,
        base_url: str | None = None,
        model: str | None = None,
        timeout: float = 120.0,
        max_retries: int = 2,
        retry_backoff: float = 0.25,
    ) -> None:
        if max_retries < 0:
            raise ValueError("max_retries must be >= 0")
        self.base_url = (base_url or os.getenv("OLLAMA_URL", "http://127.0.0.1:11434")).rstrip("/")
        self.model = model or os.getenv("NEXUS_LAB_MODEL", "qwen3.5:9b")
        self.timeout = timeout
        self.max_retries = max_retries
        self.retry_backoff = retry_backoff

    def chat(self, messages: list[dict[str, Any]], tools: list[dict[str, Any]]) -> dict[str, Any]:
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": False,
        }
        if tools:
            payload["tools"] = tools
        last_error: Exception | None = None

        for attempt in range(self.max_retries + 1):
            try:
                response = requests.post(
                    f"{self.base_url}/api/chat",
                    json=payload,
                    timeout=self.timeout,
                )
                response.raise_for_status()
                return response.json()
            except requests.Timeout as exc:
                last_error = exc
                if attempt >= self.max_retries:
                    raise TimeoutError(
                        f"Ollama request timed out after {self.max_retries + 1} attempts"
                    ) from exc
            except requests.ConnectionError as exc:
                last_error = exc
                if attempt >= self.max_retries:
                    raise ConnectionError(
                        f"Could not connect to Ollama after {self.max_retries + 1} attempts"
                    ) from exc

            time.sleep(self.retry_backoff * (2**attempt))

        raise RuntimeError("provider retry loop exited unexpectedly") from last_error


class OpenAIProvider:
    """OpenAI-compatible Chat Completions adapter.

    The API key is read from OPENAI_API_KEY. No key is required for tests.
    """

    def __init__(
        self,
        base_url: str | None = None,
        model: str | None = None,
        api_key: str | None = None,
        timeout: float = 120.0,
    ) -> None:
        self.base_url = (base_url or os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")).rstrip("/")
        self.model = model or os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.timeout = timeout

    def chat(self, messages: list[dict[str, Any]], tools: list[dict[str, Any]]) -> dict[str, Any]:
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY is required for OpenAIProvider")

        payload = {
            "model": self.model,
            "messages": messages,
        }
        if tools:
            payload["tools"] = tools

        response = requests.post(
            f"{self.base_url}/chat/completions",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=self.timeout,
        )
        response.raise_for_status()
        data = response.json()
        try:
            return {"message": data["choices"][0]["message"]}
        except (KeyError, IndexError, TypeError) as exc:
            raise ValueError("OpenAI provider returned an invalid response") from exc


class IntentRouter:
    RULES = {
        "testing": (
            "teste", "testes", "test", "tests", "pytest", "validar",
            "validate", "suite",
        ),
        "tools": (
            "ferramenta", "ferramentas", "tool", "tools", "executar",
            "execute", "rodar", "run", "calcular", "calculate",
            "calculator", "arquivo", "arquivos", "file", "files",
            "ler", "read", "listar", "list", "sandbox", "documento",
            "document", "docs",
        ),
        "project": ("projeto", "project", "arquitetura", "architecture", "nexus", "status"),
    }

    def route(self, text: str) -> tuple[str, float]:
        import re
        normalized = text.lower()
        tokens = set(re.findall(r'\b\w+\b', normalized))
        scores = {
            name: sum(term in tokens for term in terms)
            for name, terms in self.RULES.items()
        }
        best = max(scores, key=scores.get)
        score = scores[best]
        if score == 0:
            return "core", 0.5
        return best, min(1.0, 0.5 + score * 0.15)


def build_default_registry() -> ToolRegistry:
    registry = ToolRegistry()

    registry.register(
        ToolSpec(
            name="calculator",
            description="Calculate a small arithmetic expression.",
            parameters={
                "type": "object",
                "properties": {"expression": {"type": "string"}},
                "required": ["expression"],
                "additionalProperties": False,
            },
            handler=_calculator,
        )
    )
    registry.register(
        ToolSpec(
            name="project_status",
            description="Return structured status information for the Nexus Agent showcase.",
            parameters={
                "type": "object",
                "properties": {},
                "additionalProperties": False,
            },
            handler=lambda: {
                "project": "Nexus Agent Showcase",
                "architecture": "router -> runtime -> tools -> trace",
                "inference": "Local & Cloud Providers",
                "max_tool_rounds": 3,
            },
        )
    )
    registry.register(
        ToolSpec(
            name="list_sandbox_files",
            description="List files in the read-only showcase sandbox.",
            parameters={
                "type": "object",
                "properties": {"max_items": {"type": "integer"}},
                "required": [],
                "additionalProperties": False,
            },
            handler=_list_sandbox_files,
        )
    )
    registry.register(
        ToolSpec(
            name="read_sandbox_file",
            description="Read a UTF-8 text file from the read-only showcase sandbox.",
            parameters={
                "type": "object",
                "properties": {
                    "path": {"type": "string"},
                    "max_chars": {"type": "integer"},
                },
                "required": ["path"],
                "additionalProperties": False,
            },
            handler=_read_sandbox_file,
        )
    )
    registry.register(
        ToolSpec(
            name="run_tests",
            description="Run only the showcase test suite.",
            parameters={
                "type": "object",
                "properties": {},
                "additionalProperties": False,
            },
            handler=_run_tests,
        )
    )
    return registry


def _calculator(expression: str) -> dict[str, Any]:
    """Evaluate a small arithmetic language without eval()."""
    if not expression or len(expression) > 100:
        raise ValueError("expression must contain 1-100 characters")

    operators = {
        ast.Add: operator.add,
        ast.Sub: operator.sub,
        ast.Mult: operator.mul,
        ast.Div: operator.truediv,
        ast.Mod: operator.mod,
        ast.USub: operator.neg,
        ast.UAdd: operator.pos,
    }

    try:
        tree = ast.parse(expression, mode="eval")
    except SyntaxError as exc:
        raise ValueError("invalid arithmetic expression") from exc

    def evaluate(node: ast.AST) -> int | float:
        if isinstance(node, ast.Expression):
            return evaluate(node.body)
        if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
            return node.value
        if isinstance(node, ast.UnaryOp) and type(node.op) in operators:
            return operators[type(node.op)](evaluate(node.operand))
        if isinstance(node, ast.BinOp) and type(node.op) in operators:
            left = evaluate(node.left)
            right = evaluate(node.right)
            if isinstance(node.op, (ast.Mult, ast.Div, ast.Mod)):
                if abs(left) > 1_000_000 or abs(right) > 1_000_000:
                    raise ValueError("arithmetic operands are too large")
            return operators[type(node.op)](left, right)
        raise ValueError("expression contains unsupported operations")

    try:
        value = evaluate(tree)
    except ZeroDivisionError as exc:
        raise ValueError("division by zero") from exc
    if not isinstance(value, (int, float)):
        raise ValueError("expression did not produce a number")
    return {"expression": expression, "result": value}




def _sandbox_root() -> str:
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), "sandbox")


def _safe_sandbox_path(relative_path: str) -> str:
    root = os.path.realpath(_sandbox_root())
    candidate = os.path.realpath(os.path.join(root, relative_path))
    if not (candidate == root or candidate.startswith(root + os.sep)):
        raise ValueError("sandbox path escapes the allowed directory")
    return candidate


def _list_sandbox_files(max_items: int = 20) -> dict[str, Any]:
    if max_items < 1 or max_items > 50:
        raise ValueError("max_items must be between 1 and 50")

    root = _sandbox_root()
    files: list[str] = []
    for current_root, _, filenames in os.walk(root):
        for filename in filenames:
            absolute = os.path.join(current_root, filename)
            files.append(os.path.relpath(absolute, root).replace(os.sep, "/"))
    files.sort()
    return {"root": "showcase/sandbox", "files": files[:max_items], "truncated": len(files) > max_items}


def _read_sandbox_file(path: str, max_chars: int = 4000) -> dict[str, Any]:
    if not path or len(path) > 200:
        raise ValueError("path must contain 1-200 characters")
    if max_chars < 1 or max_chars > 8000:
        raise ValueError("max_chars must be between 1 and 8000")

    filename = _safe_sandbox_path(path)
    if not os.path.isfile(filename):
        raise FileNotFoundError(f"sandbox file not found: {path}")

    try:
        with open(filename, "r", encoding="utf-8") as handle:
            content = handle.read(max_chars + 1)
    except UnicodeDecodeError:
        raise ValueError("sandbox file is not a valid UTF-8 text file")

    return {
        "path": path,
        "content": content[:max_chars],
        "truncated": len(content) > max_chars,
    }


def _run_tests() -> dict[str, Any]:
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    command = [sys.executable, "-m", "pytest", "showcase/tests", "-q"]
    try:
        completed = subprocess.run(
            command,
            cwd=root,
            capture_output=True,
            text=True,
            timeout=120,
            check=False,
        )
        return {
            "command": "python -m pytest showcase/tests -q",
            "return_code": completed.returncode,
            "passed": completed.returncode == 0,
            "output": (completed.stdout + completed.stderr)[-4000:],
        }
    except subprocess.TimeoutExpired:
        return {
            "command": "python -m pytest showcase/tests -q",
            "error": "test suite timed out after 120 seconds",
        }


class NexusAgentRuntime:
    """Small bounded runtime suitable for demonstration and tests."""

    def __init__(
        self,
        provider: ChatProvider,
        registry: ToolRegistry | None = None,
        max_tool_rounds: int = 3,
    ) -> None:
        if max_tool_rounds < 1:
            raise ValueError("max_tool_rounds must be >= 1")
        self.provider = provider
        self.registry = registry or build_default_registry()
        self.router = IntentRouter()
        self.max_tool_rounds = max_tool_rounds

    def run(self, user_input: str, request_id: str = "demo") -> tuple[str, ExecutionTrace]:
        started_at = time.perf_counter()
        agent, confidence = self.router.route(user_input)
        trace = ExecutionTrace(request_id=request_id, agent=agent)

        messages: list[dict[str, Any]] = [
            {
                "role": "system",
                "content": (
                    "You are the Nexus Agent Showcase. "
                    "Use tools when necessary. "
                    "Do not hallucinate tool results. "
                    f"Detected route: {agent} ({confidence:.2f})."
                ),
            },
            {"role": "user", "content": user_input},
        ]

        try:
            for round_index in range(1, self.max_tool_rounds + 2):
                trace.rounds = round_index
                current_schemas = self.registry.schemas() if round_index <= self.max_tool_rounds else []
                payload = self.provider.chat(messages, current_schemas)
                message = payload.get("message", {})
                if not isinstance(message, dict):
                    raise ValueError("provider returned an invalid message")

                tool_calls = message.get("tool_calls") or []
                if not tool_calls:
                    final_text = message.get("content")
                    if final_text is None:
                        final_text = ""
                    final_text = str(final_text).strip()
                    if not final_text:
                        raise ValueError("provider returned an empty final response")
                    trace.finish("SUCCESS", started_at)
                    return final_text, trace

                messages.append(message)
                for call in tool_calls:
                    call_id = call.get("id")
                    function = call.get("function", {})
                    name = function.get("name")
                    raw_arguments = function.get("arguments", {})
                    arguments = (
                        json.loads(raw_arguments)
                        if isinstance(raw_arguments, str)
                        else raw_arguments
                    )
                    
                    try:
                        result = self.registry.execute(name, arguments)
                        trace.tool_calls.append(
                            {"round": round_index, "name": name, "arguments": arguments, "status": "success"}
                        )
                        result_str = json.dumps(result, ensure_ascii=False)
                    except Exception as e:
                        trace.tool_calls.append(
                            {"round": round_index, "name": name, "arguments": arguments, "status": "error", "error": str(e)}
                        )
                        result_str = json.dumps({"error": str(e)}, ensure_ascii=False)

                    tool_message = {
                        "role": "tool",
                        "content": result_str,
                    }
                    if call_id:
                        tool_message["tool_call_id"] = call_id
                    else:
                        tool_message["tool_name"] = name
                    messages.append(tool_message)

            raise RuntimeError("maximum tool rounds exceeded")
        except Exception as exc:
            trace.finish("FAILED", started_at)
            exc.trace = trace  # type: ignore
            raise


def main() -> None:
    prompt = " ".join(sys.argv[1:]).strip()
    if not prompt:
        prompt = "Qual é o status do projeto e execute os testes."
    answer, trace = NexusAgentRuntime(OllamaProvider()).run(prompt)
    print(answer)
    print("\n--- execution trace ---")
    print(json.dumps(trace.__dict__, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
