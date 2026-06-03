---
baseline_commit: NO_VCS
---

# Story 1.4: Ignore Pull Requests and Unsupported Payloads

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a repo maintainer,
I want pull requests and unsupported payloads to be ignored,
so that the MVP only evaluates GitHub Issues.

## Acceptance Criteria

1. Given a pull request receives the Ready Label, when the workflow runs, then the Action detects `issue.pull_request` and skips processing, and no Preflight Report comment is posted.
2. Given the event payload is missing required issue or label fields, when the Action parses the event, then it exits with a clear non-processing reason where safe, and it does not mutate labels, assignees, issue body, checks, files, or issue state.

## Tasks / Subtasks

- [ ] Add pull request labeled payload coverage. (AC: 1)
  - [ ] Add `__tests__/fixtures/pull-request-labeled.json` using the GitHub `issues.labeled` shape where the `issue` object contains `pull_request`.
  - [ ] Keep fixture data synthetic and minimal: repository owner/name, issue number, title/body, ready label, and `pull_request` marker.
  - [ ] Do not include real tokens, private issue content, or real user data.
- [ ] Extend `src/github-context.ts` to explicitly skip PR-backed issue payloads. (AC: 1, 2)
  - [ ] Add a skip reason such as `"pull_request"` to `IssueEventParseResult`.
  - [ ] Detect `issue.pull_request` after confirming an `issues.labeled` payload has the required issue, label, and repository fields.
  - [ ] Return `kind: "skipped"` with reason `"pull_request"` and safe metadata such as `issueNumber` and `labelName`.
  - [ ] Preserve existing skip behavior for `unsupported_event`, `unsupported_payload`, and `label_mismatch`.
  - [ ] Continue treating title/body as untrusted data; extract or inspect only what is required for routing.
- [ ] Update `src/action.ts` orchestration logs for the new skip reason. (AC: 1, 2)
  - [ ] Log a clear safe message for PR skip, for example: `Skipping issue #<number>: pull requests are not supported by the MVP.`
  - [ ] Keep `action.ts` orchestration-only; parsing details stay in `github-context.ts`.
  - [ ] Do not call the LLM, run deterministic readiness prechecks, render reports, post comments, or mutate GitHub state.
- [ ] Add focused tests for PR and malformed payload paths. (AC: 1, 2)
  - [ ] Update `__tests__/github-context.test.ts` to assert PR payloads return the explicit `"pull_request"` skip reason.
  - [ ] Keep tests for unsupported event names and malformed payload shapes.
  - [ ] Add or update `__tests__/action.test.ts` to assert PR skip logs safely and does not call `core.setFailed`.
  - [ ] Assert logs do not include full issue body, full payload JSON, token values, OpenAI API key, or private content.
- [ ] Verify no GitHub mutation paths were introduced. (AC: 1, 2)
  - [ ] Confirm no GitHub client/comment module is added or invoked in this story.
  - [ ] Confirm no labels, assignees, issue body, checks, files, PRs, or issue state are mutated.
- [ ] Verify the baseline locally. (AC: 1, 2)
  - [ ] Run `npm run format:check`.
  - [ ] Run `npm run lint`.
  - [ ] Run `npm test`.
  - [ ] Run `npm run build`.
  - [ ] Run `npm run package`.
  - [ ] Run `npm run package:check`.
  - [ ] Run `npm run all`.
  - [ ] Record exact commands and any environment/runtime caveats in the Dev Agent Record.

## Dev Notes

### Scope Boundary

This story only adds explicit non-processing behavior for pull requests and malformed or unsupported payloads in the existing Ready Label event parser path.

Do not implement duplicate prevention, GitHub Actions concurrency guidance, deterministic readiness prechecks, OpenAI calls, prompt construction, report schema validation, Markdown rendering, GitHub Issue comments, documentation, examples, or release tagging in this story.

The expected behavior at the end of this story is still routing-only: eligible GitHub Issues can be recognized for future preflight work, PR-backed issue payloads are clearly skipped, malformed payloads are clearly skipped where safe, and the Action performs no GitHub writes.

### Source Context

- Epic 1 objective: make the Action installable and triggerable in a repository, while keeping PRs out of MVP processing and avoiding duplicate report paths later. [Source: `_bmad-output/planning-artifacts/epics.md#Epic 1: Installable Ready-Label Action`]
- Story 1.4 requires pull requests and unsupported payloads to be ignored so the MVP only evaluates GitHub Issues. [Source: `_bmad-output/planning-artifacts/epics.md#Story 1.4: Ignore Pull Requests and Unsupported Payloads`]
- PRD FR2 requires the system not to produce a Preflight Report for pull requests in MVP. [Source: `_bmad-output/planning-artifacts/epics.md#Requirements Inventory`]
- Architecture requires `github-context.ts` to own event parsing and explicitly skip payloads containing `issue.pull_request`. [Source: `_bmad-output/planning-artifacts/architecture.md#GitHub Event Handling`]
- Architecture requires no module except future `github-comments.ts` to write to GitHub. [Source: `_bmad-output/planning-artifacts/architecture.md#GitHub API Writes`]

### Current Code State

Story 1.3 completed the Ready Label parser and action orchestration:

- `action.yml` declares `github-token`, `openai-api-key`, and optional `ready-label` defaulting to `ready-for-dev`.
- `src/config.ts` exports `DEFAULT_READY_LABEL`, `ActionConfig`, and `loadConfig()`.
- `src/github-context.ts` exports `ReadyIssueContext`, `IssueEventParseResult`, `ParseIssueLabeledEventInput`, and `parseIssueLabeledEvent()`.
- `parseIssueLabeledEvent()` currently accepts only `eventName === "issues"` with `payload.action === "labeled"` and required issue, label, and repository fields.
- Current skip reasons are `"label_mismatch"`, `"unsupported_event"`, and `"unsupported_payload"`.
- `src/action.ts` loads config, parses `@actions/github.context`, logs eligible or skipped routing state, then returns.
- Tests already cover ready label, custom ready label, label mismatch, unsupported event, unsupported payload, setup failure, and safe logging.

This story should extend that shape, not replace it.

### Architecture Compliance

Follow these decisions exactly:

- `action.ts` remains orchestration only. It may branch on parser results and log safe state, but payload shape validation belongs in `github-context.ts`.
- `github-context.ts` owns GitHub event parsing and normalization.
- Only `issues.labeled` payloads are relevant here.
- A GitHub PR labeled through the Issues API appears as an `issues` event whose `issue` object contains `pull_request`; that marker must be treated as PR-backed and skipped.
- No module except future `github-comments.ts` may write to GitHub.
- This story must not add `github-comments.ts` or any Octokit write call.
- Allowed logs include issue number, trigger label, and skip reason. Forbidden logs include full issue body, full prompt, LLM API key, raw private issue comments, raw private issue title/body, and full webhook payload JSON.

### Implementation Guidance

Recommended result shape extension:

```ts
export type IssueEventParseResult =
  | { readonly kind: "ready"; readonly issue: ReadyIssueContext }
  | {
      readonly kind: "skipped"
      readonly reason:
        | "label_mismatch"
        | "pull_request"
        | "unsupported_event"
        | "unsupported_payload"
      readonly labelName?: string
      readonly issueNumber?: number
    }
```

Recommended parser order:

1. If `eventName !== "issues"`, return `unsupported_event`.
2. If payload is not an `issues.labeled` payload with required issue, label, and repository fields, return `unsupported_payload`.
3. Extract safe routing metadata: `labelName` and `issueNumber`.
4. If `payload.issue.pull_request` exists and is an object, return `pull_request`.
5. If `labelName !== readyLabel`, return `label_mismatch`.
6. Otherwise return `ready`.

Detecting `pull_request` before or after label mismatch is acceptable only if tests match the chosen behavior. Prefer checking `pull_request` before label mismatch so a PR carrying the Ready Label cannot be accidentally treated as a normal Issue path.

### Expected Safe Logs

Suggested log messages:

- PR skip: `Skipping issue #<number>: pull requests are not supported by the MVP.`
- Unsupported event/payload: `Skipping run: unsupported event payload for issue label preflight.`
- Existing label mismatch and ready logs may stay as implemented in Story 1.3.

Do not log `issue.title`, `issue.body`, full payload JSON, tokens, or API keys.

### Project Structure Requirements

Expected files to update or add:

```text
src/action.ts
src/github-context.ts
__tests__/action.test.ts
__tests__/github-context.test.ts
__tests__/fixtures/pull-request-labeled.json
dist/index.js
dist/index.js.map
dist/licenses.txt
```

Do not add docs/examples in this story. Do not add new source modules unless the existing parser structure cannot support the change, which is unlikely.

### Testing Requirements

Parser tests should cover:

- `eventName: "issues"` with `payload.action: "labeled"`, matching Ready Label, and `issue.pull_request` returns `kind: "skipped"` with reason `"pull_request"`.
- The PR skip result includes safe metadata: `issueNumber` and `labelName`.
- Malformed payloads missing required issue, label, or repository fields return `"unsupported_payload"`.
- Existing ready, label mismatch, custom ready label, and unsupported event tests continue passing.

Action tests should cover:

- PR payload logs the explicit PR skip message.
- PR payload does not call `core.setFailed`.
- PR payload does not log full issue body or secret values.
- No GitHub write clients or comment calls are introduced.

Do not call external APIs in tests.

### Security and Guardrails

- Treat Issue title/body as untrusted input.
- Do not interpolate issue, label, title, body, or payload content into shell commands.
- Do not mutate labels, assignees, issue body, issue state, repository files, workflow checks, PRs, or comments.
- Do not add `include-comments`.
- Do not read repository files, diffs, linked PRs, or Issue comments.
- Do not post a Preflight Report comment for PR-backed payloads or unsupported payloads.

### Dependencies and Hand-Off to Later Stories

- Story 1.5 owns obvious duplicate/concurrent-run prevention and workflow concurrency guidance.
- Epic 2 owns deterministic prechecks, empty/short body handling, LLM input construction, and report status assignment.
- Epic 3 owns Markdown rendering and append-only GitHub Issue comments.
- `ReadyIssueContext` remains the future input for prechecks and LLM-bound context after PR and malformed payloads are excluded.

### Previous Story Intelligence

Story 1.3 established these implementation patterns and caveats:

- Use `parseIssueLabeledEvent({ eventName, payload, readyLabel })` for testability instead of reading GitHub globals in the parser.
- Use local type guards for `unknown` payloads.
- Keep normal skip paths non-error; do not call `core.setFailed` for label mismatch, unsupported event, unsupported payload, or PR skip.
- Safe logs should include routing metadata only and avoid title/body/payload content.
- `npm run all` is the full validation gate.
- `@actions/github` is pinned to `^6.0.1` because the current `ncc` bundling flow failed with `@actions/github@9`; `npm audit --json` passed with 0 vulnerabilities after the Story 1.3 dependency state.
- Workspace has no valid git `HEAD`; story baseline may be recorded as `NO_VCS`.

### Local Manual Test Caveat

When running `node dist/index.js` locally on PowerShell, `@actions/core` maps input names to environment variables using the input name characters. For kebab-case inputs, use quoted environment names with hyphens:

```powershell
Set-Item -Path "Env:INPUT_GITHUB-TOKEN" -Value "fake-gh-token"
Set-Item -Path "Env:INPUT_OPENAI-API-KEY" -Value "fake-openai-key"
Set-Item -Path "Env:INPUT_READY-LABEL" -Value "ready-for-dev"
```

Using underscores such as `INPUT_GITHUB_TOKEN` will not satisfy `github-token`.

### Project Structure Notes

- Implementation code lives at project root, not under `_bmad-output`.
- BMad artifacts under `_bmad-output/` are tracking and context only.
- This story should not edit planning artifacts except its own story file and sprint status through the workflow.

## References

- `_bmad-output/planning-artifacts/epics.md#Story 1.4: Ignore Pull Requests and Unsupported Payloads`
- `_bmad-output/planning-artifacts/architecture.md#GitHub Event Handling`
- `_bmad-output/planning-artifacts/architecture.md#GitHub API Writes`
- `_bmad-output/planning-artifacts/architecture.md#Logging Pattern`
- `_bmad-output/implementation-artifacts/1-3-trigger-only-on-ready-labeled-issues.md#Dev Agent Record`
- `https://docs.github.com/actions/automating-your-workflow-with-github-actions/events-that-trigger-workflows`
- `https://docs.github.com/en/webhooks/webhook-events-and-payloads#issues`

## Dev Agent Record

### Agent Model Used

TBD

### Debug Log References

TBD

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.

### Change Log

- 2026-06-03: Story created and marked ready-for-dev.

### File List

TBD
