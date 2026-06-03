---
baseline_commit: c09688650a3da1f2c75e1b29b4229e4ccd6a66a7
---

# Story 2.1: Run Deterministic Prechecks Before LLM Analysis

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an issue owner,
I want obviously incomplete issues to be handled without unnecessary AI analysis,
so that the Action gives useful minimum-context feedback while controlling cost.

## Acceptance Criteria

1. Given an eligible Issue has an empty body, when the Action runs prechecks, then it returns a deterministic `High Risk` or equivalent insufficient-context report, and it does not call the LLM.
2. Given an eligible Issue body is below the minimum useful length, when the Action runs prechecks, then it returns a deterministic report asking for basic context, and it does not pretend to understand the requested work.
3. Given an eligible Issue has enough title/body content for analysis, when prechecks complete, then the Action allows LLM analysis to continue, and logs that prechecks ran without logging the full Issue body.

## Tasks / Subtasks

- [x] Define the deterministic precheck contract in `src/prechecks.ts`. (AC: 1, 2, 3)
  - [x] Replace the placeholder `PrecheckResult` with an explicit discriminated result, for example `continue` vs `report`.
  - [x] Accept `ReadyIssueContext` or a narrow equivalent containing `issueNumber`, `issueTitle`, and `issueBody`.
  - [x] Add an empty-body check that returns a deterministic insufficient-context report without any LLM path.
  - [x] Add a short-body check below a named threshold such as `MIN_USEFUL_BODY_LENGTH`.
  - [x] Ensure whitespace-only bodies are treated as empty.
- [x] Create or expand the report contract needed by deterministic prechecks. (AC: 1, 2)
  - [x] Update `src/report-schema.ts` from placeholder `status: string` to a typed `PreflightReport` shape compatible with architecture.
  - [x] Include at least status, missing context, risk explanation, suggested questions, draft acceptance criteria, confidence, and evidence.
  - [x] Use internal statuses `ready`, `needs_clarification`, and `high_risk`; rendered labels belong to later renderer stories.
  - [x] Keep deterministic reports concise and focused on missing issue context, not the issue author.
- [x] Wire prechecks into `src/action.ts` after Ready Label parsing. (AC: 1, 2, 3)
  - [x] Load config and parse event exactly as Stories 1.2-1.4 already do.
  - [x] Run deterministic prechecks only when `parseIssueLabeledEvent()` returns `kind: "ready"`.
  - [x] For deterministic report results, log safe metadata such as issue number, precheck reason, and report status, then return.
  - [x] For continue results, log that deterministic prechecks ran and future LLM analysis is allowed, then return.
  - [x] Do not call OpenAI or any LLM client in this story.
  - [x] Do not render or post GitHub comments in this story.
- [x] Add focused test fixtures for precheck cases. (AC: 1, 2, 3)
  - [x] Add `__tests__/fixtures/empty-issue.json`.
  - [x] Add `__tests__/fixtures/short-issue.json`.
  - [x] Reuse `issue-labeled.json` as the enough-context case unless a richer fixture is needed.
  - [x] Keep fixture data synthetic and free of secrets/private content.
- [x] Add direct unit tests for `src/prechecks.ts`. (AC: 1, 2, 3)
  - [x] Empty body returns deterministic `high_risk` report and does not continue.
  - [x] Whitespace body returns deterministic `high_risk` report and does not continue.
  - [x] Short body returns deterministic report asking for basic context and does not continue.
  - [x] Enough body returns continue/allowed result without report.
  - [x] Deterministic reports do not include raw prompt text, secret values, or blame language.
- [x] Update orchestration tests in `__tests__/action.test.ts`. (AC: 1, 2, 3)
  - [x] Empty issue logs precheck result safely and does not fail.
  - [x] Short issue logs precheck result safely and does not fail.
  - [x] Enough-context issue logs that prechecks ran and LLM analysis would continue later.
  - [x] Existing label mismatch, PR skip, unsupported payload, custom label, and missing config tests still pass.
  - [x] Assert logs do not include the full issue body, OpenAI API key, GitHub token, raw payload JSON, or raw prompts.
- [x] Verify no out-of-scope behavior was added. (AC: 1, 2, 3)
  - [x] Confirm no OpenAI/LLM API call exists in this story.
  - [x] Confirm no GitHub comment API or mutation path is added.
  - [x] Confirm no labels, assignees, issue body, issue state, files, checks, PRs, or workflow state are mutated.
- [x] Run the local validation gate and refresh generated artifacts. (AC: 1, 2, 3)
  - [x] Run `npm run format:check`.
  - [x] Run `npm run lint`.
  - [x] Run `npm test`.
  - [x] Run `npm run build`.
  - [x] Run `npm run package`.
  - [x] Run `npm run package:check`.
  - [x] Run `npm run all`.
  - [x] Record exact commands, failures, and environment caveats in the Dev Agent Record.

### Review Findings

- [x] [Review][Patch] Add exact threshold boundary tests for deterministic prechecks [`__tests__/prechecks.test.ts`:50]
- [x] [Review][Patch] Assert custom ready-label routing still runs deterministic prechecks [`__tests__/action.test.ts`:78]
- [x] [Review][Defer] Generated source map freshness is not guarded by package check [`dist/index.js`:35980] - deferred, pre-existing

## Dev Notes

### Scope Boundary

This story implements deterministic prechecks only. It must not implement bounded LLM input, OpenAI calls, structured model output, schema validation of model output, Markdown rendering, GitHub comments, update-in-place behavior, or duplicate comment detection.

Expected end state: after config and Ready Label routing succeed, the Action can decide whether an issue is too empty/short to send to an LLM. It logs the decision safely and stops. Later stories will build the LLM input and comment path.

### Source Context

- Epic 2 objective: provide readiness analysis based on Issue title/body with conservative status and useful missing-context detection. Story 2.1 starts that work with deterministic prechecks before LLM analysis. [Source: `_bmad-output/planning-artifacts/epics.md#Epic 2: Issue Readiness Analysis`]
- Story 2.1 requires empty and short issues to produce deterministic insufficient-context reports without LLM calls, while enough-context issues continue to LLM analysis later. [Source: `_bmad-output/planning-artifacts/epics.md#Story 2.1: Run Deterministic Prechecks Before LLM Analysis`]
- PRD FR4 requires Issue title/body as default context and minimal handling for empty or very short issue bodies. [Source: `_bmad-output/planning-artifacts/prds/prd-serminal-2026-06-03/prd.md#FR-4: Analyze Issue Title and Body`]
- PRD FR6 requires conservative statuses: `Ready`, `Needs Clarification`, and `High Risk`, without blaming the Issue Owner. [Source: `_bmad-output/planning-artifacts/prds/prd-serminal-2026-06-03/prd.md#FR-6: Produce Conservative Status`]
- NFR6 requires avoiding unnecessary LLM calls for deterministic low-information cases. [Source: `_bmad-output/planning-artifacts/prds/prd-serminal-2026-06-03/prd.md#5. Cross-Cutting Non-Functional Requirements`]

### Current Code State

Relevant source files:

- `src/action.ts` currently loads config, parses `@actions/github.context`, logs eligible or skipped routing state, and returns. It has no precheck logic yet.
- `src/github-context.ts` currently defines `ReadyIssueContext` and `parseIssueLabeledEvent()`. It extracts issue number, title, body, label, owner, and repo for ready issues. It skips label mismatch, PR payloads, unsupported events, and unsupported payloads without failing.
- `src/prechecks.ts` is a placeholder with `PrecheckResult { passed: boolean }`.
- `src/report-schema.ts` is a placeholder with `PreflightReport { status: string }`.
- `src/report-renderer.ts` is a placeholder and should not become the main target in this story.
- `src/security.ts` currently has only `redactSecret()`. Use it only if helpful; do not create a generic `utils.ts`.

Relevant tests and fixtures:

- `__tests__/action.test.ts` covers setup success/failure, eligible issue logging, custom ready label, label mismatch, and PR skip.
- `__tests__/github-context.test.ts` covers parser ready/mismatch/custom/PR/unsupported paths.
- Existing fixtures: `issue-labeled.json`, `issue-other-label.json`, `pull-request-labeled.json`.

### Architecture Compliance

Follow these decisions exactly:

- `action.ts` remains orchestration only. It may call `runPrechecks()` and branch on the result, but detailed precheck rules belong in `prechecks.ts`.
- `github-context.ts` remains the event parser. Do not duplicate event parsing in `prechecks.ts`.
- `prechecks.ts` owns deterministic checks before LLM calls.
- `report-schema.ts` owns the report type/status vocabulary used by deterministic reports and later model validation.
- No module except future `github-comments.ts` may write to GitHub.
- No LLM calls in this story.
- Render Markdown only in later renderer stories; do not turn deterministic reports into comments here.
- Treat issue title/body as untrusted input.
- Do not log full Issue body, full prompt, raw LLM response, OpenAI API key, GitHub token, or raw payload JSON.

### Recommended Implementation Shape

Recommended status and report model in `src/report-schema.ts`:

```ts
export type PreflightStatus = "ready" | "needs_clarification" | "high_risk"
export type Confidence = "low" | "medium" | "high"

export interface ChecklistItem {
  readonly text: string
}

export interface MissingContextItem {
  readonly category: string
  readonly detail: string
}

export interface EvidenceItem {
  readonly source: "title" | "body" | "precheck"
  readonly detail: string
}

export interface PreflightReport {
  readonly status: PreflightStatus
  readonly missing_context: MissingContextItem[]
  readonly risk_explanation: string
  readonly suggested_questions: ChecklistItem[]
  readonly draft_acceptance_criteria: ChecklistItem[]
  readonly confidence: Confidence
  readonly evidence: EvidenceItem[]
}
```

Recommended precheck shape in `src/prechecks.ts`:

```ts
export const MIN_USEFUL_BODY_LENGTH = 40

export type PrecheckResult =
  | {
      readonly kind: "report"
      readonly reason: "empty_body" | "short_body"
      readonly report: PreflightReport
    }
  | {
      readonly kind: "continue"
    }

export function runPrechecks(issue: ReadyIssueContext): PrecheckResult {
  const body = issue.issueBody.trim()

  if (body.length === 0) {
    return {
      kind: "report",
      reason: "empty_body",
      report: createInsufficientContextReport("empty_body")
    }
  }

  if (body.length < MIN_USEFUL_BODY_LENGTH) {
    return {
      kind: "report",
      reason: "short_body",
      report: createInsufficientContextReport("short_body")
    }
  }

  return { kind: "continue" }
}
```

The exact threshold may be adjusted if tests and docs state it clearly. Keep it named, exported, and covered by tests.

### Deterministic Report Guidance

For empty body:

- status: `high_risk`
- confidence: `high`
- missing context should include basic implementation context such as expected behavior, acceptance criteria, and edge/error behavior.
- suggested questions should ask for role/actor, expected behavior, acceptance criteria, and edge/failure cases.
- draft acceptance criteria should be empty because core context is missing.

For short body:

- status may be `high_risk` or `needs_clarification`; prefer `high_risk` if the body is too short to safely infer work.
- risk explanation must say the issue lacks enough implementation detail, not that the author did anything wrong.
- suggested questions must stay generic enough to avoid pretending to understand the feature.
- evidence should reference deterministic precheck outcome, not quote the full body.

Do not include raw issue body in deterministic report evidence unless it is a short safe label like `Issue body was empty` or `Issue body was below minimum useful length`.

### Action Orchestration Guidance

In `src/action.ts`, preserve existing routing:

1. Load config.
2. Parse `context.eventName` and `context.payload`.
3. Return for label mismatch, PR skip, unsupported event, and unsupported payload exactly as current behavior does.
4. Only for `kind: "ready"`, run deterministic prechecks.
5. If precheck returns a deterministic report, log safe metadata and return.
6. If precheck returns continue, log safe metadata and return.

Suggested safe logs:

- `Deterministic prechecks completed for issue #<number>: empty_body -> high_risk. LLM analysis skipped.`
- `Deterministic prechecks completed for issue #<number>: short_body -> high_risk. LLM analysis skipped.`
- `Deterministic prechecks completed for issue #<number>: enough_context. LLM analysis allowed for a later story.`

Do not log issue title/body or report contents in `action.ts`.

### File Structure Requirements

Expected files to update or add:

```text
src/action.ts
src/prechecks.ts
src/report-schema.ts
__tests__/action.test.ts
__tests__/prechecks.test.ts
__tests__/fixtures/empty-issue.json
__tests__/fixtures/short-issue.json
dist/index.js
dist/index.js.map
dist/licenses.txt
```

Only update `src/report-renderer.ts` if TypeScript compile requires it after the report shape changes. If updated, keep it minimal and do not implement Epic 3 renderer behavior.

Do not add new dependencies unless there is a strong reason. This story can be implemented with TypeScript/Jest only.

### Testing Requirements

Add direct tests for `runPrechecks()` rather than only testing through `action.ts`. This prevents future LLM/client work from hiding deterministic behavior.

Required test themes:

- Empty body and whitespace-only body short-circuit to deterministic report.
- Short body short-circuits to deterministic report.
- Enough body returns continue.
- Deterministic report contains no draft acceptance criteria when context is insufficient.
- Deterministic report asks for minimum useful context.
- Action logs safe metadata and not full issue body.
- Existing Story 1 routing tests still pass.

Use synthetic fixtures only. Do not call external APIs.

### Previous Story Intelligence

Story 1.5 completed workflow-level duplicate guidance and intentionally did not add source behavior. Relevant learnings:

- `npm run all` is the full validation gate.
- `package:check` uses `git diff --exit-code -- dist/index.js`; after source changes and `npm run package`, ensure generated `dist/index.js` is current and staged/clean as needed.
- No GitHub write/mutation path currently exists; keep it that way.
- README says current implementation is routing-only. After this story, update README only if tests or product wording require it; do not claim comments or LLM analysis exist.

Story 1.4 learnings still apply:

- PR-backed issues are skipped via `reason: "pull_request"`.
- Normal skip paths do not call `core.setFailed`.
- Safe logs avoid title/body/payload/secrets.

Story 1.3 dependency caveat:

- `@actions/github` is currently `^6.0.1` because `@actions/github@9` did not bundle cleanly with the current `ncc` flow. Do not upgrade it in this story unless bundling and audit are revalidated.

### Git Intelligence Summary

Recent commits:

- `c096886 feat: add workflow example with concurrency protection and update documentation to address duplicate run limitations`
- `8c5b45c feat: ignore pull requests and unsupported payloads with explicit skip handling and testing`
- `83d51eb feat: implement GitHub context extraction and action handling logic`
- `b85d2bf first commit`

Pattern from recent work:

- Each story adds focused behavior plus direct tests.
- Fixtures live under `__tests__/fixtures/`.
- Source modules stay narrow and architecture-aligned.
- Generated `dist/` is refreshed when source changes.

### Latest Technical Notes

- GitHub Actions docs describe `github.event` as the webhook payload for the triggering event and note that context properties vary by event type. This supports keeping parser validation defensive rather than trusting payload shape. [External source: `https://docs.github.com/en/actions/reference/workflows-and-actions/contexts`]
- GitHub Actions event docs state `issues` workflows can use the `labeled` activity type, and that `github.event.issue.pull_request` can distinguish PR-backed issue objects from real issues in related contexts. Preserve the current PR skip behavior. [External source: `https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows`]
- GitHub Actions Toolkit remains the intended package family for JavaScript actions. Continue using existing `@actions/core` logging/failure APIs; do not introduce alternate action runtimes. [External source: `https://github.com/actions/toolkit`]

### Security and Guardrails

- Issue title/body are untrusted input.
- Do not interpolate issue content into shell commands.
- Do not log full issue body or title.
- Do not log prompt content; this story should not create prompts.
- Do not log `github-token` or `openai-api-key`.
- Do not post comments or mutate GitHub state.
- Do not read repository files, diffs, linked PRs, or Issue comments.
- Keep deterministic reports non-blaming and artifact-focused.

### Project Structure Notes

- Implementation code lives at the project root, not under `_bmad-output`.
- BMad artifacts under `_bmad-output/` are tracking/context only.
- This story should edit its own story file and sprint status through the workflow; implementation later should edit source/tests/dist.
- No UX document exists; the user experience for this story is log behavior only. GitHub comment UX belongs to Epic 3.

## References

- `_bmad-output/planning-artifacts/epics.md#Story 2.1: Run Deterministic Prechecks Before LLM Analysis`
- `_bmad-output/planning-artifacts/epics.md#Epic 2: Issue Readiness Analysis`
- `_bmad-output/planning-artifacts/prds/prd-serminal-2026-06-03/prd.md#FR-4: Analyze Issue Title and Body`
- `_bmad-output/planning-artifacts/prds/prd-serminal-2026-06-03/prd.md#FR-6: Produce Conservative Status`
- `_bmad-output/planning-artifacts/architecture.md#Precheck Pattern`
- `_bmad-output/planning-artifacts/architecture.md#Report Schema`
- `_bmad-output/planning-artifacts/architecture.md#Logging Pattern`
- `_bmad-output/implementation-artifacts/1-5-prevent-obvious-duplicate-concurrent-runs.md#Dev Agent Record`
- `_bmad-output/implementation-artifacts/epic-1-retro-2026-06-03.md#10. Chuan Bi Cho Story 2.1`
- `https://docs.github.com/en/actions/reference/workflows-and-actions/contexts`
- `https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows`
- `https://github.com/actions/toolkit`

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm test -- --runTestsByPath __tests__/prechecks.test.ts __tests__/action.test.ts` - red phase failed because `runPrechecks` did not exist and `action.ts` did not run deterministic prechecks.
- `npm test -- --runTestsByPath __tests__/prechecks.test.ts __tests__/action.test.ts` - passed after implementing typed report schema, deterministic prechecks, and action orchestration logs.
- `npm run format:check` - initially failed on `src/prechecks.ts`.
- `npm run format -- src/prechecks.ts __tests__/prechecks.test.ts __tests__/action.test.ts` - passed and formatted the changed files.
- `npm run format:check` - passed.
- `npm run lint` - passed.
- `npm test` - passed, 5 test suites and 26 tests.
- `npm run build` - passed.
- `npm run package` - passed and regenerated `dist/index.js` and `dist/index.js.map`.
- `npm run package:check` - initially failed because regenerated `dist/index.js` differed from the git index; passed after staging `dist/index.js`.
- `npm run all` - passed.
- `rg -n "openai|llm|createComment|issues\\.createComment|github-comments|addLabels|removeLabel|assignees|checkRuns|pulls\\.|update\\(|octokit" src __tests__` - no new LLM calls or GitHub mutation paths found; matches are existing config/input/test references to `openai-api-key`.
- `npm test -- --runTestsByPath __tests__/prechecks.test.ts __tests__/action.test.ts` - passed after code review patches for threshold boundary coverage and custom ready-label precheck assertion.
- `npm run all` - passed after code review patches, 5 test suites and 28 tests.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Implemented `PreflightReport` and related typed report fields in `src/report-schema.ts`.
- Implemented deterministic empty-body and short-body prechecks in `src/prechecks.ts` with `MIN_USEFUL_BODY_LENGTH`, safe insufficient-context reports, and continue behavior for enough context.
- Wired `runPrechecks()` into `src/action.ts` only after Ready Label routing succeeds.
- Added empty and short issue fixtures plus direct unit tests for deterministic precheck behavior.
- Updated action orchestration tests for empty, short, and enough-context precheck logs while preserving Story 1 routing behavior.
- No LLM calls, GitHub comments, or GitHub mutation paths were added.
- Code review patch findings resolved: added exact threshold boundary tests and custom ready-label precheck assertion.

### Change Log

- 2026-06-03: Implemented deterministic prechecks before LLM analysis and marked story ready for review.
- 2026-06-03: Resolved code review patch findings and marked story done.

### File List

- `__tests__/action.test.ts`
- `__tests__/fixtures/empty-issue.json`
- `__tests__/fixtures/short-issue.json`
- `__tests__/prechecks.test.ts`
- `_bmad-output/implementation-artifacts/2-1-run-deterministic-prechecks-before-llm-analysis.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `dist/index.js`
- `dist/index.js.map`
- `src/action.ts`
- `src/prechecks.ts`
- `src/report-schema.ts`
