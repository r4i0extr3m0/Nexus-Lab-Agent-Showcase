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

import json
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
            if expected_type is not None and not isinstance(value, expected_type):
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
    """Minimal Ollama /api/chat adapter. No cloud API is required."""

    def __init__(self, base_url: str | None = None, model: str | None = None) -> None:
        self.base_url = (base_url or os.getenv("OLLAMA_URL", "http://127.0.0.1:11434")).rstrip("/")
        self.model = model or os.getenv("NEXUS_LAB_MODEL", "qwen3.5:9b")

    def chat(self, messages: list[dict[str, Any]], tools: list[dict[str, Any]]) -> dict[str, Any]:
        response = requests.post(
            f"{self.base_url}/api/chat",
            json={
                "model": self.model,
                "messages": messages,
                "tools": tools,
                "stream": False,
            },
            timeout=120,
        )
        response.raise_for_status()
        return response.json()


class IntentRouter:
    RULES = {
        "testing": ("teste", "testes", "pytest", "validar", "suite"),
        "tools": ("ferramenta", "tool", "executar", "rodar"),
        "project": ("projeto", "arquitetura", "nexus", "status"),
    }

    def route(self, text: str) -> tuple[str, float]:
        normalized = text.lower()
        scores = {
            name: sum(term in normalized for term in terms)
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
            description="Calcula uma expressão aritmética simples.",
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
            description="Retorna o estado resumido do showcase Nexus Agent.",
            parameters={
                "type": "object",
                "properties": {},
                "additionalProperties": False,
            },
            handler=lambda: {
                "project": "Nexus Agent Showcase",
                "architecture": "router -> runtime -> tools -> trace",
                "inference": "Ollama local",
                "max_tool_rounds": 3,
            },
        )
    )
    registry.register(
        ToolSpec(
            name="run_tests",
            description="Executa apenas a suíte de testes do showcase.",
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
    allowed = set("0123456789+-*/(). %")
    if not expression or any(char not in allowed for char in expression):
        raise ValueError("expression contains unsupported characters")
    try:
        value = eval(expression, {"__builtins__": {}}, {})
    except Exception as exc:
        raise ValueError("invalid arithmetic expression") from exc
    if not isinstance(value, (int, float)):
        raise ValueError("expression did not produce a number")
    return {"expression": expression, "result": value}


def _run_tests() -> dict[str, Any]:
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    command = [sys.executable, "-m", "pytest", "showcase/tests", "-q"]
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
                    "Você é o Nexus Agent Showcase. "
                    "Use ferramentas quando necessário. "
                    "Não invente resultados de ferramentas. "
                    f"Rota detectada: {agent} ({confidence:.2f})."
                ),
            },
            {"role": "user", "content": user_input},
        ]

        try:
            for round_index in range(1, self.max_tool_rounds + 1):
                trace.rounds = round_index
                payload = self.provider.chat(messages, self.registry.schemas())
                message = payload.get("message", {})
                if not isinstance(message, dict):
                    raise ValueError("provider returned an invalid message")

                tool_calls = message.get("tool_calls") or []
                if not tool_calls:
                    final_text = str(message.get("content", "")).strip()
                    if not final_text:
                        raise ValueError("provider returned an empty final response")
                    trace.finish("SUCCESS", started_at)
                    return final_text, trace

                messages.append(message)
                for call in tool_calls:
                    function = call.get("function", {})
                    name = function.get("name")
                    raw_arguments = function.get("arguments", {})
                    arguments = (
                        json.loads(raw_arguments)
                        if isinstance(raw_arguments, str)
                        else raw_arguments
                    )
                    result = self.registry.execute(name, arguments)
                    trace.tool_calls.append(
                        {"round": round_index, "name": name, "arguments": arguments}
                    )
                    messages.append(
                        {
                            "role": "tool",
                            "tool_name": name,
                            "content": json.dumps(result, ensure_ascii=False),
                        }
                    )

            raise RuntimeError("maximum tool rounds exceeded")
        except Exception:
            trace.finish("FAILED", started_at)
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
