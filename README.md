# Nexus-Lab Agent Showcase

[![CI](https://github.com/r4i0extr3m0/Nexus-Lab-Agent-Showcase/actions/workflows/showcase-tests.yml/badge.svg)](https://github.com/r4i0extr3m0/Nexus-Lab-Agent-Showcase/actions/workflows/showcase-tests.yml)

Local-first AI agent engineering portfolio project.

This repository presents a compact agent runtime built to demonstrate practical engineering decisions around AI agents: routing, tool calling, validation, bounded execution, tracing, evaluation, testing, and local inference.

> Built as a focused technical showcase for junior AI-agent development roles.  
> 🇧🇷 [Leia em português](README.pt-BR.md)

## Observatory — visual control deck

The repository also ships **Nexus Observatory**, a React front end that makes the runtime visible: intent routing, the bounded tool loop, validated tool contracts, the read-only sandbox, full execution traces, the ten-case evaluation and session telemetry.

It is standalone. The same deterministic runtime is re-implemented in JavaScript, so a reviewer can run an agent and inspect every decision without Python, Ollama or an API key.

```bash
cd observatory
npm install
npm run dev
```

Full documentation: [observatory/README.md](observatory/README.md).

## 30-second reviewer demo

Run a complete agent loop without a GPU, Ollama, or API key:

```powershell
python showcase/demo_trace.py
```

Representative output:

```text
Read the sandbox notes and calculated 18 * 7 = 126.

--- execution trace ---
{
  "request_id": "demo-local-001",
  "agent": "tools",
  "rounds": 3,
  "tool_calls": [
    {
      "round": 1,
      "name": "read_sandbox_file",
      "arguments": {"path": "project_notes.txt"}
    },
    {
      "round": 2,
      "name": "calculator",
      "arguments": {"expression": "18 * 7"}
    }
  ],
  "status": "SUCCESS"
}
```

The demo uses a deterministic provider, but the trace goes through the same `NexusAgentRuntime`, `ToolRegistry`, sandbox and calculator used by the live agent.

For model evaluation, run `python showcase/evaluate.py --live --provider ollama` or the OpenAI-compatible provider.

## What a reviewer can inspect quickly

- **Agent runtime:** explicit request → route → tool loop → final response flow.
- **Tool boundaries:** tools are registered declaratively and validated before execution.
- **Bounded execution:** the agent is limited to three tool rounds.
- **Real constrained I/O:** the agent can list and read text files only inside `showcase/sandbox/`.
- **Safety:** there is no arbitrary shell tool; command execution is limited to the allowlisted test runner.
- **Failure handling:** malformed tool JSON, unknown tools, provider timeouts, retries and provider errors are covered by tests.
- **Testability:** inference is abstracted behind a `ChatProvider`, allowing deterministic tests without a model or GPU.
- **Observability:** every execution produces an `ExecutionTrace` with request id, route, rounds, tool calls, latency and status.
- **Evaluation:** 10 deterministic routing cases plus an optional live tool-calling evaluation.
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
        ┌───────┴────────┐
        ▼                ▼
     Ollama       OpenAI-compatible
```

The runtime is intentionally small. The point is to make the control flow easy to inspect rather than hide behavior behind a framework.

## Tech stack

- Python 3.11+
- Ollama
- OpenAI-compatible Chat Completions API
- `requests`
- `pytest`
- GitHub Actions

The default local model is configurable through `NEXUS_LAB_MODEL`.

## Quick start

Install dependencies:

```powershell
python -m pip install -r showcase/requirements.txt
```

Run the deterministic test suite:

```powershell
python -m pytest showcase/tests -q
```

Run the deterministic evaluation:

```powershell
python showcase/evaluate.py
```

Run the agent with a local Ollama instance:

```powershell
$env:NEXUS_LAB_MODEL = "qwen3.5:9b"
python showcase/nexus_agent.py "What is the project status and run the tests."
```

Run the live tool-calling evaluation against Ollama:

```powershell
python showcase/evaluate.py --live --provider ollama
```

Optional OpenAI-compatible evaluation:

```powershell
$env:OPENAI_API_KEY = "your-key"
$env:OPENAI_MODEL = "gpt-4o-mini"
python showcase/evaluate.py --live --provider openai
```

Ollama is **not** required for the test suite or deterministic evaluation.

## Tools

The runtime exposes explicit capabilities:

| Tool | Purpose |
|---|---|
| `calculator` | AST-based arithmetic evaluation without `eval()` |
| `project_status` | Returns structured project/runtime information |
| `list_sandbox_files` | Lists files only inside `showcase/sandbox/` |
| `read_sandbox_file` | Reads UTF-8 text only inside the sandbox |
| `run_tests` | Runs only `python -m pytest showcase/tests -q` |

The model cannot request an arbitrary command line or escape the sandbox.

## Evaluation

The repository contains 10 curated prompts in `showcase/eval_cases.json`.

The deterministic evaluation measures routing consistency:

```
python showcase/evaluate.py
```

For actual model behavior, the same cases can be sent to a live provider:

```
python showcase/evaluate.py --live --provider ollama
```

The live report checks whether the first model-selected tool matches the expected tool. It is intentionally separated from the deterministic suite so model variance is not confused with runtime correctness.

## Project layout

```
.
├── showcase/
│   ├── nexus_agent.py
│   ├── demo_trace.py
│   ├── evaluate.py
│   ├── eval_cases.json
│   ├── README.md
│   ├── requirements.txt
│   ├── sandbox/
│   └── tests/
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

The runtime depends on a small `ChatProvider` contract rather than a concrete inference SDK. The showcase includes a local Ollama adapter and an OpenAI-compatible adapter, plus a fake provider used by tests.

### Provider failure handling

The Ollama adapter retries transient timeout/connection failures with bounded exponential backoff. The runtime surfaces malformed provider responses and exhausted retries as explicit failures.

### Tool access as a capability

The model receives only registered capabilities. In particular, there is no generic terminal/shell capability.

## What this project is not

This is not presented as a production-ready autonomous agent framework. It is a focused reference implementation showing the engineering patterns I want to use when building production AI systems.

## Security

The public repository contains no production credentials, private datasets or model weights. Local configuration uses localhost-only Ollama settings. See [SECURITY.md](SECURITY.md).
