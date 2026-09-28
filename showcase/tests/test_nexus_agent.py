from __future__ import annotations

from typing import Any

import pytest
import requests

from showcase.nexus_agent import (
    NexusAgentRuntime,
    OllamaProvider,
    OpenAIProvider,
    ToolRegistry,
    ToolSpec,
    build_default_registry,
)


class FakeProvider:
    def __init__(self, responses: list[dict[str, Any]]) -> None:
        self.responses = iter(responses)
        self.calls = 0

    def chat(self, messages: list[dict[str, Any]], tools: list[dict[str, Any]]) -> dict[str, Any]:
        self.calls += 1
        return next(self.responses)


def test_router_and_trace_are_deterministic_for_unknown_request():
    provider = FakeProvider([
        {"message": {"role": "assistant", "content": "ok"}}
    ])
    answer, trace = NexusAgentRuntime(provider).run("Explain what an agent is.", "req-1")

    assert answer == "ok"
    assert trace.request_id == "req-1"
    assert trace.agent == "core"
    assert trace.rounds == 1
    assert trace.tool_calls == []
    assert trace.status == "SUCCESS"


def test_runtime_executes_tool_and_returns_follow_up():
    provider = FakeProvider([
        {
            "message": {
                "role": "assistant",
                "tool_calls": [
                    {
                        "function": {
                            "name": "calculator",
                            "arguments": {"expression": "2 + 3 * 4"},
                        }
                    }
                ],
            }
        },
        {"message": {"role": "assistant", "content": "The result is 14."}},
    ])

    answer, trace = NexusAgentRuntime(provider).run("Calculate 2 + 3 * 4.", "req-2")

    assert answer == "The result is 14."
    assert trace.status == "SUCCESS"
    assert trace.rounds == 2
    assert trace.tool_calls[0]["name"] == "calculator"


def test_tool_registry_rejects_unknown_tools():
    registry = build_default_registry()
    with pytest.raises(ValueError, match="tool not registered"):
        registry.execute("does_not_exist", {})


def test_tool_registry_rejects_duplicate_registration():
    registry = ToolRegistry()
    spec = ToolSpec(
        name="x",
        description="test",
        parameters={"type": "object"},
        handler=lambda: None,
    )
    registry.register(spec)
    with pytest.raises(ValueError, match="already registered"):
        registry.register(spec)


def test_runtime_stops_after_bounded_tool_rounds():
    provider = FakeProvider([
        {
            "message": {
                "role": "assistant",
                "tool_calls": [
                    {
                        "function": {
                            "name": "project_status",
                            "arguments": {},
                        }
                    }
                ],
            }
        }
    ] * 3)

    with pytest.raises(RuntimeError, match="maximum tool rounds exceeded"):
        NexusAgentRuntime(provider, max_tool_rounds=3).run("Use a tool.", "req-3")


def test_tool_schema_validation_rejects_missing_required_argument():
    registry = build_default_registry()
    with pytest.raises(ValueError, match="missing required"):
        registry.execute("calculator", {})


def test_tool_schema_validation_rejects_unknown_argument():
    registry = build_default_registry()
    with pytest.raises(ValueError, match="unknown arguments"):
        registry.execute("project_status", {"unexpected": True})


def test_tool_schema_validation_rejects_wrong_type():
    registry = build_default_registry()
    with pytest.raises(ValueError, match="invalid type"):
        registry.execute("read_sandbox_file", {"path": "README.md", "max_chars": "bad"})


def test_default_tools_are_safe_and_discoverable():
    names = build_default_registry().names()
    assert names == [
        "calculator",
        "list_sandbox_files",
        "project_status",
        "read_sandbox_file",
        "run_tests",
    ]


def test_calculator_rejects_unsupported_operations():
    registry = build_default_registry()
    with pytest.raises(ValueError, match="unsupported"):
        registry.execute("calculator", {"expression": "__import__('os').system('whoami')"})


def test_calculator_rejects_division_by_zero():
    registry = build_default_registry()
    with pytest.raises(ValueError, match="division by zero"):
        registry.execute("calculator", {"expression": "10 / 0"})


def test_sandbox_read_tool_rejects_path_traversal():
    registry = build_default_registry()
    with pytest.raises(ValueError, match="escapes"):
        registry.execute("read_sandbox_file", {"path": "../../README.md"})


def test_sandbox_tools_are_real_file_io():
    registry = build_default_registry()
    files = registry.execute("list_sandbox_files", {})
    assert "files" in files
    assert files["files"]

    document = registry.execute(
        "read_sandbox_file",
        {"path": "project_notes.txt"},
    )
    assert "agent runtime" in document["content"].lower()


def test_runtime_rejects_malformed_tool_arguments():
    provider = FakeProvider([
        {
            "message": {
                "role": "assistant",
                "tool_calls": [
                    {
                        "function": {
                            "name": "calculator",
                            "arguments": '{"expression": "2 + }',
                        }
                    }
                ],
            }
        }
    ])

    with pytest.raises(ValueError):
        NexusAgentRuntime(provider).run("Calculate something.", "req-json")


def test_runtime_rejects_invalid_provider_message():
    provider = FakeProvider([{"message": "not-an-object"}])

    with pytest.raises(ValueError, match="invalid message"):
        NexusAgentRuntime(provider).run("Hello.", "req-invalid")


def test_runtime_rejects_empty_final_response():
    provider = FakeProvider([
        {"message": {"role": "assistant", "content": "   "}}
    ])

    with pytest.raises(ValueError, match="empty final response"):
        NexusAgentRuntime(provider).run("Hello.", "req-empty")


def test_ollama_provider_retries_after_timeout(monkeypatch):
    calls = {"count": 0}

    class FakeResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return {"message": {"role": "assistant", "content": "ok"}}

    def fake_post(*args, **kwargs):
        calls["count"] += 1
        if calls["count"] == 1:
            raise requests.Timeout("simulated timeout")
        return FakeResponse()

    monkeypatch.setattr(requests, "post", fake_post)
    monkeypatch.setattr("showcase.nexus_agent.time.sleep", lambda _: None)

    provider = OllamaProvider(
        base_url="http://test",
        model="test-model",
        max_retries=1,
        retry_backoff=0,
    )

    result = provider.chat([], [])
    assert calls["count"] == 2
    assert result["message"]["content"] == "ok"


def test_ollama_provider_raises_clear_timeout_after_retries(monkeypatch):
    def fake_post(*args, **kwargs):
        raise requests.Timeout("simulated timeout")

    monkeypatch.setattr(requests, "post", fake_post)
    monkeypatch.setattr("showcase.nexus_agent.time.sleep", lambda _: None)

    provider = OllamaProvider(
        base_url="http://test",
        model="test-model",
        max_retries=1,
        retry_backoff=0,
    )

    with pytest.raises(TimeoutError, match="timed out"):
        provider.chat([], [])


def test_openai_provider_maps_chat_completion_response(monkeypatch):
    calls = {}

    class FakeResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return {
                "choices": [
                    {
                        "message": {
                            "role": "assistant",
                            "content": "ok",
                        }
                    }
                ]
            }

    def fake_post(url, **kwargs):
        calls["url"] = url
        calls["headers"] = kwargs["headers"]
        return FakeResponse()

    monkeypatch.setattr(requests, "post", fake_post)

    provider = OpenAIProvider(
        base_url="https://example.invalid/v1",
        model="test-model",
        api_key="test-key",
    )

    result = provider.chat([], [])
    assert result["message"]["content"] == "ok"
    assert calls["url"].endswith("/chat/completions")
    assert calls["headers"]["Authorization"] == "Bearer test-key"


def test_openai_provider_requires_api_key():
    with pytest.raises(ValueError, match="OPENAI_API_KEY"):
        OpenAIProvider(api_key="")
