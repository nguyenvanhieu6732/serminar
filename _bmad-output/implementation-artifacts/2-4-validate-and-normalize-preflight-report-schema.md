---
baseline_commit: bd68d36f
---

# Story 2.4: Validate and Normalize Preflight Report Schema

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a repo maintainer,
I want model output validated before use,
so that malformed or unsafe responses cannot leak into GitHub comments.

## Acceptance Criteria

1. Given the LLM returns a valid structured report, when schema validation runs, then the Action normalizes it into `PreflightReport`, and downstream modules receive only validated report data.
2. Given the LLM returns malformed or incomplete output, when schema validation runs, then the Action fails with a clear log message or uses only a safe deterministic fallback, and no misleading Preflight Report is posted.
3. Given the model output includes unexpected fields that could imply GitHub mutations, when schema validation runs, then those fields are rejected or ignored, and labels, assignees, files, checks, PRs, and issue state remain unchanged.

## Tasks / Subtasks

- [x] Implement local schema validation and normalization in `src/report-schema.ts`. (AC: 1, 2, 3)
  - [x] Add an exported validator function such as `validatePreflightReport(raw: unknown): PreflightReport`.
  - [x] Accept only the current `PreflightReport` contract: `status`, `missing_context`, `risk_explanation`, `suggested_questions`, `draft_acceptance_criteria`, `confidence`, and `evidence`.
  - [x] Enforce enum values exactly: `status` is `ready | needs_clarification | high_risk`, `confidence` is `low | medium | high`, and `evidence[].source` is `title | body | precheck`.
  - [x] Require arrays for `missing_context`, `suggested_questions`, `draft_acceptance_criteria`, and `evidence`; require string fields inside each item.
  - [x] Normalize strings by trimming leading/trailing whitespace and removing empty items from arrays where safe.
  - [x] Reject the whole report when required scalar fields are missing, enum values are invalid, nested object shapes are wrong, or the normalized result lacks a meaningful `risk_explanation`.
  - [x] Reject or ignore unexpected fields so model output cannot introduce labels, assignees, files, checks, pull requests, issue comments, issue state changes, Markdown, or workflow gates. Prefer rejection for top-level unexpected fields to keep the boundary explicit.
- [x] Move provider raw-output parsing to a clean validation boundary. (AC: 1, 2)
  - [x] Keep OpenAI request construction and `output_text` extraction in `src/llm-client.ts`.
  - [x] Do not let `OpenAiLlmClient.analyzeIssue()` cast `JSON.parse()` directly to `RawStructuredPreflightReport` without local validation.
  - [x] Either have `OpenAiLlmClient` return `unknown`/raw structured output and validate in `action.ts`, or have it call `validatePreflightReport()` before returning. Choose the option that best preserves the architecture boundary: provider communication in `llm-client.ts`, schema ownership in `report-schema.ts`.
  - [x] Keep provider errors and validation errors distinguishable in logs without exposing raw model output.
- [x] Wire validation into `src/action.ts` after successful LLM response and before any future rendering/comment path. (AC: 1, 2, 3)
  - [x] Replace the current `validation deferred` success state with a validated-report success state.
  - [x] Log only safe metadata: issue number and validated status are allowed; raw title/body, prompt, provider request, raw response, secrets, and raw payload are forbidden.
  - [x] On malformed JSON, missing `output_text`, invalid schema, or unsafe mutation-shaped output, call `core.setFailed()` with a clear safe message and return.
  - [x] Do not post a GitHub comment, render Markdown, mutate labels/assignees/issues/files/checks, or create a fallback comment in this story.
- [x] Add focused `report-schema` tests. (AC: 1, 2, 3)
  - [x] Create `__tests__/report-schema.test.ts` if it does not exist.
  - [x] Assert a valid provider-shaped report normalizes into a `PreflightReport` with trimmed strings.
  - [x] Assert invalid enum values, missing required fields, wrong nested item shapes, non-array list fields, non-string text/detail fields, and empty `risk_explanation` are rejected.
  - [x] Assert unexpected top-level fields that imply GitHub mutation or rendering (`labels`, `assignees`, `checks`, `files`, `pull_requests`, `issue_comments`, `issue_state`, `markdown`, `comment_body`) are rejected or stripped according to the chosen validator contract.
  - [x] Assert validation failure errors are generic and do not echo private field values.
- [x] Update LLM client tests for the validation handoff. (AC: 1, 2, 3)
  - [x] Keep existing tests proving strict structured-output schema is requested and non-MVP context sources are excluded.
  - [x] Add tests for malformed `output_text`, incomplete report JSON, unexpected mutation fields, and invalid enum values.
  - [x] Assert invalid model output never returns a value typed/treated as `PreflightReport`.
  - [x] Assert raw provider output is not logged or included in thrown public error messages.
- [x] Update action orchestration tests. (AC: 1, 2, 3)
  - [x] Valid LLM output should log validated completion safely, including issue number and status.
  - [x] Invalid LLM output should call `core.setFailed()` with a safe validation failure message and should not log issue title/body, raw model JSON, prompt text, provider error details, GitHub token, OpenAI API key, or raw payload JSON.
  - [x] Existing skip paths must remain unchanged: label mismatch, pull request payload, unsupported payload, empty body, short body, long body truncation metadata, custom ready label, and missing config.
  - [x] Assert no GitHub write adapter is invoked or introduced in this story.
- [x] Run the local validation gate and refresh generated artifacts if implementation changes bundled output. (AC: 1, 2, 3)
  - [x] Run `npm run format:check`.
  - [x] Run `npm run lint`.
  - [x] Run `npm test`.
  - [x] Run `npm run build`.
  - [x] Run `npm run package`.
  - [x] Run `npm run package:check`.
  - [x] Run `npm run all`.
  - [x] Record exact commands, failures, and environment caveats in the Dev Agent Record.

### Review Findings

- [x] [Review][Decision] Decide whether blank-only nested array content should fail validation — resolved: reject any nested item whose required string trims to empty; convert to patch work.
- [x] [Review][Patch] Reject blank required nested item fields after trimming [src/report-schema.ts:83]
- [x] [Review][Decision] Decide output size limits for provider reports — resolved: defer output size policy to the rendering/comment story where Markdown and GitHub comment limits are defined.
- [x] [Review][Defer] Define output size limits for provider reports [src/report-schema.ts:64] — deferred to the rendering/comment story; Story 2.4 validates schema shape but does not render or post comments.
- [x] [Review][Patch] Reject unexpected nested item fields [src/report-schema.ts:83]
- [x] [Review][Patch] Use own-property checks for required top-level fields [src/report-schema.ts:137]

## Dev Notes

### Scope Boundary

This story creates the local trust boundary between provider output and product-owned report data. The expected end state is: an eligible issue passes deterministic prechecks, the LLM returns raw structured output, local code validates and normalizes it into `PreflightReport`, and the Action logs safe validation success or safe validation failure.

This story must stop before Markdown rendering and GitHub comment creation. Epic 3 owns rendering and posting. Story 2.5 owns conservative status assignment policy refinements after a valid report exists.

### Source Context

- Epic 2 objective: Issue title/body analysis with deterministic prechecks, bounded LLM input, structured output, `PreflightReport` schema, validation, prompt-injection-safe handling, and cost control. [Source: `_bmad-output/planning-artifacts/epics.md#Epic 2: Issue Readiness Analysis`]
- Story 2.4 requires validation/normalization, safe handling of malformed output, and rejection/ignoring of mutation-shaped fields. [Source: `_bmad-output/planning-artifacts/epics.md#Story 2.4: Validate and Normalize Preflight Report Schema`]
- PRD FR6 requires conservative status values and non-blaming wording. [Source: `_bmad-output/planning-artifacts/prds/prd-serminal-2026-06-03/prd.md#FR-6: Produce Conservative Status`]
- PRD NFR3 says failed LLM calls or malformed model responses must not mutate the Issue beyond a clear failure path in logs. [Source: `_bmad-output/planning-artifacts/prds/prd-serminal-2026-06-03/prd.md#5. Cross-Cutting Non-Functional Requirements`]
- Architecture assigns `report-schema.ts` ownership of `PreflightReport` type and validation. [Source: `_bmad-output/planning-artifacts/architecture.md#Schema Boundary`]
- Architecture requires rendering Markdown only from validated report data and isolating GitHub writes to `github-comments.ts`. [Source: `_bmad-output/planning-artifacts/architecture.md#Architectural Boundaries`]

### Current Code State

- `src/report-schema.ts` currently defines only TypeScript types: `PreflightStatus`, `Confidence`, `ChecklistItem`, `MissingContextItem`, `EvidenceItem`, and `PreflightReport`. It has no runtime validator yet.
- `src/llm-client.ts` currently builds bounded `LlmAnalysisInput`, defines the strict OpenAI JSON Schema request format, calls `client.responses.create()`, extracts `output_text`, then returns `JSON.parse(outputText) as RawStructuredPreflightReport`. That cast is the main gap this story closes.
- `src/action.ts` currently runs config/event parsing/prechecks, builds bounded input, calls `OpenAiLlmClient.analyzeIssue()`, and logs `LLM structured analysis completed ...; validation deferred.` It should now treat validation as completed before returning success.
- `src/prechecks.ts` already returns deterministic `PreflightReport` objects for empty/short bodies. Preserve these reports and do not route deterministic precheck reports through the LLM.
- `src/report-renderer.ts` is a placeholder renderer. Do not expand renderer behavior in this story except if a type/import change is mechanically required.
- `src/github-comments.ts` exists as the future write boundary. Do not introduce GitHub writes in this story.

### Architecture Compliance

Follow these decisions exactly:

- `report-schema.ts` owns the runtime validation and normalization contract.
- `llm-client.ts` owns provider communication and should not render Markdown or write GitHub.
- `action.ts` remains orchestration only. It may log safe validation state transitions and branch on validation failure.
- No module except `github-comments.ts` may write to GitHub.
- No raw provider output, prompt, Issue title/body, bounded body content, webhook payload, `github-token`, or `openai-api-key` may appear in logs or public error messages.
- Do not add new dependencies unless native TypeScript validation becomes unreasonably complex. If a validation library is added, justify it in the Dev Agent Record and avoid unrelated package updates.

### Recommended Implementation Shape

Recommended validator API:

```ts
export class PreflightReportValidationError extends Error {
  constructor(message = "Invalid preflight report") {
    super(message)
    this.name = "PreflightReportValidationError"
  }
}

export function validatePreflightReport(raw: unknown): PreflightReport {
  // Parse object shape, reject unexpected top-level keys, trim strings,
  // validate enums, normalize arrays, and return a clean PreflightReport.
}
```

Recommended `action.ts` success log:

```ts
core.info(
  `LLM structured analysis validated for issue #${issueNumber}: ${report.status}.`
)
```

Recommended validation failure log:

```ts
core.info(
  `LLM structured analysis failed validation for issue #${issueNumber}: invalid_report.`
)
core.setFailed("LLM structured analysis failed validation: invalid_report")
```

Do not include validation details that echo model-provided strings unless they are field names only.

### Validation Contract Guardrails

Required normalized shape:

```ts
interface PreflightReport {
  status: "ready" | "needs_clarification" | "high_risk"
  missing_context: { category: string; detail: string }[]
  risk_explanation: string
  suggested_questions: { text: string }[]
  draft_acceptance_criteria: { text: string }[]
  confidence: "low" | "medium" | "high"
  evidence: { source: "title" | "body" | "precheck"; detail: string }[]
}
```

Normalization rules should be conservative:

- Trim strings.
- Remove empty array items only if that does not hide invalid required scalar data.
- Reject unknown enum values rather than mapping them.
- Reject top-level unexpected fields by default, especially mutation/rendering fields.
- Do not invent missing context, suggested questions, evidence, or acceptance criteria during validation.
- Do not convert provider failures into deterministic `high_risk` reports in this story unless the fallback is explicitly implemented, test-covered, and still not posted to GitHub.

### Previous Story Intelligence

Story 2.3 introduced the OpenAI structured-output provider path and deliberately deferred local validation. Important learnings:

- `OpenAiLlmClient` already requests strict JSON Schema through `PREFLIGHT_REPORT_RESPONSE_FORMAT`; keep that schema aligned with `PreflightReport`.
- The OpenAI client is mocked in tests; no tests should make network calls.
- Existing provider failure behavior calls `core.setFailed("LLM structured analysis failed: provider_error")` and must stay safe.
- `buildLlmAnalysisInput()` remains the only approved source for provider-ready issue title/body input.
- `LlmAnalysisInput.logMetadata` is safe to log; the full input is not safe because it contains title/body.
- Prompt-injection-like content must remain untrusted task data and must not become validator instructions, GitHub mutations, or workflow gates.
- Story 2.3 final validation passed after `npm run package` refreshed bundled artifacts.

Earlier learnings still apply:

- Empty and short bodies skip the LLM and return deterministic reports.
- Normal skip paths do not call `core.setFailed()`.
- Safe logs avoid issue title/body/payload/secrets.
- `package:check` may require generated `dist/index.js` to be staged because it checks bundled output freshness.
- Deferred tooling gap remains: `package:check` validates `dist/index.js` but not `dist/index.js.map`; see `_bmad-output/implementation-artifacts/deferred-work.md`.

### Git / Workspace Notes

Recent commits:

- `bd68d36 chore: update package-lock.json dependencies`
- `8a041e9 feat: integrate OpenAI structured output provider for readiness analysis and add corresponding LLM client implementation`
- `9115748 feat: implement bounded, untrusted-data-framed LLM input preparation for issue analysis`
- `3a700ab feat: implement deterministic prechecks and action processing logic with supporting test fixtures`
- `bb012f7 feat: implement deterministic prechecks to analyze issue content quality before LLM processing`

Baseline for this story: `bd68d36f`.

Current pre-story RTK validation on 2026-06-04:

- `rtk git status`: branch `main...origin/main`, untracked `AGENTS.md`.
- `rtk git diff`: no tracked diff.
- `rtk npm test`: 7 suites passed, 42 tests passed.
- `rtk npm run build`: `tsc --noEmit` passed.

### Testing Guidance

Focus first on `__tests__/report-schema.test.ts`. Then update `__tests__/llm-client.test.ts` and `__tests__/action.test.ts`.

High-value cases:

- Valid report with extra whitespace normalizes to trimmed strings.
- Empty `risk_explanation` rejects.
- Missing `confidence`, invalid `status`, invalid evidence source, non-array list fields, and nested objects with wrong scalar types reject.
- Top-level `labels`, `assignees`, `checks`, `files`, `pull_requests`, `issue_comments`, `issue_state`, `markdown`, or `comment_body` rejects.
- Provider `output_text` containing malformed JSON fails safely.
- Provider `output_text` containing valid JSON with invalid report shape fails safely.
- Action validation failure logs only safe metadata.

### Security and Guardrails

- Treat Issue title/body and all model output as untrusted.
- Do not interpolate Issue content or model output into shell commands.
- Do not log full Issue title/body, bounded body content, prompts, provider requests, raw responses, raw payloads, or secrets.
- Do not read repository files, diffs, linked PRs, Issue comments, or raw payload into LLM input.
- Do not render raw provider output directly.
- Do not post GitHub comments or mutate GitHub state.
- Do not add `include-comments`.
- Do not let model output create trusted instructions, mutation permissions, workflow gates, or GitHub write requests.

### Project Structure Notes

- Implementation code lives at the project root under `src/` and `__tests__/`.
- BMad artifacts under `_bmad-output/` are tracking/context only.
- No UX document exists; the MVP surface remains GitHub Issues and later Markdown comments.
- This story should add/modify `report-schema` tests before implementation and keep test fixture additions under `__tests__/fixtures/` only if reuse is helpful.

## References

- `_bmad-output/planning-artifacts/epics.md#Story 2.4: Validate and Normalize Preflight Report Schema`
- `_bmad-output/planning-artifacts/epics.md#Epic 2: Issue Readiness Analysis`
- `_bmad-output/planning-artifacts/prds/prd-serminal-2026-06-03/prd.md#FR-6: Produce Conservative Status`
- `_bmad-output/planning-artifacts/prds/prd-serminal-2026-06-03/prd.md#5. Cross-Cutting Non-Functional Requirements`
- `_bmad-output/planning-artifacts/architecture.md#Schema Boundary`
- `_bmad-output/planning-artifacts/architecture.md#Architectural Boundaries`
- `_bmad-output/implementation-artifacts/2-3-produce-structured-preflight-report-output.md`
- `_bmad-output/implementation-artifacts/deferred-work.md`
- `src/report-schema.ts`
- `src/llm-client.ts`
- `src/action.ts`
- `src/prechecks.ts`
- `__tests__/llm-client.test.ts`
- `__tests__/action.test.ts`
- `__tests__/prechecks.test.ts`

## Dev Agent Record

### Agent Model Used

Codex (GPT-5)

### Debug Log References

- RED: `npm test -- --runInBand __tests__/report-schema.test.ts` failed because `validatePreflightReport()` and `PreflightReportValidationError` did not exist yet.
- GREEN: `npm test -- --runInBand __tests__/report-schema.test.ts` passed with 18 validator tests.
- RED: `npm test -- --runInBand __tests__/llm-client.test.ts` and `npm test -- --runInBand __tests__/action.test.ts` failed because `llm-client.ts` still threw raw parse/provider errors and `action.ts` still logged `validation deferred`.
- GREEN focused suites passed after implementation: `__tests__/report-schema.test.ts`, `__tests__/llm-client.test.ts`, and `__tests__/action.test.ts`.
- Static validation passed: `npm run format:check`, `npm run lint`, and `rtk npm run build`.
- Full test validation passed through RTK due project rules: `rtk npm test` with 8 suites and 68 tests.
- `npm run package` refreshed bundled `dist` artifacts.
- `npm run package:check` initially failed because regenerated `dist/index.js` was not staged; staged only `dist/index.js`, then `npm run package:check` passed.
- Final validation passed: `rtk npm run all`.
- CODE REVIEW PATCH: `npm run format:check` initially failed after applying review fixes because `__tests__/report-schema.test.ts` needed Prettier formatting.
- CODE REVIEW PATCH: `npm run format -- --write __tests__/report-schema.test.ts src/report-schema.ts` formatted the changed test file.
- CODE REVIEW PATCH: Review patch validation passed: `npm run format:check`, `npm run lint`, `rtk npm test`, and `rtk npm run build`.
- CODE REVIEW PATCH: `npm run package` refreshed bundled output; `npm run package:check` failed until regenerated `dist/index.js` was staged again, then passed.
- CODE REVIEW PATCH: Final validation passed: `rtk npm run all` with 8 suites and 77 tests.
- Environment caveat: project rules require `rtk npm test`, `rtk npm run build`, and `rtk npm run all` instead of direct `npm test`, `npm run build`, and `npm run all`.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Added runtime `PreflightReport` validation and normalization in `src/report-schema.ts`, including strict top-level key rejection, enum checks, required array/object shape checks, trimmed strings, empty safe array-item removal, and generic validation errors.
- Changed `OpenAiLlmClient.analyzeIssue()` to return parsed raw `unknown` output instead of casting provider JSON to `RawStructuredPreflightReport`.
- Added `LlmOutputParseError` so missing or malformed `output_text` is handled as invalid structured model output without echoing raw provider text.
- Wired `action.ts` to validate successful LLM output before any downstream path, log safe validation success with issue number and status, and fail malformed or unsafe model output with `invalid_report`.
- Preserved provider error behavior as `provider_error` and did not introduce GitHub comments, rendering, labels, assignees, files, checks, pull requests, or issue state mutations.
- Added `__tests__/report-schema.test.ts` with normalization, invalid shape, invalid enum, mutation-field rejection, and generic error assertions.
- Expanded LLM client tests for malformed JSON, missing `output_text`, invalid raw handoff cases, and safe parse errors.
- Expanded action orchestration tests for validation success and invalid model output failure while preserving existing skip/precheck/provider-error paths.
- Refreshed bundled action output with `npm run package`.
- Code review patches applied: blank required nested item fields now reject after trimming, unexpected nested item fields now reject, and required key checks now use own-property checks.
- Deferred provider output size limits to the future rendering/comment story where Markdown and GitHub comment limits are defined.

### File List

- `AGENTS.md`
- `src/action.ts`
- `src/llm-client.ts`
- `src/report-schema.ts`
- `__tests__/action.test.ts`
- `__tests__/llm-client.test.ts`
- `__tests__/report-schema.test.ts`
- `dist/index.js`
- `dist/index.js.map`
- `_bmad-output/implementation-artifacts/2-4-validate-and-normalize-preflight-report-schema.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Change Log

- 2026-06-04: Implemented Story 2.4 runtime preflight report validation, validation handoff, safe action failure handling, focused tests, and refreshed bundled artifacts.
