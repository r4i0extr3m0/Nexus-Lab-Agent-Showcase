# Architecture

## Execution flow

1. The user sends a natural-language request.
2. `IntentRouter` selects a coarse execution route.
3. `NexusAgentRuntime` builds the conversation state.
4. The provider receives the conversation plus the registered tool schemas.
5. When the model requests a tool, `ToolRegistry` validates the call before dispatch.
6. The tool result is added back to the conversation.
7. The runtime continues until the model returns a final response or the three-round execution budget is exhausted.
8. `ExecutionTrace` records the result of the run.

## Components

### IntentRouter

The router is deliberately deterministic and lightweight. It is not intended to replace an LLM classifier; it demonstrates the architectural separation between routing and execution.

### ToolRegistry

The registry is the capability boundary of the agent.

It owns:

- tool discovery;
- tool schemas;
- required-argument checks;
- unknown-argument checks;
- basic type checks;
- dispatch.

A tool is not executable merely because its name came from the model response.

### NexusAgentRuntime

The runtime owns the agent loop. It controls:

- conversation state;
- tool-round budget;
- provider calls;
- tool dispatch;
- error propagation;
- execution tracing.

### ChatProvider

The provider interface isolates inference from orchestration. The showcase ships with:

- `OllamaProvider` for local execution;
- a fake provider in the test suite.

## Trust boundaries

```
Model output
    │
    ▼
ToolRegistry validation
    │
    ├── invalid → reject
    │
    └── valid → dispatch registered capability
```

This design intentionally avoids treating model-generated text as trusted executable instructions.

## Why a three-round budget?

A bounded loop provides a simple failure mode for tool-calling systems. If the agent cannot finish within its execution budget, the runtime stops instead of escalating indefinitely.

## Production evolution

A production version would typically add stronger policy evaluation, structured tool error contracts, richer tracing, persistence, retries, human approval for sensitive actions, and more comprehensive evaluation. Those concerns are intentionally outside the scope of this showcase.
