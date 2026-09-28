from __future__ import annotations

from typing import Any

import pytest

from showcase.nexus_agent import (
    NexusAgentRuntime,
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
    answer, trace = NexusAgentRuntime(provider).run("Explique o que é um agente.", "req-1")

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
        {"message": {"role": "assistant", "content": "O resultado é 14."}},
    ])

    answer, trace = NexusAgentRuntime(provider).run("Calcule 2 + 3 * 4.", "req-2")

    assert answer == "O resultado é 14."
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
        NexusAgentRuntime(provider, max_tool_rounds=3).run("Use uma ferramenta.", "req-3")



def test_tool_schema_validation_rejects_missing_required_argument():
    registry = build_default_registry()
    with pytest.raises(ValueError, match="missing required"):
        registry.execute("calculator", {})


def test_tool_schema_validation_rejects_unknown_argument():
    registry = build_default_registry()
    with pytest.raises(ValueError, match="unknown arguments"):
        registry.execute("project_status", {"unexpected": True})


def test_default_tools_are_safe_and_discoverable():
    names = build_default_registry().names()
    assert names == ["calculator", "project_status", "run_tests"]
