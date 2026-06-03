## Deferred from: code review of 2-1-run-deterministic-prechecks-before-llm-analysis (2026-06-03)

- Generated source map freshness is not guarded by package check [`dist/index.js`:35980]. `npm run package:check` currently validates only `dist/index.js`, while `dist/index.js.map` can be regenerated and remain unstaged. This is a pre-existing tooling gap outside Story 2.1's deterministic precheck scope.
