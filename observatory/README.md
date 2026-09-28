# Nexus Observatory

[![CI](https://img.shields.io/badge/tests-31%20passing-4ade80?style=for-the-badge)](#testing)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

**A deep-space command deck for observing, tracing and evaluating AI agents.**

Nexus Observatory is the visual layer for the
[Nexus-Lab Agent Showcase](https://github.com/r4i0extr3m0/Nexus-Lab-Agent-Showcase) runtime.
It turns a compact Python agent runtime into something you can *see*: intent routing, a bounded
tool-calling loop, declarative tool contracts, a read-only sandbox and a full execution trace, all
in a single interface with its own visual identity.

This app lives in the `observatory/` directory of the Nexus-Lab repository.

> Read this in [Português](README.pt-BR.md).

---

## Why this exists

Most agent demos hide the interesting part inside a framework. This project does the opposite: it
makes the control flow visible. Observatory is a portfolio-grade front end for an agent runtime
built to show *engineering decisions*, not magic.

It is now a **true control plane**. The Observatory connects via HTTP to the Python agent runtime exposed through a FastAPI backend. This means the frontend is no longer a JS simulation; it acts as a visual interface that executes, observes, and traces the *real* Python agent logic.

```text
user request
    |
Nexus Observatory (React/Vite)       <- Control Plane / Observability
    | HTTP
Nexus Agent API (FastAPI)            <- Agent API 
    |
IntentRouter                         <- deterministic, inspectable routing
    |
NexusAgentRuntime                    
    |-- ToolRegistry + validation    <- capability boundary
    |-- bounded tool loop (max 3)    <- explicit execution budget
    |__ ExecutionTrace               <- request id, rounds, calls, latency, status
            |
       ChatProvider
     (Ollama / OpenAI-compatible)
```

---

## Panels

| Panel | What it shows |
|---|---|
| **Mission Control** | Compose a request, execute it and read the agent response with route, confidence, rounds and tool chain. |
| **Trace Timeline** | The full execution as a vertical timeline: router scores, planned tools, each round, each validated tool call with arguments/results/duration, final answer and the raw `ExecutionTrace`. |
| **Tool Registry** | The five registered tools, their JSON schemas and the required/unknown/type validation the registry enforces before dispatch. |
| **Sandbox Explorer** | The read-only I/O boundary. Browse the sandbox files and test path traversal live to see the boundary reject escapes. |
| **Evaluation** | The ten-case deterministic routing suite, with route/tool accuracy and an optional run that produces real traces. |
| **Telemetry** | Session-level metrics: runs, success rate, average latency, tool usage and route distribution. |

---

## Visual identity

Observatory deliberately avoids the warm, document-centric look of chat UIs. Its signature is a
**deep-space laboratory**:

- near-black navy canvas with layered aurora violet and cyan nebulae;
- a faint blueprint grid and a drifting starfield;
- glass instrumentation panels with hairline edges and monospace telemetry;
- an accent gradient that moves from `pulse` cyan to `aurora` violet;
- semantic signal colours: green (success), amber (running), red (failure).

The design tokens live in `tailwind.config.js`. The brand mark is `public/nexus-mark.svg`.

---

## Quick start

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

Open `http://localhost:5173`.

No `.env` file, GPU, model or API key is required.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server with HMR. |
| `npm run build` | Produce an optimized production build in `dist/`. |
| `npm run preview` | Serve the production build locally. |
| `npm test` | Run the Vitest suite (31 tests) over the runtime. |
| `npm run lint` | Lint the source with ESLint (zero warnings allowed). |

---

## Testing

The runtime is covered by a deterministic Vitest suite. No model is required.

```bash
npm test
```

Coverage includes:

- routing for testing, tools, project and core intents;
- tool registry validation (unregistered tool, missing/unknown arguments, invalid types);
- the calculator parser, including division by zero and unsupported operations;
- sandbox path-traversal rejection and file reading;
- the bounded loop, including explicit budget-exhaustion and tool-failure paths;
- the ten-case evaluation suite.

```
Test Files  5 passed (5)
     Tests  31 passed (31)
```

---

## Project structure

```
.
├── public/
│   └── nexus-mark.svg
├── src/
│   ├── components/          UI panels (layout, console, trace, tools, sandbox, eval, telemetry)
│   ├── config/nav.js        Navigation + app metadata
│   ├── data/                Sandbox fixture + evaluation cases
│   ├── runtime/             Router, registry, tools, provider, trace, runtime, evaluation
│   ├── state/store.jsx      Session state persisted to localStorage
│   ├── lib/                 Formatting helpers
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── tailwind.config.js
├── vite.config.js
└── vitest.config.js
```

The `src/runtime/` directory is a faithful JavaScript mirror of the Python showcase
(`showcase/nexus_agent.py`): same routing rules, same tool contracts, same bounded loop, same trace
shape. Keeping the mirror explicit is what makes the interface trustworthy.

---

## Tech stack

- React 18 + Vite 5
- Tailwind CSS 3
- lucide-react icons
- Vitest for tests
- ESLint for linting

---

## Roadmap

- optional live mode connecting to the Python runtime through a small HTTP adapter;
- streaming traces so long runs render progressively;
- exportable trace bundles (JSON) for sharing a run;
- additional tools and evaluation cases.

---

## License

MIT — see [LICENSE](LICENSE).

