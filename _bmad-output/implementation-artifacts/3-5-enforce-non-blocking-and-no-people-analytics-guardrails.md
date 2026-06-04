---
baseline_commit: 2187ee4694e44804b012658bde1a31ab41b11df6
---

# Story 3.5: Enforce Non-Blocking and No-People-Analytics Guardrails

Status: review

Story Key: `3-5-enforce-non-blocking-and-no-people-analytics-guardrails`

## Story

As a small team lead,
I want the Action to provide feedback without enforcing process or judging people,
So that the team can adopt it without workflow friction.

## Acceptance Criteria

1. Given any preflight run completes, when GitHub state is inspected, then the Action has not removed labels, changed assignees, edited issue body, closed/reopened issues, written files, or created required checks.
2. Given the report language is inspected, when the Issue has low readiness, then the report describes missing context in the work artifact, and it does not blame, score, or name people as causes of readiness problems.
3. Given model output includes people-scoring or mutation suggestions, when validation/rendering occurs, then those suggestions are rejected, ignored, or not rendered, and the final comment remains non-blocking.

## Tasks / Subtasks

- [x] Add a semantic report guardrail boundary for rendered report content. (AC: 2, 3)
  - [x] Create `src/report-guardrails.ts` with one responsibility: accept a structurally validated `PreflightReport` only when all renderable text is safe for an advisory, artifact-focused comment.
  - [x] Use a generic guardrail error that never includes rejected model content.
  - [x] Inspect every renderable field: missing-context category/detail, risk explanation, suggested questions, and draft acceptance criteria.
  - [x] Reject reports that blame, score, rate, or name people as the cause of readiness problems.
  - [x] Reject reports that instruct GitHub mutations or workflow gates, including label, assignee, issue body/state, file, pull request, or required-check changes.
  - [x] Avoid broad single-keyword blocking that would reject benign context such as asking which label triggers a workflow or which file is in scope.

- [x] Connect semantic guardrails to orchestration before rendering and posting. (AC: 2, 3)
  - [x] Preserve the LLM path order: analyze, structurally validate, apply conservative status policy, enforce semantic guardrails, render, create comment.
  - [x] Ensure unsafe LLM reports fail with a clear safe log reason and do not post a comment.
  - [x] Do not log rejected report text, Issue content, raw provider output, tokens, or error details.
  - [x] Keep deterministic precheck reports safe and compatible with the same render/post path.

- [x] Reinforce prompt and structured-output guardrails without relying on them as the only enforcement layer. (AC: 2, 3)
  - [x] Keep Issue title/body framed as untrusted task data.
  - [x] Keep strict structured output limited to analysis fields and exclude mutation or people-analytics fields.
  - [x] Explicitly instruct the model to use artifact-focused language and never suggest workflow gates or personal evaluation.

- [x] Prove the GitHub write boundary remains advisory and non-blocking. (AC: 1, 3)
  - [x] Keep `src/github-comments.ts` as the only module that calls a GitHub write API.
  - [x] Keep `issues.createComment` as the only allowed GitHub mutation.
  - [x] Assert no label, assignee, issue edit/state, file, pull request, check, update-comment, or delete-comment API is called.
  - [x] Assert the example workflow requests only `issues: write` and does not request write permissions for checks, contents, pull requests, or other state.
  - [x] Do not interpret non-blocking as suppressing valid setup, provider, validation, guardrail, or comment API failures; failures may call `core.setFailed` but must not mutate GitHub state.

- [x] Add focused tests for semantic safety and final-comment behavior. (AC: 1, 2, 3)
  - [x] Add `__tests__/report-guardrails.test.ts` for people-scoring, blame, named-person causality, mutation suggestions, safe artifact-focused language, and benign context mentions.
  - [x] Extend `__tests__/action.test.ts` to assert unsafe structured output does not call `createComment`, does not call forbidden mutations, and produces only safe logs.
  - [x] Assert safe reports are still rendered and posted unchanged after guardrail enforcement.
  - [x] Preserve existing prompt-injection, schema, renderer, append-only comment, skip-path, and API-failure coverage.

- [x] Preserve scope and architecture boundaries. (AC: 1, 2, 3)
  - [x] Do not add labels, assignees, issue body/state, files, checks, pull request, workflow-state, dashboard, or people-analytics behavior.
  - [x] Do not add a backend, database, GitHub App, codebase scan, update-in-place comments, retries, or new dependencies.
  - [x] Keep `report-schema.ts` focused on structural trust; do not turn it into a brittle natural-language keyword filter.
  - [x] Keep `report-renderer.ts` focused on rendering already-approved `PreflightReport` data.
  - [x] Regenerate the committed `dist/index.js` Action bundle after source changes.

- [x] Run the local validation gate.
  - [x] Run `rtk npm test`.
  - [x] Run `rtk npm run build`.
  - [x] Run `rtk npm run all`.

## Dev Notes

### Scope Boundary

Story 3.5 closes the semantic safety gap left after structural schema validation. A provider report can match the schema while still containing blame, people scoring, or instructions such as removing a label or creating a required check. Those strings must not reach the final GitHub comment.

This story does not add a process gate. A failed setup, provider call, invalid report, unsafe report, or comment API call may still fail the Action with `core.setFailed`; non-blocking means the Action does not mutate workflow or repository state beyond the allowed advisory Issue comment.

### Recommended Design

Add a dedicated semantic guardrail module rather than mixing natural-language policy into `report-schema.ts`, `report-renderer.ts`, or `github-comments.ts`.

Recommended contract:

```ts
export class ReportGuardrailError extends Error

export function enforceReportGuardrails(
  report: PreflightReport
): PreflightReport
```

The function should either return the original approved report or throw a generic safe error. Rejecting the whole unsafe report is preferred over partially filtering text because partial filtering can create inconsistent or misleading comments.

Use phrase/pattern-based checks that express unsafe intent. Do not reject a report merely because it contains words such as `label`, `file`, `owner`, or `check`; those words can appear in legitimate readiness questions.

### Current Code State

- `src/llm-client.ts` already instructs the model not to score, blame, or evaluate people and not to suggest GitHub mutations.
- `src/report-schema.ts` rejects unexpected mutation-shaped fields but accepts arbitrary non-empty text inside valid fields.
- `src/report-renderer.ts` safely escapes Markdown/HTML-shaped text but does not evaluate semantic safety.
- `src/action.ts` currently follows `analyze -> validate -> conservative status -> render -> create comment`.
- `src/github-comments.ts` is the only GitHub write boundary and calls only `issues.createComment`.
- `examples/workflow.yml` currently requests only `issues: write`.

### Regression Risks

- Do not block benign questions such as "Which label triggers the workflow?" or "Which file should change?"
- Check all text fields that can be rendered, not only suggested questions.
- Normalize case and whitespace before matching unsafe intent.
- Never include rejected content in logs or error messages.
- Keep deterministic precheck reports working.
- Do not weaken Story 3.4 behavior: append-only comments and safe comment API failure handling remain required.

### Previous Story Intelligence

Story 3.4 established the only GitHub write adapter, append-only comment posting, safe success/failure logs, and direct tests for forbidden update/delete mutations. Its review showed that negative safety claims should be proven directly in tests and that orchestration tests should assert the final posted Markdown body, not only intermediate status logs.

### Architecture Compliance

- `action.ts`: orchestration only.
- `report-schema.ts`: structural validation only.
- `report-guardrails.ts`: semantic advisory-language and no-mutation policy.
- `report-renderer.ts`: Markdown rendering only.
- `github-comments.ts`: the only GitHub write boundary; create Issue comment only.
- Use existing TypeScript/Jest patterns and add no dependency.

### Testing Requirements

High-value cases:

- Reject blame and people-scoring language in each renderable field.
- Reject named-person causality and mutation/gate instructions.
- Allow artifact-focused language and benign mentions of labels, files, permissions, and checks.
- Unsafe LLM output does not create a comment or call any forbidden GitHub API.
- Guardrail failure logs use a safe fixed reason and never echo model content.
- Safe reports still render and post exactly as expected.
- Workflow permissions remain `issues: write` only.

### Project Structure Notes

Expected files:

- Add: `src/report-guardrails.ts`
- Add: `__tests__/report-guardrails.test.ts`
- Modify: `src/action.ts`
- Modify: `src/llm-client.ts`
- Modify: `__tests__/action.test.ts`
- Modify: `__tests__/llm-client.test.ts`
- Modify: `__tests__/workflow-example.test.ts`
- Modify: `dist/index.js` and `dist/index.js.map` through the existing package command
- Avoid modifying: `src/report-schema.ts`, `src/report-renderer.ts`, `src/github-comments.ts`, package files, Action inputs, or permissions.

### References

- `_bmad-output/planning-artifacts/epics.md` - Epic 3 and Story 3.5 acceptance criteria.
- `_bmad-output/planning-artifacts/prds/prd-serminal-2026-06-03/prd.md` - FR11, FR12, NFR3, NFR4, NFR5, and product guardrails.
- `_bmad-output/planning-artifacts/prds/prd-serminal-2026-06-03/addendum.md` - one-comment output and no-mutation guardrails.
- `_bmad-output/planning-artifacts/architecture.md` - GitHub write boundary, schema/rendering boundaries, safe logging, and non-blocking workflow behavior.
- `_bmad-output/implementation-artifacts/3-4-post-report-as-append-only-github-issue-comment.md` - previous story patterns and review learnings.
- `_bmad-output/implementation-artifacts/deferred-work.md` - Story 2.5 deferred non-blaming language enforcement to Story 3.5.
- `src/action.ts`, `src/llm-client.ts`, `src/report-schema.ts`, `src/report-renderer.ts`, `src/github-comments.ts` - current implementation boundaries.

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Implementation Plan

- Add a dedicated semantic guardrail module that returns safe reports unchanged and rejects unsafe reports with a generic error.
- Apply guardrails immediately before rendering so deterministic and LLM reports share the same final-comment safety boundary.
- Expand tests to prove unsafe language never posts and forbidden GitHub mutations remain unused.

### Debug Log References

- RED: focused tests failed because `report-guardrails.ts` did not exist and unsafe blame language was posted.
- GREEN: focused semantic, orchestration, prompt, workflow, and GitHub adapter suites passed with 56 tests.
- Validation: `rtk npm test` passed with 11 suites and 127 tests; `rtk npm run build`, format, lint, and package generation passed.
- `rtk npm run all` reached `package:check` and reported the expected uncommitted `dist/index.js` diff generated by this story.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Added a semantic report guardrail boundary that rejects blame, people scoring, named-person causality, mutation suggestions, and workflow gates before Markdown rendering.
- Preserved artifact-focused safe reports, benign readiness questions, deterministic precheck reports, and the existing append-only comment flow.
- Reinforced LLM instructions while keeping structural schema validation and Markdown rendering responsibilities unchanged.
- Proved the only source GitHub write remains `issues.createComment` and expanded tests for all forbidden mutation categories and least-privilege workflow permissions.

### File List

- `src/report-guardrails.ts`
- `src/action.ts`
- `src/llm-client.ts`
- `__tests__/report-guardrails.test.ts`
- `__tests__/action.test.ts`
- `__tests__/llm-client.test.ts`
- `__tests__/github-comments.test.ts`
- `__tests__/mocks/actions-github.ts`
- `__tests__/workflow-example.test.ts`
- `dist/index.js`
- `dist/index.js.map`
- `_bmad-output/implementation-artifacts/3-5-enforce-non-blocking-and-no-people-analytics-guardrails.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Change Log

- 2026-06-04: Story created and marked ready for development.
- 2026-06-04: Implemented semantic non-blocking and no-people-analytics guardrails and marked ready for review.
