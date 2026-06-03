---
baseline_commit: NO_VCS
---

# Story 1.5: Prevent Obvious Duplicate Concurrent Runs

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a repo maintainer,
I want overlapping Ready Label runs to avoid duplicate reports where practical,
so that users do not lose trust from repeated comments.

## Acceptance Criteria

1. Given the workflow example is installed, when the same Issue triggers rapid repeated labeled events, then the workflow uses GitHub Actions concurrency guidance keyed by issue identity where available, and duplicate prevention limitations are documented.
2. Given duplicate prevention cannot fully guarantee one comment in every edge case, when setup docs describe the behavior, then the risk is explicitly documented, and the implementation still avoids intentional duplicate posting paths inside one Action run.

## Tasks / Subtasks

- [x] Add a copy-paste workflow example with issue-scoped concurrency. (AC: 1)
  - [x] Create or update `examples/workflow.yml`.
  - [x] Use `on: issues` with `types: [labeled]`.
  - [x] Include a job-level `if` guard for the configured Ready Label and PR skip, for example `github.event.label.name == 'ready-for-dev' && !github.event.issue.pull_request`.
  - [x] Add `concurrency.group` keyed by workflow plus repository and issue number, for example `${{ github.workflow }}-${{ github.repository }}-issue-${{ github.event.issue.number }}`.
  - [x] Set `cancel-in-progress: true`.
  - [x] Include required Action inputs: `github-token`, `openai-api-key`, and optional `ready-label`.
  - [x] Use least-privilege permissions for the current MVP state. If no GitHub write occurs yet, document why `issues: write` may be needed by later report-comment stories but avoid implying current code posts comments.
- [x] Document duplicate-prevention behavior and limitations. (AC: 1, 2)
  - [x] Update `README.md` or create the smallest appropriate docs section if README already has setup guidance.
  - [x] State that workflow-level concurrency cancels overlapping runs for the same issue in the same workflow.
  - [x] State that concurrency is best-effort and cannot guarantee exactly one future comment in every race, rerun, manual dispatch, or differently configured workflow.
  - [x] State that the Action itself remains append-only/non-blocking and does not mutate labels, assignees, issue body, checks, files, PRs, or issue state.
  - [x] Do not claim update-in-place comments, durable locks, databases, or perfect deduplication.
- [x] Add automated checks for the workflow example/docs. (AC: 1, 2)
  - [x] Add or update tests under `__tests__/` to assert `examples/workflow.yml` contains `issues.labeled`, issue-number concurrency group, `cancel-in-progress: true`, ready-label guard, and PR guard.
  - [x] Add or update tests to assert duplicate-prevention documentation mentions limitations.
  - [x] Prefer direct file-content assertions in Jest; do not add a YAML parser dependency unless it is already present or absolutely necessary.
- [x] Preserve existing routing behavior. (AC: 2)
  - [x] Do not modify `src/github-context.ts` unless a test proves Story 1.5 needs it.
  - [x] Do not add GitHub comment creation, LLM calls, deterministic prechecks, report rendering, report schema validation, or API write modules in this story.
  - [x] Confirm current ready-label, label mismatch, PR skip, unsupported event, and unsupported payload tests still pass.
- [x] Verify generated artifacts and status. (AC: 1, 2)
  - [x] Run `npm run format:check`.
  - [x] Run `npm run lint`.
  - [x] Run `npm test`.
  - [x] Run `npm run build`.
  - [x] Run `npm run package`.
  - [x] Run `npm run package:check`.
  - [x] Run `npm run all`.
  - [x] Record exact commands and caveats in the Dev Agent Record.

## Dev Notes

### Scope Boundary

This story is about obvious duplicate prevention for the install workflow, not full deduplication inside the Action.

Implement workflow guidance and tests for that guidance. Do not build durable locks, databases, issue-comment lookup/update behavior, GitHub Actions REST API cancellation, or report-comment deduplication. Those would require architecture/PRD changes and belong after the MVP proves the report flow.

The current Action still does not post comments. The story should make future duplicate report risk lower once Epic 3 adds comment creation, without pretending reports exist today.

### Source Context

- Epic 1 covers the installable Ready Label Action and includes duplicate concurrent-run prevention as Story 1.5. [Source: `_bmad-output/planning-artifacts/epics.md#Epic 1: Installable Ready-Label Action`]
- Story 1.5 requires GitHub Actions concurrency guidance keyed by issue identity where available and explicit limitation documentation. [Source: `_bmad-output/planning-artifacts/epics.md#Story 1.5: Prevent Obvious Duplicate Concurrent Runs`]
- FR3 requires avoiding duplicate Preflight Reports caused by overlapping runs for the same Issue. [Source: `_bmad-output/planning-artifacts/epics.md#Requirements Inventory`]
- Architecture chooses append-only comments for the prototype and defers update-in-place. [Source: `_bmad-output/planning-artifacts/architecture.md#Architecture Assumptions`]
- Architecture requires no backend, database, dashboard, GitHub App, label mutation, check mutation, or file mutation in MVP. [Source: `_bmad-output/planning-artifacts/architecture.md#Technical Constraints & Dependencies`]

### Current Code State

Stories 1.1-1.4 are done:

- `action.yml` uses `runs.using: node24` and `main: dist/index.js`.
- `action.yml` declares `github-token`, `openai-api-key`, and optional `ready-label` defaulting to `ready-for-dev`.
- `src/config.ts` loads and masks required inputs.
- `src/github-context.ts` parses `issues.labeled`, extracts issue/repository context, skips label mismatch, skips PR payloads via `issue.pull_request`, skips unsupported events, and skips malformed payloads.
- `src/action.ts` only orchestrates config loading and parser routing logs.
- There is no `github-comments.ts` yet, and no GitHub write path exists.
- `__tests__/fixtures/pull-request-labeled.json` exists and should be reused for PR skip context if useful.
- `npm run all` passed after Story 1.4.

### Architecture Compliance

Follow these decisions exactly:

- Keep `action.ts` orchestration-only.
- Keep GitHub event parsing in `github-context.ts`.
- Do not add GitHub writes in this story.
- No module except future `github-comments.ts` may create GitHub Issue comments.
- No label, assignee, issue body, issue state, file, check, PR, or workflow state mutation.
- Use safe logging only; this story should not add logs unless necessary.
- Place examples under `examples/` and docs under `README.md` or `docs/` according to existing project structure.
- Tests live under `__tests__/`.

### Latest Technical Notes

- GitHub Actions supports `concurrency` with a dynamic `group` expression and `cancel-in-progress: true`. [External source: `https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions#concurrency`]
- GitHub warns concurrency group names should be unique enough to avoid canceling runs from other workflows; include `${{ github.workflow }}` in the group. [External source: `https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions#example-only-cancel-in-progress-jobs-or-runs-for-the-current-workflow`]
- GitHub Actions `issues` workflows can use the `labeled` activity type. [External source: `https://docs.github.com/actions/reference/workflows-and-actions/workflow-syntax#using-activity-types`]

### Implementation Guidance

Recommended workflow shape:

```yaml
name: Dev Ticket Preflight

on:
  issues:
    types: [labeled]

permissions:
  issues: write

jobs:
  preflight:
    if: ${{ github.event.label.name == 'ready-for-dev' && !github.event.issue.pull_request }}
    runs-on: ubuntu-latest
    concurrency:
      group: ${{ github.workflow }}-${{ github.repository }}-issue-${{ github.event.issue.number }}
      cancel-in-progress: true
    steps:
      - uses: actions/checkout@v4
      - uses: your-org/dev-ticket-preflight@v0
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
          ready-label: ready-for-dev
```

If `actions/checkout@v4` is not required by current implementation because the Action does not read repository files, either omit it or document it as optional. If omitted, `contents: read` is not needed.

The example may use a placeholder Action reference, but it must be clearly copy-paste adaptable and must not contain real secrets.

### Documentation Requirements

Document these exact concepts:

- `concurrency.group` is keyed by workflow/repository/issue number to reduce duplicate same-issue runs.
- `cancel-in-progress: true` cancels an older overlapping run when a newer run enters the same group.
- This reduces obvious duplicate reports but is not a durable exactly-once guarantee.
- Duplicate comments may still occur through manual reruns, separate workflows with different concurrency groups, changed workflow examples, future append-only behavior, or races outside GitHub Actions concurrency.
- MVP does not remove labels, edit issues, write files, create checks, assign users, or block development.

Avoid wording that says "guarantees one report" or "prevents all duplicates."

### Testing Requirements

Add Jest tests that read the example/docs files using Node `fs` APIs. Recommended checks:

- `examples/workflow.yml` exists.
- It includes `issues` plus `labeled`.
- It includes `github.event.label.name == 'ready-for-dev'`.
- It includes `!github.event.issue.pull_request`.
- It includes `concurrency`, `github.event.issue.number`, and `cancel-in-progress: true`.
- It passes `github-token`, `openai-api-key`, and `ready-label`.
- Docs mention both duplicate prevention and limitation language.

Do not add network calls or external API calls in tests.

### Security and Guardrails

- Do not introduce new secrets beyond `GITHUB_TOKEN` and `OPENAI_API_KEY` in examples.
- Do not hardcode any real token or API key.
- Do not add repo code scanning or issue comment inclusion.
- Do not include private issue body examples in docs/tests.
- Keep examples synthetic.

### Previous Story Intelligence

Story 1.4 established these patterns and caveats:

- PR-backed Issues are skipped explicitly via `reason: "pull_request"`.
- `parseIssueLabeledEvent()` remains the routing parser and normal skip paths do not fail the Action.
- `action.ts` only logs safe routing metadata.
- `npm run all` is the full validation gate.
- `package:check` uses `git diff --exit-code -- dist/index.js`; after `npm run package`, `dist/index.js` may need to be staged for this check to pass in a dirty working tree.
- Workspace has no valid git `HEAD`; story baseline may remain `NO_VCS`.

### Dependencies and Hand-Off to Later Stories

- Epic 2 will add deterministic prechecks and LLM-bound issue analysis.
- Epic 3 will add Markdown rendering and append-only GitHub Issue comments; the concurrency example from this story becomes more important once comments exist.
- Epic 4 will expand complete setup, permissions, data-handling, troubleshooting, examples, and release documentation.
- If future stories add update-in-place comments or durable duplicate detection, update PRD/architecture first.

### Project Structure Notes

- Implementation code lives at project root, not under `_bmad-output`.
- BMad artifacts under `_bmad-output/` are tracking and context only.
- This story should not edit planning artifacts except its own story file and sprint status through the workflow.

## References

- `_bmad-output/planning-artifacts/epics.md#Story 1.5: Prevent Obvious Duplicate Concurrent Runs`
- `_bmad-output/planning-artifacts/architecture.md#Architecture Assumptions`
- `_bmad-output/planning-artifacts/architecture.md#GitHub API Writes`
- `_bmad-output/planning-artifacts/architecture.md#Development Workflow Integration`
- `_bmad-output/implementation-artifacts/1-4-ignore-pull-requests-and-unsupported-payloads.md#Dev Agent Record`
- `https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions#concurrency`
- `https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions#example-only-cancel-in-progress-jobs-or-runs-for-the-current-workflow`
- `https://docs.github.com/actions/reference/workflows-and-actions/workflow-syntax#using-activity-types`

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm test -- --runTestsByPath __tests__/workflow-example.test.ts` - red phase failed because `examples/workflow.yml` did not exist.
- `npm test -- --runTestsByPath __tests__/workflow-example.test.ts` - passed after adding `examples/workflow.yml` and README duplicate-prevention docs.
- `rg -n "github-comments|createComment|issues\\.createComment|addLabels|removeLabel|assignees|checkRuns|pulls\\." src __tests__ examples README.md` - no matches, confirming no new GitHub write/mutation path was added.
- `npm run format:check` - initially failed on `__tests__/workflow-example.test.ts`.
- `npm run format -- __tests__/workflow-example.test.ts README.md examples/workflow.yml` - formatted the new test and left other files unchanged.
- `npm run format:check` - passed after formatting.
- `npm run lint` - passed.
- `npm test` - passed, 4 test suites and 19 tests.
- `npm run build` - passed.
- `npm run package` - passed.
- `npm run package:check` - passed.
- `npm run all` - passed.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Added `examples/workflow.yml` with `issues.labeled`, Ready Label and PR guards, issue-scoped concurrency, `cancel-in-progress: true`, and required Action inputs.
- Updated `README.md` with workflow setup notes, permission caveat for future Issue comments, duplicate-prevention behavior, and best-effort limitations.
- Added `__tests__/workflow-example.test.ts` to assert workflow and docs contain the required concurrency, guard, input, and limitation language.
- Preserved existing routing source modules; no Action code, parser code, LLM path, precheck path, report rendering, comment creation, or GitHub mutation path was added.

### Change Log

- 2026-06-03: Story created and marked ready-for-dev.
- 2026-06-03: Implemented workflow concurrency example, duplicate-prevention docs, and content tests.

### File List

- `README.md`
- `examples/workflow.yml`
- `__tests__/workflow-example.test.ts`
