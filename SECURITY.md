# Security

This repository is intentionally limited to a public portfolio showcase.

## Rules

- Never commit API keys, access tokens, passwords or production environment files.
- Keep `.env` and other environment-specific files out of Git.
- Do not commit model weights, private datasets or private user data.
- Do not expose arbitrary shell execution to an LLM.
- Review generated tool calls as untrusted input.
- Keep the agent execution budget bounded.

## Current showcase

The only command-execution capability exposed to the model is `run_tests`, which is hard-coded to:

```
python -m pytest showcase/tests -q
```

No arbitrary command string is accepted by that tool.
