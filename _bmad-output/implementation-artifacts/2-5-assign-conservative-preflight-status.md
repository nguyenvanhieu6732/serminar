---
baseline_commit: 955b651
---

# Story 2.5: Assign Conservative Preflight Status

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an issue owner,
I want a conservative readiness status,
so that vague Issues are not incorrectly treated as ready for implementation.

## Acceptance Criteria

1. Given no material missing context is detected, when the report is normalized, then status is `ready`.
2. Given the Issue is understandable but lacks important details, when the report is normalized, then status is `needs_clarification`.
3. Given the Issue is too vague to safely implement, when the report is normalized, then status is `high_risk`.
4. Given any status is rendered later, when the report language is inspected, then it does not blame or score the Issue Owner.

## Tasks / Subtasks

- [x] Add a conservative status policy after schema validation. (AC: 1, 2, 3)
  - [x] Implement a pure function in `src/report-schema.ts`, or a tightly scoped adjacent helper if that proves cleaner, that accepts a validated `PreflightReport` and returns a `PreflightReport` with a policy-normalized `status`.
  - [x] Apply policy after `validatePreflightReport(rawReport)` in `src/action.ts`, before logging success and before any future renderer/comment path.
  - [x] Preserve the current schema boundary: `llm-client.ts` returns parsed raw provider output only; it must not own status policy.
  - [x] Do not run the policy on malformed provider output; invalid schema must still fail as `invalid_report`.
- [x] Define deterministic conservative status rules. (AC: 1, 2, 3)
  - [x] If `missing_context.length === 0`, normalize status to `ready`.
  - [x] If `missing_context.length > 0` and the provider status is `ready`, downgrade to `needs_clarification`.
  - [x] If `missing_context.length > 0` and `confidence === "low"`, normalize to `high_risk`.
  - [x] If provider status is `high_risk` and missing context exists, preserve `high_risk`.
  - [x] Otherwise, preserve or normalize to `needs_clarification` for understandable-but-incomplete reports.
  - [x] Keep deterministic precheck reports for empty/short bodies as `high_risk`; do not soften them.
- [x] Keep language and mutation guardrails intact. (AC: 4)
  - [x] Ensure any new status policy text, test names, logs, and helper names describe the work artifact, not the issue author or owner.
  - [x] Do not add people scoring, ratings, dashboards, labels, assignees, checks, issue edits, file writes, or workflow gates.
  - [x] Do not render Markdown or post GitHub comments in this story; Epic 3 owns renderer and comment posting.
- [x] Add focused tests for status policy behavior. (AC: 1, 2, 3, 4)
  - [x] Extend `__tests__/report-schema.test.ts` or add a focused status-policy test file under `__tests__/` using existing Jest patterns.
  - [x] Assert missing context blocks `ready` and downgrades to `needs_clarification` unless low confidence or explicit high risk makes it `high_risk`.
  - [x] Assert no missing context normalizes to `ready`.
  - [x] Assert low confidence plus missing context normalizes to `high_risk`.
  - [x] Assert deterministic precheck reports remain `high_risk` for empty/short bodies.
  - [x] Assert serialized reports and logs do not contain blame/people-scoring wording such as `owner failed`, `author`, `score`, `rating`, or `blame`.
- [x] Update action orchestration tests. (AC: 1, 2, 3, 4)
  - [x] Valid LLM output with inconsistent `ready` plus `missing_context` should log the normalized final status, not the unsafe raw status.
  - [x] Valid LLM output with no `missing_context` should log `ready`.
  - [x] Existing skip paths and safe failure paths must remain unchanged: label mismatch, pull request payload, unsupported payload, empty body, short body, long body truncation metadata, custom ready label, missing config, provider error, malformed JSON, and invalid schema.
- [x] Run the local validation gate and refresh generated artifacts if implementation changes bundled output.
  - [x] Run `npm run format:check`.
  - [x] Run `npm run lint`.
  - [x] Run `rtk npm test`.
  - [x] Run `rtk npm run build`.
  - [x] Run `npm run package`.
  - [x] Run `npm run package:check`.
  - [x] Run `rtk npm run all`.
  - [x] If `package:check` fails because `dist/index.js` was regenerated but not staged, stage only `dist/index.js` and rerun the package check.
  - [x] Record exact commands, failures, and environment caveats in the Dev Agent Record.

### Review Findings

- [x] [Review][Defer] Enforce non-blaming report language before rendering [src/report-schema.ts:70] — deferred to Story 3.5, where rendered report language and no-people-analytics guardrails are owned. Schema validation remains focused on structural trust boundaries rather than brittle natural-language keyword filtering or sanitization.

## Dev Notes

### Scope Boundary

This story refines status assignment after a provider report is schema-valid. It must not expand into Markdown rendering or GitHub comment creation. The end state should be: deterministic prechecks still produce conservative reports for empty/short bodies; valid LLM output is validated into `PreflightReport`; then local code applies a conservative status policy so an inconsistent raw provider status cannot mark an incomplete issue as `ready`.

The policy is local product logic. It should not be treated as another provider instruction and should not require a new dependency.

### Source Context

- Epic 2 objective: provide Issue title/body readiness analysis with conservative status, missing-context detection, schema validation, prompt-injection-safe handling, and cost control. [Source: `_bmad-output/planning-artifacts/epics.md#Epic 2: Issue Readiness Analysis`]
- Story 2.5 requires `ready`, `needs_clarification`, and `high_risk` to be assigned conservatively after normalization. [Source: `_bmad-output/planning-artifacts/epics.md#Story 2.5: Assign Conservative Preflight Status`]
- PRD FR6 says `Ready` is only for reports with no material missing context, `Needs Clarification` is for understandable issues lacking details, and `High Risk` is for issues too vague to safely implement. [Source: `_bmad-output/planning-artifacts/prds/prd-serminal-2026-06-03/prd.md#FR-6: Produce Conservative Status`]
- PRD FR12 requires readiness language to evaluate issue clarity rather than individual performance. [Source: `_bmad-output/planning-artifacts/prds/prd-serminal-2026-06-03/prd.md#FR-12: Avoid People Analytics`]
- Architecture status naming uses internal lowercase snake_case values and rendered title-case labels later. [Source: `_bmad-output/planning-artifacts/architecture.md#Naming Patterns`]
- Architecture assigns `report-schema.ts` ownership of `PreflightReport` type and validation; renderer/comment work belongs to separate modules. [Source: `_bmad-output/planning-artifacts/architecture.md#Schema Boundary`]

### Current Code State

- `src/report-schema.ts` defines `PreflightStatus`, `Confidence`, `PreflightReport`, `PreflightReportValidationError`, and `validatePreflightReport(raw: unknown): PreflightReport`.
- `validatePreflightReport()` currently validates shape, trims strings, rejects unexpected top-level and nested fields, rejects blank required nested fields, enforces exact enums, and returns the provider's status value after enum validation.
- `src/llm-client.ts` requests strict structured output with `PREFLIGHT_REPORT_RESPONSE_FORMAT` and includes an instruction to use `ready` only when no material missing context is detected. That prompt is useful but not sufficient; Story 2.5 should add local policy after validation.
- `src/action.ts` currently calls `validatePreflightReport(rawReport)` and logs `LLM structured analysis validated for issue #...: ${report.status}.`
- `src/prechecks.ts` returns deterministic `high_risk` reports for empty and short bodies. Preserve this behavior.
- `src/report-renderer.ts` is still a placeholder. Do not expand it in this story.
- `src/github-comments.ts` remains the future GitHub write boundary. Do not add writes here or elsewhere in this story.

### Recommended Implementation Shape

Prefer a pure helper owned near the schema contract:

```ts
export function applyConservativeStatusPolicy(
  report: PreflightReport
): PreflightReport {
  const status = determineConservativeStatus(report)
  return status === report.status ? report : { ...report, status }
}
```

Recommended status decision table:

| Validated report facts | Normalized status |
| --- | --- |
| `missing_context.length === 0` | `ready` |
| `missing_context.length > 0` and `confidence === "low"` | `high_risk` |
| `missing_context.length > 0` and raw status is `high_risk` | `high_risk` |
| `missing_context.length > 0` and raw status is `ready` | `needs_clarification` |
| `missing_context.length > 0` otherwise | `needs_clarification` |

Then in `action.ts`:

```ts
const validatedReport = validatePreflightReport(rawReport)
const report = applyConservativeStatusPolicy(validatedReport)

core.info(
  `LLM structured analysis validated for issue #${llmInput.logMetadata.issueNumber}: ${report.status}.`
)
```

Do not log the raw provider status. If a future dev wants status-change observability, it must use only safe enum values and should be added deliberately; this story does not need that log.

### Architecture Compliance

Follow these boundaries exactly:

- `llm-client.ts` owns provider communication and raw JSON parsing only.
- `report-schema.ts` owns report contract validation and is the best current home for status policy because no separate policy module exists in the architecture.
- `action.ts` remains orchestration only. It may call the policy helper and log final safe status.
- `report-renderer.ts` must not be expanded for this story.
- `github-comments.ts` is still the only module allowed to write to GitHub, and it should not be invoked here.
- No new dependency should be added for this policy; the rules are simple deterministic TypeScript.

### Previous Story Intelligence

Story 2.4 added the schema trust boundary and review patches tightened it. Important learnings to carry forward:

- `validatePreflightReport()` now rejects unexpected nested fields and blank required nested strings. Do not reintroduce silent dropping of invalid nested content.
- Provider raw output is parsed in `llm-client.ts` but validated in `action.ts`. Keep schema/policy ownership outside `llm-client.ts`.
- Invalid provider JSON, missing `output_text`, invalid schema, and mutation-shaped output fail as `invalid_report` without exposing raw model output.
- Provider errors still fail as `provider_error`; do not collapse provider errors into status policy.
- Empty and short bodies skip the LLM and already return deterministic `high_risk` reports from `prechecks.ts`.
- Safe logs may include issue number and final validated status; logs must not include title/body, prompt, raw response, webhook payload, `github-token`, or `openai-api-key`.
- `package:check` may require generated `dist/index.js` to be staged because it compares bundled output to the staged file.
- Deferred size limits for provider reports belong to the future rendering/comment story, not Story 2.5. [Source: `_bmad-output/implementation-artifacts/deferred-work.md`]

### Git / Workspace Notes

Recent commits:

- `955b651 feat: implement LLM-based action handling and report schema validation with associated test suites`
- `bd68d36 chore: update package-lock.json dependencies`
- `8a041e9 feat: integrate OpenAI structured output provider for readiness analysis and add corresponding LLM client implementation`
- `9115748 feat: implement bounded, untrusted-data-framed LLM input preparation for issue analysis`
- `3a700ab feat: implement deterministic prechecks and action processing logic with supporting test fixtures`

Workspace caveat at story creation time:

- Story 2.4 is currently in `review` status, not `done`. Treat its implemented schema boundary as the immediate predecessor, but do not revert or overwrite any existing workspace changes.
- `AGENTS.md` is untracked and contains project rules for RTK command usage. Treat it as user/workspace context, not as disposable output.

### Testing Guidance

High-value tests:

- Unit test the policy helper with a small report builder so cases are clear and do not rely on provider mocks.
- `ready` plus non-empty `missing_context` normalizes to `needs_clarification`.
- `ready` plus non-empty `missing_context` plus `confidence: "low"` normalizes to `high_risk`.
- `high_risk` plus non-empty `missing_context` stays `high_risk`.
- `needs_clarification` plus non-empty `missing_context` stays `needs_clarification`.
- Any raw status plus empty `missing_context` normalizes to `ready`.
- Empty/short body precheck reports remain `high_risk`.
- Action tests should assert final log status after policy normalization and preserve existing safe logging checks.

Avoid brittle tests that parse private issue body text. Existing tests already use safe metadata and fixture bodies carefully.

### Security and Guardrails

- Treat Issue title/body and all model output as untrusted.
- Do not interpolate Issue content or model output into shell commands.
- Do not log full Issue title/body, bounded body content, prompts, provider requests, raw responses, raw payloads, or secrets.
- Do not add status labels to GitHub, fail required checks, assign users, edit issue state, or write files.
- Do not introduce people scoring or blame language. Status is about the work artifact's readiness only.
- Do not use raw provider status as a workflow gate.

### Project Structure Notes

- Implementation code lives under `src/`; tests live under `__tests__/`.
- If a new module is added, it must be single-responsibility and justified in Dev Agent Record. Prefer extending `report-schema.ts` for this narrow policy.
- BMad artifacts under `_bmad-output/` are tracking/context only.
- No UX document exists; the MVP surface remains GitHub Issues and later Markdown comments.
- No `project-context.md` file was found during story creation, so this story relies on PRD, architecture, epics, prior stories, and current code.
- Do not add web research output for this story; no latest external API behavior is needed to implement deterministic local status policy.

## References

- `_bmad-output/planning-artifacts/epics.md#Story 2.5: Assign Conservative Preflight Status`
- `_bmad-output/planning-artifacts/epics.md#Epic 2: Issue Readiness Analysis`
- `_bmad-output/planning-artifacts/prds/prd-serminal-2026-06-03/prd.md#FR-6: Produce Conservative Status`
- `_bmad-output/planning-artifacts/prds/prd-serminal-2026-06-03/prd.md#FR-12: Avoid People Analytics`
- `_bmad-output/planning-artifacts/prds/prd-serminal-2026-06-03/prd.md#5. Cross-Cutting Non-Functional Requirements`
- `_bmad-output/planning-artifacts/architecture.md#Naming Patterns`
- `_bmad-output/planning-artifacts/architecture.md#Schema Boundary`
- `_bmad-output/planning-artifacts/architecture.md#Architectural Boundaries`
- `_bmad-output/implementation-artifacts/2-4-validate-and-normalize-preflight-report-schema.md`
- `_bmad-output/implementation-artifacts/deferred-work.md`
- `src/report-schema.ts`
- `src/action.ts`
- `src/prechecks.ts`
- `src/llm-client.ts`
- `src/report-renderer.ts`
- `src/github-comments.ts`
- `__tests__/report-schema.test.ts`
- `__tests__/action.test.ts`
- `__tests__/prechecks.test.ts`

## Dev Agent Record

### Agent Model Used

Codex (GPT-5)

### Debug Log References

- RED: Added status policy tests and action log tests; `rtk npm test` failed because `applyConservativeStatusPolicy` was not exported and action still logged the raw validated provider status.
- GREEN: Implemented `applyConservativeStatusPolicy()` in `src/report-schema.ts` and called it in `src/action.ts` after `validatePreflightReport(rawReport)`.
- GREEN validation passed: `rtk npm test` with 8 suites and 86 tests; `rtk npm run build` passed.
- Static validation: `npm run format:check` initially failed on `src/report-schema.ts`; `npm run format -- --write src/report-schema.ts` fixed formatting.
- Static validation passed after formatting: `npm run format:check`, `npm run lint`, `rtk npm test`, and `rtk npm run build`.
- Bundling: `npm run package` refreshed `dist/index.js` and `dist/index.js.map`.
- `npm run package:check` initially failed because regenerated `dist/index.js` was not staged; staged only `dist/index.js`, then `npm run package:check` passed.
- Final validation passed: `rtk npm run all` with format, lint, tests, build, package, and package check.
- Environment caveat: project rules require `rtk npm test`, `rtk npm run build`, and `rtk npm run all` instead of direct `npm test`, `npm run build`, and `npm run all`.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Added local conservative status policy in `src/report-schema.ts` so `missing_context` prevents `ready`, low-confidence incomplete reports normalize to `high_risk`, empty missing context normalizes to `ready`, and explicit high-risk incomplete reports stay `high_risk`.
- Wired `src/action.ts` to apply the policy after schema validation and before safe success logging.
- Preserved invalid schema behavior as `invalid_report` and provider error behavior as `provider_error`.
- Preserved deterministic precheck `high_risk` reports for empty and short bodies.
- Added focused policy tests in `__tests__/report-schema.test.ts`.
- Added action orchestration tests proving final logs use the policy-normalized status.
- Did not add rendering, GitHub comment posting, GitHub mutations, dependencies, people scoring, or workflow gates.
- Refreshed bundled Action output with `npm run package`.

### File List

- `src/report-schema.ts`
- `src/action.ts`
- `__tests__/report-schema.test.ts`
- `__tests__/action.test.ts`
- `dist/index.js`
- `dist/index.js.map`
- `_bmad-output/implementation-artifacts/2-5-assign-conservative-preflight-status.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Change Log

- 2026-06-04: Implemented Story 2.5 conservative status policy, action integration, focused tests, and refreshed bundled artifacts.
