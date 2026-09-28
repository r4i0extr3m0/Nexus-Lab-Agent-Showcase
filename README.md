# Nexus-Lab Agent Showcase

Local-first AI agent engineering portfolio project.

This repository presents a compact agent runtime built to demonstrate practical engineering decisions around AI agents: routing, tool calling, validation, bounded execution, tracing, testing, and local inference.

> Built as a focused technical showcase for junior AI-agent development roles.

## What a reviewer can inspect quickly

- **Agent runtime:** explicit request → route → tool loop → final response flow.
- **Tool boundaries:** tools are registered declaratively and validated before execution.
- **Bounded execution:** the agent is limited to three tool rounds.
- **Safety:** there is no arbitrary shell tool; the developer tool exposed to the model is an allowlisted test runner.
- **Testability:** inference is abstracted behind a `ChatProvider`, allowing deterministic tests without Ollama or a GPU.
- **Observability:** every execution produces an `ExecutionTrace` with request id, route, rounds, tool calls, latency and status.
- **CI:** the showcase has a dedicated GitHub Actions test workflow.

## Architecture

```
User request
    │
    ▼
IntentRouter
    │
    ▼
NexusAgentRuntime
    ├── ToolRegistry
    │     └── schema + argument validation
    ├── bounded tool loop (max 3 rounds)
    └── ExecutionTrace
            │
            ▼
       ChatProvider
            │
            ▼
          Ollama
```

The runtime is intentionally small. The point is to make the control flow easy to inspect rather than hide the behavior behind a framework.

## Tech stack

- Python 3.11+
- Ollama
- `requests`
- `pytest`
- GitHub Actions

The default local model is configurable through `NEXUS_LAB_MODEL`.

## Quick start

Install dependencies:

```powershell
python -m pip install -r showcase/requirements.txt
```

Run the deterministic tests:

```powershell
python -m pytest showcase/tests -q
```

Run the agent with a local Ollama instance:

```powershell
$env:NEXUS_LAB_MODEL = "qwen3.5:9b"
python showcase/nexus_agent.py "Qual é o status do projeto e execute os testes."
```

Ollama is **not** required for the test suite.

## Example tools

The runtime currently exposes three explicit tools:

| Tool | Purpose |
|---|---|
| `calculator` | Safe arithmetic evaluation using a restricted character set |
| `project_status` | Returns structured project/runtime information |
| `run_tests` | Runs only `python -m pytest showcase/tests -q` |

The model cannot request an arbitrary command line.

## Project layout

```
.
├── showcase/
│   ├── nexus_agent.py
│   ├── README.md
│   ├── requirements.txt
│   └── tests/
│       └── test_nexus_agent.py
├── .github/
│   └── workflows/
│       └── showcase-tests.yml
├── .env.example
├── ARCHITECTURE.md
├── SECURITY.md
├── LICENSE
└── README.md
```

## Engineering decisions

### Bounded agent loop

Tool-calling agents need an execution budget. This runtime stops after three tool rounds and fails explicitly when the budget is exhausted.

### Explicit tool contracts

Each tool declares its parameters. The registry rejects missing required arguments, unknown arguments and invalid basic JSON types before dispatch.

### Provider abstraction

The runtime does not depend directly on Ollama. It depends on a small `ChatProvider` contract, which makes the agent loop deterministic and testable with a fake provider.

### Tool access as a capability

The model receives only registered capabilities. In particular, there is no generic terminal/shell capability.

## What this project is not

This is not presented as a production-ready autonomous agent framework. It is a focused reference implementation showing the engineering patterns I want to use when building production AI systems.

## Security

The public repository contains no production credentials, private datasets or model weights. Local configuration uses localhost-only Ollama settings. See [SECURITY.md](SECURITY.md).
