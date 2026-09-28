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
    ├── ExecutionTrace
    └── ChatProvider
          ↓
       Ollama
```

## What is demonstrated

- **Agent routing:** lightweight intent classification before execution.
- **Tool registry:** tools are declarative and discoverable.
- **Bounded execution:** the runtime cannot loop forever.
- **Tool-call validation:** unknown tools and malformed arguments fail explicitly.
- **Execution tracing:** request id, selected agent, rounds, tool calls, latency and status.
- **Local inference:** Ollama is the default provider; no cloud API is required.
- **Testability:** the runtime accepts a provider interface, so tests do not need a model or GPU.
- **Developer workflow:** the agent can invoke an allowlisted test runner instead of receiving arbitrary shell access.

## Run

From the repository root:

```powershell
python -m pip install -r showcase/requirements.txt
python -m pytest showcase/tests -q
```

With Ollama running:

```powershell
$env:NEXUS_LAB_MODEL = "qwen3.5:9b"
python showcase/nexus_agent.py "Qual é o status do projeto e execute os testes."
```

The model is optional for the test suite. The tests use a fake provider and therefore remain deterministic.

## Design choices

### Why a bounded loop?

Agentic systems need an explicit execution budget. This showcase limits tool rounds to three and fails with a structured error when the budget is exhausted.

### Why a provider interface?

The runtime should not know how inference is implemented. `NexusAgentRuntime` depends on a small `ChatProvider` contract, making the core easy to test with a fake provider and easy to connect to Ollama.

### Why no arbitrary shell tool?

The example intentionally exposes only `run_tests`, an allowlisted command that runs the showcase test suite. This demonstrates the principle that tool access should be explicit rather than equivalent to giving the model a terminal.

## Limitations

This is a portfolio-scale reference implementation, not the production Nexus runtime. The larger repository contains earlier research and experiments; the showcase isolates the core agent-engineering ideas so they can be reviewed quickly.
