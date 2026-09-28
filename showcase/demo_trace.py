from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from showcase.nexus_agent import NexusAgentRuntime


class DemoProvider:
    """Deterministic provider for a reviewer-friendly local demo."""

    def __init__(self) -> None:
        self.step = 0

    def chat(self, messages, tools):
        self.step += 1
        if self.step == 1:
            return {
                "message": {
                    "role": "assistant",
                    "tool_calls": [
                        {
                            "function": {
                                "name": "read_sandbox_file",
                                "arguments": {"path": "project_notes.txt"},
                            }
                        }
                    ],
                }
            }
        if self.step == 2:
            return {
                "message": {
                    "role": "assistant",
                    "tool_calls": [
                        {
                            "function": {
                                "name": "calculator",
                                "arguments": {"expression": "18 * 7"},
                            }
                        }
                    ],
                }
            }
        return {
            "message": {
                "role": "assistant",
                "content": "Read the sandbox notes and calculated 18 * 7 = 126.",
            }
        }


def main() -> None:
    answer, trace = NexusAgentRuntime(DemoProvider()).run(
        "Read project_notes.txt and calculate 18 * 7.",
        request_id="demo-local-001",
    )

    print(answer)
    print("\n--- execution trace ---")
    print(json.dumps(trace.__dict__, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
