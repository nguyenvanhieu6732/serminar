---
baseline_commit: NO_VCS
---

# Story 1.2: Configure Action Inputs and Secrets

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a repo maintainer,
I want to configure the GitHub token, LLM API key, and Ready Label,
so that the Action can run securely in my repository without exposing secrets.

## Acceptance Criteria

1. Given the workflow passes `github-token`, `openai-api-key`, and optionally `ready-label`, when the Action starts, then it reads and validates the required inputs, and `ready-label` defaults to `ready-for-dev` when omitted.
2. Given `openai-api-key` is missing, when the Action starts, then the Action fails with a clear setup error, and the API key value is never printed in logs.
3. Given the Action logs configuration state, when logs are inspected, then logs may include whether required inputs are present, and logs must not include secret values or full private Issue content.

## Tasks / Subtasks

- [x] Declare public Action inputs in `action.yml`. (AC: 1)
  - [x] Add `github-token` with clear description and `required: true`.
  - [x] Add `openai-api-key` with clear description and `required: true`.
  - [x] Add `ready-label` with description, `required: false`, and default `ready-for-dev`.
  - [x] Do not add `include-comments` or any other deferred input in this story.
- [x] Implement configuration loading in `src/config.ts`. (AC: 1, 2, 3)
  - [x] Replace the placeholder `ActionConfig` with a concrete config shape containing `githubToken`, `openaiApiKey`, and `readyLabel`.
  - [x] Add a loader function that reads only `github-token`, `openai-api-key`, and `ready-label` through `@actions/core`.
  - [x] Use `ready-for-dev` as the code-level default when `ready-label` is omitted or blank.
  - [x] Fail clearly when `github-token` or `openai-api-key` is missing or blank.
  - [x] Mask secret values with `core.setSecret` as soon as they are read and before any logging.
- [x] Update `src/action.ts` orchestration to use the config loader. (AC: 1, 2, 3)
  - [x] Call the config loader at Action start.
  - [x] Log only safe configuration state, such as whether required inputs are present and the configured ready label.
  - [x] On configuration error, call `core.setFailed` with a clear setup message that does not include token or API key values.
  - [x] Keep this story limited to configuration; do not implement event parsing, Ready Label filtering, LLM calls, report rendering, or GitHub comment posting.
- [x] Add focused unit tests for configuration behavior. (AC: 1, 2, 3)
  - [x] Add `__tests__/config.test.ts` for successful required input loading.
  - [x] Test default `ready-label` behavior.
  - [x] Test custom `ready-label` behavior.
  - [x] Test missing `github-token` and missing `openai-api-key` failure paths.
  - [x] Assert secret values are masked with `core.setSecret` and are not passed to safe logs or failure messages.
- [x] Update or extend existing orchestration smoke tests. (AC: 2, 3)
  - [x] Keep `__tests__/action.test.ts` passing with the new config loader behavior.
  - [x] Add a test proving configuration failures call `core.setFailed`.
  - [x] Ensure no test fixture or assertion interpolates secret values into shell commands or logs.
- [x] Verify the baseline locally. (AC: 1, 2, 3)
  - [x] Run `npm run format:check`.
  - [x] Run `npm run lint`.
  - [x] Run `npm test`.
  - [x] Run `npm run build`.
  - [x] Run `npm run package`.
  - [x] Run `npm run package:check`.
  - [x] Run `npm run all`.
  - [x] Record exact commands and any environment/runtime caveats in the Dev Agent Record.

## Dev Notes

### Scope Boundary

This story configures Action inputs and secret-safe logging only. Do not implement `issues.labeled` event parsing, Ready Label eligibility checks, pull request skips, duplicate prevention, deterministic prechecks, OpenAI calls, report schema validation, Markdown rendering, or GitHub Issue comment posting. Those belong to later stories.

The output of this story should be a runnable Action skeleton that can fail fast on missing setup and expose the minimal public inputs required by the MVP.

### Source Context

- Epic 1 objective: make the Action installable and triggerable in a repository, with configuration/secrets and duplicate guidance added across Stories 1.2-1.5. [Source: `_bmad-output/planning-artifacts/epics.md#Epic 1: Installable Ready-Label Action`]
- Story 1.2 requires `github-token`, `openai-api-key`, optional `ready-label`, a default `ready-for-dev`, clear missing-key behavior, and no secret logging. [Source: `_bmad-output/planning-artifacts/epics.md#Story 1.2: Configure Action Inputs and Secrets`]
- PRD FR14 requires configuring the LLM API key through GitHub Actions secrets or input, never printing the key, and producing a clear missing-key failure. [Source: `_bmad-output/planning-artifacts/prds/prd-serminal-2026-06-03/prd.md#FR-14: Support API Key-Based LLM Configuration`]
- Architecture fixes MVP public input names as kebab-case: `github-token`, `openai-api-key`, and `ready-label`. [Source: `_bmad-output/planning-artifacts/architecture.md#Naming Patterns`]

### Current Code State from Story 1.1

Story 1.1 created the TypeScript Action starter and left configuration as a placeholder:

- `action.yml` currently has only `name`, `description`, `author`, and `runs` with `using: node24` and `main: dist/index.js`.
- `src/config.ts` currently exports only `ActionConfig` with optional `readyLabel`.
- `src/action.ts` currently logs `Dev Ticket Preflight starter action initialized.`
- `__tests__/action.test.ts` currently verifies the starter action can execute without GitHub mutations.
- `package.json` already has `npm run all`, `build`, `lint`, `test`, `package`, `package:check`, and dependencies on `@actions/core` and `@actions/github`.

Do not create duplicate config modules. Update `src/config.ts` directly.

### Architecture Compliance

Follow these setup decisions exactly:

- Use a stateless TypeScript GitHub Action, not a GitHub App, hosted SaaS, backend, database, or dashboard. [Source: `_bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions`]
- `config.ts` owns Action inputs and defaults. It must read `github-token`, `openai-api-key`, and `ready-label`, default `ready-label` to `ready-for-dev`, and enforce missing required input behavior. [Source: `_bmad-output/planning-artifacts/architecture.md#Configuration Boundary`]
- `action.ts` is orchestration only. It may call the config loader and log safe setup state, but must not contain parsing, rendering, LLM-specific, or GitHub API logic. [Source: `_bmad-output/planning-artifacts/architecture.md#Action Boundary`]
- No module except future `github-comments.ts` may write to GitHub. This story should not add any GitHub write behavior. [Source: `_bmad-output/planning-artifacts/architecture.md#GitHub Comment Boundary`]
- Use safe logging only. Logs may include input presence and ready label; logs must not include the GitHub token, OpenAI API key, full Issue body, full prompt, or raw private content. [Source: `_bmad-output/planning-artifacts/architecture.md#Logging Pattern`]

### Latest Technical Notes

- GitHub Action metadata supports `inputs`, `inputs.<input_id>.required`, and `inputs.<input_id>.default`. GitHub docs also state that `required: true` in `action.yml` does not automatically fail when omitted, so code must validate required inputs. [External source: `https://docs.github.com/en/enterprise-cloud@latest/actions/creating-actions/metadata-syntax-for-github-actions`]
- GitHub Actions Toolkit `@actions/core` is the established package for inputs, outputs, results, logging, secrets, and variables. [External source: `https://github.com/actions/toolkit`]
- Use `core.getInput(...)` for action inputs, `core.setSecret(...)` to mask secret values, and `core.setFailed(...)` for setup failures. Do not use raw environment variables directly unless a documented toolkit limitation requires it.

### Implementation Guidance

Recommended shape:

```ts
export const DEFAULT_READY_LABEL = "ready-for-dev"

export interface ActionConfig {
  readonly githubToken: string
  readonly openaiApiKey: string
  readonly readyLabel: string
}

export function loadConfig(): ActionConfig {
  const githubToken = core.getInput("github-token", { required: true }).trim()
  const openaiApiKey = core.getInput("openai-api-key", { required: true }).trim()
  const readyLabelInput = core.getInput("ready-label").trim()

  if (githubToken.length === 0) {
    throw new Error("Missing required input: github-token")
  }

  if (openaiApiKey.length === 0) {
    throw new Error("Missing required input: openai-api-key")
  }

  core.setSecret(githubToken)
  core.setSecret(openaiApiKey)

  return {
    githubToken,
    openaiApiKey,
    readyLabel: readyLabelInput.length > 0 ? readyLabelInput : DEFAULT_READY_LABEL
  }
}
```

The developer may adjust exact error classes and function names if tests remain clear and the module boundary is preserved. Keep error messages specific enough to tell users which input is missing, but never include the secret value.

### Project Structure Requirements

Expected files to update or add in this story:

```text
action.yml
src/action.ts
src/config.ts
__tests__/action.test.ts
__tests__/config.test.ts
dist/index.js
dist/index.js.map
dist/licenses.txt
```

Do not add new source modules for this story unless strictly required. Avoid `utils.ts`; shared safety helpers belong in `security.ts` in later stories if needed.

### Testing Requirements

Add direct unit coverage for `src/config.ts`. Mock `@actions/core` rather than reading real environment variables. Tests should prove:

- Required inputs are read from `github-token` and `openai-api-key`.
- Blank required inputs fail with clear setup errors.
- Omitted or blank `ready-label` returns `ready-for-dev`.
- Custom `ready-label` is preserved after trimming.
- `core.setSecret` is called for both secret values.
- No logs or `core.setFailed` messages include secret values.

Keep the existing starter smoke test behavior or update it to reflect safe config initialization. Do not add tests that call external APIs.

### Security and Guardrails

Even though this story does not process Issue content yet, preserve the MVP guardrails:

- Do not add code paths that mutate labels, assignees, issue body, issue state, repository files, workflow checks, or PRs.
- Do not interpolate inputs or future Issue content into shell commands in tests, fixtures, or workflows.
- Do not log `github-token`, `openai-api-key`, full Issue body, prompts, or raw private content.
- Treat `ready-label` as untrusted user-provided text for logging purposes; it may be logged because it is not a secret, but it should not be used in shell commands.
- Do not add `include-comments`; Issue comments are deferred unless PRD and Architecture are updated.

### Dependencies and Hand-Off to Later Stories

- Story 1.3 will use `readyLabel` from this story to decide whether an `issues.labeled` event is eligible.
- Story 1.3 will also introduce `github-context.ts` event parsing. Do not implement it here.
- Story 1.4 will add pull request and unsupported payload skip behavior.
- Story 1.5 will add duplicate/concurrency guidance.
- Epic 2 will use `openaiApiKey` when the LLM client is implemented.

### Previous Story Intelligence

Story 1.1 established these implementation patterns:

- Node runtime is `node24` in `action.yml` and `.node-version`; local validation may still show npm engine warnings if the machine uses Node 22.
- `npm run all` is the local and CI validation gate.
- The repo may not have `.git` available in the sandbox; `scripts/check-dist.mjs` verifies `dist/index.js` exists and only runs `git diff` if `.git` exists.
- `dist/index.js` is generated by `npm run package` and must be refreshed after source changes.
- BMad artifacts and installed skills are excluded from Prettier through `.prettierignore`; do not remove that exclusion.

### Project Structure Notes

- Implementation code lives at the project root, not under `_bmad-output`.
- BMad artifacts under `_bmad-output/` are planning and tracking artifacts, not source modules.
- This story should not edit planning artifacts except its own story file and sprint status through the workflow.

## References

- `_bmad-output/planning-artifacts/epics.md#Story 1.2: Configure Action Inputs and Secrets`
- `_bmad-output/planning-artifacts/architecture.md#Configuration Boundary`
- `_bmad-output/planning-artifacts/architecture.md#Logging Pattern`
- `_bmad-output/planning-artifacts/architecture.md#Naming Patterns`
- `_bmad-output/planning-artifacts/prds/prd-serminal-2026-06-03/prd.md#FR-14: Support API Key-Based LLM Configuration`
- `_bmad-output/implementation-artifacts/1-1-set-up-initial-project-from-starter-template.md#Dev Agent Record`
- `https://docs.github.com/en/enterprise-cloud@latest/actions/creating-actions/metadata-syntax-for-github-actions`
- `https://github.com/actions/toolkit`

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm test` - red phase failed before implementation because `loadConfig` did not exist and `action.ts` did not load configuration.
- `npm test` - passed after implementing config loading, safe orchestration logging, and failure handling.
- `npm run format:check` - first run failed on `__tests__/config.test.ts` and `src/config.ts`.
- `npm run format` - passed and formatted the new/changed source and test files.
- `npm run lint` - passed.
- `npm run build` - passed.
- `npm audit --json` - passed with 0 vulnerabilities.
- `npm run package` - passed and refreshed `dist/index.js`.
- `npm run package:check` - passed.
- `npm run all` - passed.
- `git rev-parse HEAD` - failed because the workspace is not a git repository; baseline recorded as `NO_VCS`.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Added the minimal public inputs in `action.yml`: `github-token`, `openai-api-key`, and optional `ready-label` defaulting to `ready-for-dev`.
- Implemented `src/config.ts` as the configuration boundary with `ActionConfig`, `DEFAULT_READY_LABEL`, `loadConfig`, required input validation, trimming, default ready label handling, and secret masking through `core.setSecret`.
- Updated `src/action.ts` orchestration to load config, log only safe setup state, and call `core.setFailed` for setup errors without exposing secret values.
- Added direct config tests and updated action orchestration tests for success, default/custom ready label behavior, missing required inputs, secret masking, and setup failure handling.
- No event parsing, LLM calls, report rendering, GitHub comments, or GitHub mutations were added.

### Change Log

- 2026-06-03: Implemented Action input metadata, config loading, secret masking, safe setup logging, and focused tests.

### File List

- `action.yml`
- `src/action.ts`
- `src/config.ts`
- `__tests__/action.test.ts`
- `__tests__/config.test.ts`
- `dist/index.js`
- `dist/index.js.map`
- `dist/licenses.txt`
