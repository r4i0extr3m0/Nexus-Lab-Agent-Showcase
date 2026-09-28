from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from typing import Any
import sys

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from showcase.nexus_agent import IntentRouter, NexusAgentRuntime, OllamaProvider, OpenAIProvider


ROOT = Path(__file__).resolve().parent
CASES_PATH = ROOT / "eval_cases.json"


def load_cases() -> list[dict[str, Any]]:
    with CASES_PATH.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def evaluate_router(cases: list[dict[str, Any]]) -> dict[str, Any]:
    router = IntentRouter()
    results = []
    correct = 0

    for case in cases:
        actual_route, confidence = router.route(case["prompt"])
        ok = actual_route == case["expected_route"]
        correct += int(ok)
        results.append(
            {
                "id": case["id"],
                "expected_route": case["expected_route"],
                "actual_route": actual_route,
                "confidence": confidence,
                "pass": ok,
            }
        )

    return {
        "cases": len(cases),
        "correct": correct,
        "accuracy": round(correct / len(cases), 3) if cases else 1.0,
        "results": results,
    }


def evaluate_live_tools(
    cases: list[dict[str, Any]],
    provider_name: str,
) -> dict[str, Any]:
    if provider_name == "openai":
        provider = OpenAIProvider()
    else:
        provider = OllamaProvider()

    results = []
    applicable = [case for case in cases if case["expected_tool"]]
    correct = 0

    for case in applicable:
        try:
            _, trace = NexusAgentRuntime(provider).run(case["prompt"], f"eval-{case['id']}")
            actual_tool = trace.tool_calls[0]["name"] if trace.tool_calls else None
            ok = actual_tool == case["expected_tool"]
            correct += int(ok)
            results.append(
                {
                    "id": case["id"],
                    "expected_tool": case["expected_tool"],
                    "actual_tool": actual_tool,
                    "status": trace.status,
                    "pass": ok,
                }
            )
        except Exception as exc:
            results.append(
                {
                    "id": case["id"],
                    "expected_tool": case["expected_tool"],
                    "actual_tool": None,
                    "status": "FAILED",
                    "error": str(exc),
                    "pass": False,
                }
            )

    return {
        "cases": len(applicable),
        "correct": correct,
        "accuracy": round(correct / len(applicable), 3) if applicable else 1.0,
        "results": results,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate Nexus Agent routing and tool calling.")
    parser.add_argument(
        "--live",
        action="store_true",
        help="Run tool-calling evaluation against a live provider.",
    )
    parser.add_argument(
        "--provider",
        choices=("ollama", "openai"),
        default="ollama",
        help="Provider for --live evaluation.",
    )
    args = parser.parse_args()

    cases = load_cases()
    report: dict[str, Any] = {
        "evaluation": "Nexus Agent Showcase",
        "routing": evaluate_router(cases),
    }

    if args.live:
        report["live_tool_calling"] = evaluate_live_tools(cases, args.provider)

    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
