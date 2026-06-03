---
baseline_commit: NO_VCS
---

# Story 1.3: Trigger Only on Ready-Labeled Issues

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an issue owner,
I want the Action to run only when I mark an Issue ready for development,
so that draft Issues do not receive premature preflight reports.

## Acceptance Criteria

1. Given a GitHub Issue receives the configured Ready Label, when the workflow runs on `issues.labeled`, then the Action recognizes the event as eligible for preflight, and it extracts issue number, title, body, label name, and repository context.
2. Given a GitHub Issue receives a different label, when the workflow runs, then the Action exits without posting a report, and logs the label mismatch without treating it as an error.
3. Given the workflow is configured with a custom `ready-label`, when an Issue receives that custom label, then the Action treats it as the Ready Label, and the default `ready-for-dev` is not required.

## Tasks / Subtasks

- [x] Add GitHub Issue labeled event fixtures. (AC: 1, 2, 3)
  - [x] Add `__tests__/fixtures/issue-labeled.json` for an `issues.labeled` payload with label `ready-for-dev`.
  - [x] Add `__tests__/fixtures/issue-other-label.json` for an `issues.labeled` payload with a non-ready label.
  - [x] Add fixture coverage for repository owner/name, issue number, title, body, and label name.
  - [x] Do not include private content, real tokens, or real user data in fixtures.
- [x] Implement issue labeled parsing in `src/github-context.ts`. (AC: 1, 2, 3)
  - [x] Replace the placeholder `GitHubContextSnapshot` with a story-appropriate normalized context type.
  - [x] Add a parser function that accepts the GitHub Actions event name and webhook payload instead of reading globals directly.
  - [x] Recognize only `issues` events with action `labeled` for this story.
  - [x] Extract issue number, title, body, label name, repository owner, and repository name for valid Issue labeled payloads.
  - [x] Return an explicit non-processing result for label mismatch without throwing.
  - [x] Treat missing required issue, label, or repository fields as unsupported/non-processing unless the failure is truly unrecoverable.
- [x] Wire parser into `src/action.ts` orchestration. (AC: 1, 2, 3)
  - [x] Import `context` from `@actions/github`.
  - [x] Load config first, then parse `github.context.eventName` and `github.context.payload`.
  - [x] When the configured ready label matches, log safe eligibility state including issue number and label name.
  - [x] When label mismatches, log a safe skip reason and return without failure.
  - [x] Keep `action.ts` orchestration-only; move parsing details into `github-context.ts`.
  - [x] Do not call the LLM, run prechecks, render reports, post comments, or mutate GitHub state in this story.
- [x] Add focused parser and orchestration tests. (AC: 1, 2, 3)
  - [x] Add `__tests__/github-context.test.ts`.
  - [x] Test `ready-for-dev` eligible issue extraction.
  - [x] Test non-ready label mismatch returns a non-error skip result.
  - [x] Test custom `ready-label` is honored and default label is not required.
  - [x] Test missing or unsupported payload shape is handled without GitHub mutation.
  - [x] Update `__tests__/action.test.ts` for ready-label eligible and mismatch paths.
- [x] Verify safe logging and no mutation behavior. (AC: 2)
  - [x] Assert logs include only safe metadata: issue number, trigger label, and skip/eligible reason.
  - [x] Assert logs do not include full issue body, token values, OpenAI API key, full payload JSON, or private content.
  - [x] Assert no GitHub comment APIs or mutation APIs are introduced or called.
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

This story only recognizes and normalizes `issues.labeled` events and skips label mismatches safely. Do not implement pull request skip behavior beyond generic unsupported-payload handling; Story 1.4 owns explicit PR detection. Do not implement deterministic prechecks, OpenAI calls, report schema validation, Markdown rendering, GitHub Issue comments, duplicate prevention, workflow concurrency, docs, or examples beyond fixtures needed for this story.

The output should be an Action that can tell whether the current run is eligible for future preflight processing, then stop. It should not produce a Preflight Report yet.

### Source Context

- Epic 1 objective: make the Action installable and triggerable in a repository, with configuration/secrets and duplicate guidance added across Stories 1.2-1.5. [Source: `_bmad-output/planning-artifacts/epics.md#Epic 1: Installable Ready-Label Action`]
- Story 1.3 requires the Action to recognize eligible `issues.labeled` Ready Label events, extract issue/repository context, skip other labels without error, and honor custom `ready-label`. [Source: `_bmad-output/planning-artifacts/epics.md#Story 1.3: Trigger Only on Ready-Labeled Issues`]
- PRD FR1 requires a preflight run when a GitHub Issue receives the Ready Label. [Source: `_bmad-output/planning-artifacts/prds/prd-serminal-2026-06-03/prd.md#FR-1: Trigger on Ready Label`]
- PRD scope requires `issues.labeled`, Ready Label filtering, and title/body only for default context. [Source: `_bmad-output/planning-artifacts/prds/prd-serminal-2026-06-03/prd.md#9.1 In Scope`]
- Architecture maps Ready Label trigger behavior to `src/action.ts`, `src/github-context.ts`, `src/config.ts`, and tests/fixtures under `__tests__/`. [Source: `_bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping`]

### Current Code State

Story 1.1 created the starter and Story 1.2 completed config loading:

- `action.yml` declares inputs `github-token`, `openai-api-key`, and optional `ready-label` defaulting to `ready-for-dev`.
- `src/config.ts` exports `DEFAULT_READY_LABEL`, `ActionConfig`, and `loadConfig()`.
- `src/action.ts` loads config and logs safe setup state, but does not parse GitHub event payloads yet.
- `src/github-context.ts` is still a placeholder with `GitHubContextSnapshot`.
- `__tests__/config.test.ts` and `__tests__/action.test.ts` cover config loading, secret masking, safe setup logging, and setup failures.

Do not duplicate config loading. Use `config.readyLabel` from `loadConfig()`.

### Architecture Compliance

Follow these decisions exactly:

- `action.ts` is orchestration only. It may load config, call the event parser, and log safe state, but parser details belong in `github-context.ts`. [Source: `_bmad-output/planning-artifacts/architecture.md#Action Boundary`]
- `github-context.ts` owns GitHub event parsing and normalization. It should read/validate event shape, extract issue number, label, title, body, and repository context, and treat all issue fields as untrusted data. [Source: `_bmad-output/planning-artifacts/architecture.md#GitHub Event Boundary`]
- Only handle `issues.labeled` in this story. [Source: `_bmad-output/planning-artifacts/architecture.md#GitHub Event Handling`]
- Only proceed when label equals configured Ready Label. [Source: `_bmad-output/planning-artifacts/architecture.md#GitHub Event Handling`]
- No module except future `github-comments.ts` may write to GitHub. This story must not add GitHub writes. [Source: `_bmad-output/planning-artifacts/architecture.md#GitHub API Writes`]
- Allowed logs for this area include issue number and trigger label. Forbidden logs include full Issue body, full prompt, LLM API key, raw private issue comments, and raw private content. [Source: `_bmad-output/planning-artifacts/architecture.md#Logging Pattern`]

### Latest Technical Notes

- GitHub Actions docs state the `github` context includes the webhook event payload and that the `event` object matches the webhook payload for the triggering event. [External source: `https://docs.github.com/en/actions/learn-github-actions/contexts`]
- GitHub Actions event docs state label-added workflows should use the `labeled` activity type for `issues`, `pull_request`, `pull_request_target`, or `discussion` events; this story only handles `issues` events. [External source: `https://docs.github.com/actions/automating-your-workflow-with-github-actions/events-that-trigger-workflows`]
- `@actions/github` provides the Actions `context`, including `context.eventName`, `context.payload`, and repository metadata. [External source: `https://github.com/actions/toolkit`]

### Implementation Guidance

Use a discriminated result rather than throwing for normal skip paths. Recommended shape:

```ts
export interface ReadyIssueContext {
  readonly issueNumber: number
  readonly issueTitle: string
  readonly issueBody: string
  readonly labelName: string
  readonly owner: string
  readonly repo: string
}

export type IssueEventParseResult =
  | { readonly kind: "ready"; readonly issue: ReadyIssueContext }
  | { readonly kind: "skipped"; readonly reason: "label_mismatch" | "unsupported_event" | "unsupported_payload"; readonly labelName?: string; readonly issueNumber?: number }
```

The parser should accept plain arguments for testability:

```ts
parseIssueLabeledEvent({
  eventName,
  payload,
  readyLabel
})
```

Exact names may vary, but keep the result explicit and testable. Prefer `unknown` for raw payload input and use local type guards rather than trusting webhook payload shape.

### Expected Safe Logs

Suggested log messages:

- Eligible path: `Issue #<number> received ready label "<label>"; preflight eligibility confirmed.`
- Label mismatch: `Skipping issue #<number>: label "<label>" does not match ready label "<readyLabel>".`
- Unsupported event/payload: `Skipping run: unsupported event payload for issue label preflight.`

Do not log `issue.body` or full payload JSON. `issue.title` is also private issue content; leave title out of logs for this story even though it is extracted for future analysis.

### Project Structure Requirements

Expected files to update or add:

```text
src/action.ts
src/github-context.ts
__tests__/action.test.ts
__tests__/github-context.test.ts
__tests__/fixtures/issue-labeled.json
__tests__/fixtures/issue-other-label.json
dist/index.js
dist/index.js.map
dist/licenses.txt
```

Do not add new source modules unless strictly needed. Do not add docs/examples in this story.

### Testing Requirements

Add direct unit tests for `github-context.ts` and update orchestration tests for `action.ts`.

Parser tests should cover:

- `eventName: "issues"` with `payload.action: "labeled"` and matching label returns `kind: "ready"` plus issue/repo fields.
- Non-matching label returns `kind: "skipped"` with reason `label_mismatch`.
- Custom ready label returns `kind: "ready"` when matched.
- Non-`issues` event returns unsupported event skip.
- Missing issue, label, or repository returns unsupported payload skip.

Action tests should cover:

- Eligible path logs safe metadata and does not fail.
- Label mismatch logs skip reason and does not fail.
- Full Issue body and secret values are not passed to `core.info` or `core.setFailed`.

Do not call external APIs in tests.

### Security and Guardrails

- Treat Issue title/body as untrusted input. Extract them for future stories, but do not log them or send them anywhere yet.
- Do not interpolate label, title, body, or payload content into shell commands.
- Do not mutate labels, assignees, issue body, issue state, repository files, workflow checks, PRs, or comments.
- Do not add `include-comments`.
- Do not read repository files, diffs, linked PRs, or Issue comments.

### Dependencies and Hand-Off to Later Stories

- Story 1.4 will explicitly detect `issue.pull_request` and unsupported payloads, including PR-labeled cases. Keep unsupported handling conservative here and avoid pretending PR support is complete.
- Story 1.5 will add duplicate/concurrency guidance.
- Epic 2 will use the extracted title/body after deterministic prechecks are implemented.
- `ReadyIssueContext` or equivalent from this story becomes the input to later precheck and LLM-input stories.

### Previous Story Intelligence

Story 1.2 established these patterns:

- `loadConfig()` must run before event parsing so the parser can compare against `config.readyLabel`.
- Secret values are masked with `core.setSecret`; do not add logs that include `githubToken` or `openaiApiKey`.
- Config setup failures use `core.setFailed("Setup error: ...")`.
- `npm run all` is still the full validation gate.
- Workspace may not be a git repository; story baseline may be `NO_VCS`, and `scripts/check-dist.mjs` only runs `git diff` when `.git` exists.

### Project Structure Notes

- Implementation code lives at project root, not under `_bmad-output`.
- BMad artifacts under `_bmad-output/` are tracking and context only.
- This story should not edit planning artifacts except its own story file and sprint status through the workflow.

## References

- `_bmad-output/planning-artifacts/epics.md#Story 1.3: Trigger Only on Ready-Labeled Issues`
- `_bmad-output/planning-artifacts/architecture.md#GitHub Event Boundary`
- `_bmad-output/planning-artifacts/architecture.md#GitHub Event Handling`
- `_bmad-output/planning-artifacts/architecture.md#Logging Pattern`
- `_bmad-output/planning-artifacts/prds/prd-serminal-2026-06-03/prd.md#FR-1: Trigger on Ready Label`
- `_bmad-output/implementation-artifacts/1-2-configure-action-inputs-and-secrets.md#Dev Agent Record`
- `https://docs.github.com/en/actions/learn-github-actions/contexts`
- `https://docs.github.com/actions/automating-your-workflow-with-github-actions/events-that-trigger-workflows`
- `https://github.com/actions/toolkit`

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `git rev-parse HEAD` - failed because the workspace has no valid git HEAD; baseline recorded as `NO_VCS`.
- `npm test` - red phase failed before implementation because `parseIssueLabeledEvent` did not exist and `action.ts` was not wired to GitHub context.
- `npm test` - passed after implementing fixtures, parser, action orchestration, and Jest mock for `@actions/github`.
- `npm run build` - passed.
- `npm run format:check` - first run failed on new fixtures/tests/source; passed after `npm run format`.
- `npm run lint` - passed.
- `npm audit --json` - passed with 0 vulnerabilities.
- `npm run package` - initially failed because `@actions/github@9` is ESM/export-map incompatible with the current `ncc` bundler; passed after using `@actions/github@6.0.1` with the existing `undici` override.
- `npm run package:check` - passed.
- `npm run all` - passed.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Added safe GitHub Issue labeled fixtures for ready-label and non-ready-label payloads.
- Implemented `parseIssueLabeledEvent` in `src/github-context.ts` with explicit ready/skip results, local type guards, configured ready label matching, and extraction of issue/repository context.
- Updated `src/action.ts` to load config, parse `@actions/github.context`, log safe eligibility or skip metadata, and avoid failure on label mismatch.
- Added parser tests and orchestration tests for default ready label, custom ready label, label mismatch, unsupported event, unsupported payload, and safe logging.
- Added Jest mapping for `@actions/github` because tests run through the current CommonJS Jest preset while production source imports the real package.
- Enabled JSON fixture imports via `resolveJsonModule`.
- Changed `@actions/github` to `^6.0.1` so `ncc` can bundle the Action; `npm audit` remains clean with the existing `undici` override.
- No LLM calls, prechecks, report rendering, GitHub comments, or GitHub mutations were added.

### Change Log

- 2026-06-03: Implemented Ready Label event parsing, safe action orchestration, fixtures, and tests.

### File List

- `src/action.ts`
- `src/github-context.ts`
- `__tests__/action.test.ts`
- `__tests__/github-context.test.ts`
- `__tests__/fixtures/issue-labeled.json`
- `__tests__/fixtures/issue-other-label.json`
- `__tests__/mocks/actions-github.ts`
- `jest.config.js`
- `tsconfig.json`
- `package.json`
- `package-lock.json`
- `dist/index.js`
- `dist/index.js.map`
- `dist/licenses.txt`
