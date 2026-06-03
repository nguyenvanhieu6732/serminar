# Dev Ticket Preflight

Dev Ticket Preflight is a TypeScript GitHub Action that will analyze ready-labeled
GitHub Issues before implementation starts.

This repository currently contains the starter foundation for the Action. Later
stories will add issue event parsing, deterministic prechecks, LLM analysis,
report rendering, and GitHub Issue comments.

## Development

```bash
npm ci
npm run all
```

The committed Action entrypoint is `dist/index.js`, generated from `src/index.ts`.
