# Nexus Agent Showcase

A compact, local-first demonstration of the engineering ideas behind Nexus.

The goal is not to be a chatbot demo. The goal is to show a small agent runtime with explicit boundaries:

```
user request
    ↓
IntentRouter
    ↓
NexusAgentRuntime
    ├── bounded tool loop (max 3 rounds)
    ├── ToolRegistry + argument validation
    ├── constrained sandbox I/O
    ├── ExecutionTrace
    └── ChatProvider
          ├── Ollama
          └── OpenAI-compatible API
```

## What is demonstrated

- **Agent routing:** deterministic intent classification before execution.
- **Tool registry:** tools are declarative and discoverable.
- **Bounded execution:** the runtime cannot loop forever.
- **Tool-call validation:** unknown tools and malformed arguments fail explicitly.
- **Execution tracing:** request id, selected route, rounds, tool calls, latency and status.
- **Constrained I/O:** the agent can inspect files only inside a dedicated read-only sandbox.
- **Provider resilience:** Ollama timeout/connection failures are retried within a bounded budget.
- **Provider abstraction:** both local Ollama and OpenAI-compatible chat completions fit the same interface.
- **Testability:** the runtime accepts a provider interface, so tests do not need a model or GPU.
- **Developer workflow:** the agent can invoke an allowlisted test runner instead of receiving arbitrary shell access.
- **Evaluation:** a 10-case routing suite plus an optional live tool-calling evaluator.

## Run

From the repository root:

```powershell
python -m pip install -r showcase/requirements.txt
python -m pytest showcase/tests -q
python showcase/evaluate.py
```

With Ollama running:

```powershell
$env:NEXUS_LAB_MODEL = "qwen3.5:9b"
python showcase/nexus_agent.py "List the files in the sandbox and read project_notes.txt."
```

Live tool-calling evaluation:

```powershell
python showcase/evaluate.py --live --provider ollama
```

Optional OpenAI-compatible evaluation:

```powershell
$env:OPENAI_API_KEY = "your-key"
python showcase/evaluate.py --live --provider openai
```

The model is optional for the deterministic test suite and router evaluation.

## Design choices

### Why a bounded loop?

Agentic systems need an explicit execution budget. This showcase limits tool rounds to three and fails explicitly when the budget is exhausted.

### Why a provider interface?

The runtime should not know how inference is implemented. `NexusAgentRuntime` depends on a small `ChatProvider` contract, making the core easy to test with a fake provider and easy to connect to either Ollama or an OpenAI-compatible endpoint.

### Why a sandbox?

The project needs to demonstrate real I/O without turning an LLM into a filesystem shell. The sandbox is a narrow capability boundary: only files under `showcase/sandbox/` can be listed or read.

### Why no arbitrary shell tool?

The example intentionally exposes only `run_tests`, an allowlisted command that runs the showcase test suite. This demonstrates that tool access should be explicit rather than equivalent to giving the model a terminal.

## Limitations

This is a portfolio-scale reference implementation, not the production Nexus runtime. The focus is on making agent-control decisions visible and testable.
