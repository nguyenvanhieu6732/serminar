---
baseline_commit: 955b651
---

# Story 3.1: Render Canonical Markdown Preflight Report

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an issue owner,
I want the preflight result rendered as a readable GitHub comment,
so that I can quickly understand what needs clarification.

## Acceptance Criteria

1. Given a validated `PreflightReport`, when the renderer creates Markdown, then the comment includes a recognizable `Dev Ticket Preflight` heading, and the rendered status uses the user-facing label `Ready`, `Needs Clarification`, or `High Risk`.
2. Given the report contains missing context items, when Markdown is rendered, then the report includes a `Missing Context` section, and each item is concise, actionable, and cannot break the canonical Markdown structure.
3. Given no material missing context is found, when Markdown is rendered, then the report explicitly says no material missing context was found, and it does not invent unnecessary checklist items.

## Tasks / Subtasks

- [x] Implement the canonical Story 3.1 renderer in `src/report-renderer.ts`. (AC: 1, 2, 3)
  - [x] Keep `renderReport(report: PreflightReport): string` as a pure function that accepts only a validated, policy-normalized `PreflightReport`.
  - [x] Replace the placeholder output with a recognizable `Dev Ticket Preflight` heading and a user-facing status label.
  - [x] Map internal status values exactly: `ready` -> `Ready`, `needs_clarification` -> `Needs Clarification`, `high_risk` -> `High Risk`.
  - [x] Render a canonical `Missing Context` section after the heading/status.
  - [x] When `missing_context` is non-empty, render each item from its validated `category` and `detail` as a Markdown task-list item without inventing additional content.
  - [x] When `missing_context` is empty, render an explicit no-material-missing-context message and no list items.
- [x] Preserve the Markdown rendering safety boundary. (AC: 1, 2, 3)
  - [x] Render only fields from `PreflightReport`; never accept or render raw provider output, raw prompt text, raw LLM JSON, Issue title/body, secrets, or mutation-shaped fields.
  - [x] Ensure model-provided item text cannot inject extra headings, lists, task items, HTML blocks, or other unexpected Markdown structure. Use a small local rendering helper if needed; do not add a dependency.
  - [x] Keep this story limited to display formatting. Do not add GitHub API calls, labels, assignees, checks, issue edits, file writes, workflow gates, or comment posting.
- [x] Add focused renderer unit tests in `__tests__/report-renderer.test.ts`. (AC: 1, 2, 3)
  - [x] Assert all three internal statuses render to the exact user-facing labels.
  - [x] Assert the output includes the recognizable heading and `Missing Context` section.
  - [x] Assert non-empty missing context renders concise item content from validated report data.
  - [x] Assert empty missing context renders the explicit empty-state message and does not render invented task-list items.
  - [x] Assert multiline or Markdown-shaped item text cannot create extra report sections or checklist structure.
  - [x] Assert Story 3.1 output does not yet render `Why This Matters`, `Suggested Questions`, or `Draft Acceptance Criteria`.
- [x] Run the local validation gate and refresh generated artifacts if implementation changes bundled output.
  - [x] Run `npm run format:check`.
  - [x] Run `npm run lint`.
  - [x] Run `rtk npm test`.
  - [x] Run `rtk npm run build`.
  - [x] Run `npm run package`.
  - [x] Run `npm run package:check`.
  - [x] Run `rtk npm run all`.
  - [x] Record exact commands, failures, and environment caveats in the Dev Agent Record.

### Review Findings

- [x] [Review][Patch] Lock the canonical Markdown shape and section order with exact output assertions [__tests__/report-renderer.test.ts:37]
- [x] [Review][Patch] Prove every missing-context item is rendered once and in order [__tests__/report-renderer.test.ts:42]

## Dev Notes

### Scope Boundary

This story creates the first real Markdown renderer implementation. Its end state is a pure local transformation from a validated, policy-normalized `PreflightReport` to a readable Markdown string containing only:

1. A recognizable `Dev Ticket Preflight` heading.
2. A user-facing status label.
3. A canonical `Missing Context` section with either report items or an explicit empty state.

Do not expand this story into the rest of Epic 3:

- Story 3.2 owns `Why This Matters`, `Suggested Questions`, additional checklist rendering, and concise 5-10 suggestion/checklist line behavior.
- Story 3.3 owns safe `Draft Acceptance Criteria` rendering.
- Story 3.4 owns GitHub Issue comment creation, append-only behavior, comment ID logging, and API failure handling.
- Story 3.5 owns final no-people-analytics enforcement and non-blocking GitHub mutation guardrails.

### Source Context

- Epic 3 provides a short, readable, actionable GitHub Issue comment without blocking workflow or judging people. [Source: `_bmad-output/planning-artifacts/epics.md#Epic 3: Actionable Preflight Report Comment`]
- Story 3.1 requires the recognizable heading, user-facing status labels, `Missing Context` section, and explicit empty state. [Source: `_bmad-output/planning-artifacts/epics.md#Story 3.1: Render Canonical Markdown Preflight Report`]
- PRD FR8 requires status and missing-context output as part of the eventual report. [Source: `_bmad-output/planning-artifacts/prds/prd-serminal-2026-06-03/prd.md#FR-8: Include Required Report Sections`]
- The PRD addendum requires structured JSON from the LLM, local validation, and Markdown rendering from trusted local code. [Source: `_bmad-output/planning-artifacts/prds/prd-serminal-2026-06-03/addendum.md#Technical Decisions Preserved for Architecture`]
- Architecture assigns Markdown generation exclusively to `report-renderer.ts` and requires canonical section order, omission of empty or unsafe sections, and no raw prompt/JSON leakage. [Source: `_bmad-output/planning-artifacts/architecture.md#Rendering Boundary`]

### Current Code State

- `src/report-renderer.ts` is a placeholder:

```ts
export function renderReport(report: PreflightReport): string {
  return `# Dev Ticket Preflight\n\nStatus: ${report.status}`
}
```

- The placeholder leaks internal snake_case status values and does not render `Missing Context`.
- `src/report-schema.ts` already defines and validates `PreflightReport`, including trimmed, non-empty nested strings and exact status enums.
- `applyConservativeStatusPolicy()` already normalizes status after validation. The renderer should receive that final status and must not reimplement readiness policy.
- `src/action.ts` currently validates and applies status policy but does not yet call the renderer. Do not wire renderer orchestration in this story unless mechanically required by an existing test; comment posting belongs to Story 3.4.
- There is no `__tests__/report-renderer.test.ts` yet.

### Rendering Contract

Use a stable Story 3.1 shape that later stories can extend:

```md
## Dev Ticket Preflight: Needs Clarification

### Missing Context
- [ ] **Acceptance criteria:** Missing testable pass/fail criteria.
```

For no missing context:

```md
## Dev Ticket Preflight: Ready

### Missing Context
No material missing context was found.
```

Implementation guidance:

- Use title-case user-facing status labels; never print raw `needs_clarification` or `high_risk`.
- Keep missing-context item rendering deterministic and local.
- Prefer a readable item form such as `- [ ] **{category}:** {detail}` after converting category identifiers into a user-facing label.
- Story 3.1 owns task-list syntax for missing-context items only. Story 3.2 owns suggested-question and broader checklist rendering.
- Treat validated strings as structurally trusted data, not trusted Markdown. Collapse embedded line breaks and neutralize Markdown control characters that could create extra sections or lists.
- Do not silently drop a validated missing-context item. If output-length policy is needed, resolve it deliberately in Story 3.2 or the comment-posting path rather than truncating items ad hoc here.

### Architecture Compliance

Follow these boundaries exactly:

- `report-renderer.ts` owns Markdown generation only.
- `report-schema.ts` owns `PreflightReport` validation and status policy; do not move rendering concerns into it.
- `action.ts` remains orchestration only.
- `github-comments.ts` is the only module allowed to write to GitHub.
- Render only validated report data; do not pass raw provider output to the renderer.
- Do not add a Markdown library or other dependency for this narrow deterministic renderer.
- Do not render raw prompts, raw LLM JSON, Issue title/body, webhook payloads, tokens, or secrets.

### Previous Story Intelligence

Story 2.5 established the immediate renderer input contract:

- A provider report is parsed, validated into `PreflightReport`, then passed through `applyConservativeStatusPolicy()`.
- Internal status values remain lowercase snake_case, while rendered labels must be title case.
- Invalid JSON, invalid schema, and mutation-shaped output fail before any renderer path.
- Deterministic precheck reports for empty and short bodies are already valid `PreflightReport` objects and must be renderable later without special-case renderer logic.
- Non-blaming natural-language enforcement was deliberately deferred to Story 3.5. Do not add brittle keyword filtering or sanitization to schema validation in this story. [Source: `_bmad-output/implementation-artifacts/deferred-work.md`]
- Provider report output-size limits were deferred to rendering/comment work. Story 3.1 should not introduce arbitrary truncation that hides validated missing-context items; keep the issue visible for Story 3.2/3.4 design. [Source: `_bmad-output/implementation-artifacts/deferred-work.md`]

### Git / Workspace Notes

Recent relevant commits:

- `955b651 feat: implement LLM-based action handling and report schema validation with associated test suites`
- `8a041e9 feat: integrate OpenAI structured output provider for readiness analysis and add corresponding LLM client implementation`
- `3a700ab feat: implement deterministic prechecks and action processing logic with supporting test fixtures`

Workspace caveat:

- Story 2.5 implementation and review artifacts are currently present as workspace changes. Build on them without reverting or overwriting unrelated user changes.
- `AGENTS.md` requires RTK wrappers for `git status`, `git diff`, `npm test`, and `npm run build`.

### Testing Requirements

Create `__tests__/report-renderer.test.ts` and test `renderReport()` directly as a pure function.

High-value cases:

- Table-driven assertions for `ready`, `needs_clarification`, and `high_risk`.
- A report with one or more missing-context items.
- A report with no missing-context items.
- A validated item containing embedded newlines or Markdown-shaped text that must remain one rendered item rather than creating extra headings/lists.
- Negative assertions that Story 3.1 output does not render `risk_explanation`, `suggested_questions`, `draft_acceptance_criteria`, raw enum values, or invented checklist items.
- Use complete `PreflightReport` fixtures so tests reflect the real renderer contract.

### Project Structure Notes

- Update: `src/report-renderer.ts`
- New: `__tests__/report-renderer.test.ts`
- Generated after packaging: `dist/index.js`, `dist/index.js.map`
- Do not modify `src/github-comments.ts` or introduce GitHub writes.
- No UX document exists; the GitHub Issue Markdown comment is the MVP user interface.
- No latest external API research is required for this pure local renderer.

## References

- `_bmad-output/planning-artifacts/epics.md#Epic 3: Actionable Preflight Report Comment`
- `_bmad-output/planning-artifacts/epics.md#Story 3.1: Render Canonical Markdown Preflight Report`
- `_bmad-output/planning-artifacts/prds/prd-serminal-2026-06-03/prd.md#FR-8: Include Required Report Sections`
- `_bmad-output/planning-artifacts/prds/prd-serminal-2026-06-03/addendum.md#Technical Decisions Preserved for Architecture`
- `_bmad-output/planning-artifacts/architecture.md#Markdown Report Format`
- `_bmad-output/planning-artifacts/architecture.md#Rendering Boundary`
- `_bmad-output/planning-artifacts/architecture.md#Architectural Boundaries`
- `_bmad-output/implementation-artifacts/2-5-assign-conservative-preflight-status.md`
- `_bmad-output/implementation-artifacts/deferred-work.md`
- `src/report-renderer.ts`
- `src/report-schema.ts`
- `src/action.ts`
- `src/github-comments.ts`
- `__tests__/report-schema.test.ts`

## Dev Agent Record

### Agent Model Used

Codex (GPT-5)

### Debug Log References

- RED: `rtk npm test -- --runInBand __tests__/report-renderer.test.ts` failed with 6 renderer expectations because `src/report-renderer.ts` was still the placeholder.
- GREEN: Implemented canonical status mapping, missing-context rendering, empty-state output, and inline Markdown escaping; focused renderer tests passed with 7 tests.
- Validation passed: `npm run format:check`, `npm run lint`, `rtk npm test`, and `rtk npm run build`.
- Packaging passed: `npm run package` and `npm run package:check`.
- Final validation passed: `rtk npm run all` with 9 suites and 93 tests.
- Environment caveat: project rules require RTK wrappers for `npm test` and `npm run build`.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Replaced the placeholder renderer with a pure canonical Markdown renderer for heading, user-facing status, and `Missing Context`.
- Added deterministic task-list rendering for missing-context items and an explicit no-material-missing-context empty state.
- Added local inline escaping that collapses whitespace, escapes HTML, and neutralizes Markdown control characters without adding a dependency.
- Kept Story 3.1 scoped away from risk explanation, suggested questions, draft acceptance criteria, orchestration, comment posting, and GitHub mutations.
- Added focused renderer unit tests covering all status labels, populated and empty missing context, Markdown structure injection, and later-story exclusions.

### File List

- `src/report-renderer.ts`
- `__tests__/report-renderer.test.ts`
- `_bmad-output/implementation-artifacts/3-1-render-canonical-markdown-preflight-report.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Change Log

- 2026-06-04: Implemented Story 3.1 canonical Markdown preflight renderer, rendering safety helpers, focused tests, and refreshed validation artifacts.
