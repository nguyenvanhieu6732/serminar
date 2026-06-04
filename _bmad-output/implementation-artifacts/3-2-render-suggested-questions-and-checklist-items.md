---
baseline_commit: 30ac58b
---

# Story 3.2: Render Suggested Questions and Checklist Items

Status: ready-for-dev

Story Key: `3-2-render-suggested-questions-and-checklist-items`

## Story

As an issue owner,
I want suggested questions and checklist items in the report,
So that I can update the Issue without needing a separate PM process.

## Acceptance Criteria

1. Given a validated report includes suggested questions, when Markdown is rendered, then the report includes a `Suggested Questions` section, and questions are rendered as Markdown task-list items where appropriate.
2. Given a validated report includes risk explanation, when Markdown is rendered, then the report includes a `Why This Matters` section, and the explanation stays focused on implementation risk, not the author.
3. Given the rendered report is inspected, when it contains checklist items, then the total suggestion/checklist content targets 5-10 lines unless the Issue is unusually complex, and generic educational prose is omitted.

## Tasks / Subtasks

- [ ] Extend the canonical Markdown renderer in `src/report-renderer.ts`. (AC: 1, 2)
  - [ ] Render `### Why This Matters` after `Missing Context`.
  - [ ] Render the validated `risk_explanation` as escaped Markdown-safe text without adding explanatory prose.
  - [ ] Render `### Suggested Questions` after `Why This Matters` when at least one question remains after budgeting.
  - [ ] Render each suggested question as `- [ ] {question}` in provider order.

- [ ] Apply a deterministic checklist-line budget. (AC: 1, 3)
  - [ ] Treat `missing_context` task-list items and rendered `suggested_questions` task-list items as the combined checklist/suggestion line count.
  - [ ] Preserve every validated missing-context item; do not silently drop implementation-critical context.
  - [ ] Define a named maximum target of 10 checklist/suggestion lines.
  - [ ] Use remaining capacity for suggested questions in provider order: `max(0, 10 - missing_context.length)`.
  - [ ] If missing context already reaches or exceeds 10 items, render all missing context and omit suggested questions; this is the unusually-complex exception.
  - [ ] Omit the `Suggested Questions` section when no questions remain after budgeting.

- [ ] Preserve renderer safety and story boundaries. (AC: 1, 2, 3)
  - [ ] Reuse the existing inline escaping behavior for risk explanation and suggested questions.
  - [ ] Keep `renderReport(report: PreflightReport): string` pure and dependent only on the validated report.
  - [ ] Do not render raw prompt text, raw LLM JSON, or generic educational prose.
  - [ ] Do not add `Draft Acceptance Criteria`; Story 3.3 owns that section.
  - [ ] Do not add GitHub API writes, comment posting, action orchestration, dependencies, or people-scoring logic.

- [ ] Extend focused renderer tests in `__tests__/report-renderer.test.ts`. (AC: 1, 2, 3)
  - [ ] Assert exact canonical output and section order for a report with risk explanation and suggested questions.
  - [ ] Assert suggested questions render once, in provider order, as Markdown task-list items.
  - [ ] Assert risk explanation and questions cannot inject headings, task-list items, HTML, or extra lines.
  - [ ] Assert the `Suggested Questions` section is omitted when the input list is empty.
  - [ ] Assert suggested questions are capped by the remaining 10-line budget.
  - [ ] Assert all missing-context items remain when missing context alone reaches or exceeds 10 lines.
  - [ ] Assert no generic prose or `Draft Acceptance Criteria` section is introduced.
  - [ ] Preserve Story 3.1 status, missing-context, empty-state, and injection-safety regression coverage.

- [ ] Run the local validation gate.
  - [ ] Run `rtk npm test`.
  - [ ] Run `rtk npm run build`.
  - [ ] Run the broader project validation command if one is already established by the repository.

## Dev Notes

### Scope Boundary

Story 3.2 extends the report body only. Story 3.1 already owns the heading, title-cased status, `Missing Context` section, task-list formatting for missing context, and explicit empty state. This story owns `Why This Matters`, `Suggested Questions`, and concise suggestion/checklist behavior.

Do not implement later Epic 3 responsibilities:

- Story 3.3 owns conditional `Draft Acceptance Criteria`.
- Story 3.4 owns GitHub comment posting, append-only behavior, API failure handling, and comment ID logging.
- Story 3.5 owns final enforcement of non-blaming language and no people analytics.

### Source Context

- FR8 requires status, missing context, risk explanation, suggested questions, and Markdown checklist items in the Preflight Report.
- FR10 requires concise reports that target 5-10 checklist/suggestion lines unless the Issue is unusually complex and avoid generic educational prose.
- FR12 requires language focused on Issue clarity rather than individual performance.
- The product experience is a GitHub Issue Markdown comment, not a separate UI or PM workflow.
- The product counter-metric is report comprehensiveness: prefer concise, actionable output over exhaustive explanation.

### Current Code State

`src/report-renderer.ts` currently:

- Exposes the pure function `renderReport(report: PreflightReport): string`.
- Renders the canonical report heading and `Missing Context` section.
- Converts internal status values into title-cased labels.
- Renders missing-context items as Markdown task-list items.
- Uses `escapeInlineText` to collapse whitespace, escape HTML characters, and escape Markdown control characters.

Extend these patterns rather than introducing a second renderer, a template engine, or a new dependency.

### Rendering Contract

The canonical section order after this story is:

```md
## Dev Ticket Preflight: Needs Clarification

### Missing Context
- [ ] **Acceptance criteria:** Missing testable pass/fail criteria.

### Why This Matters
Implementation cannot be verified consistently without explicit outcomes.

### Suggested Questions
- [ ] What observable result should confirm success?
```

Rules:

- `Why This Matters` renders the validated `risk_explanation` only. The renderer must not invent coaching, educational, or author-directed prose.
- Suggested questions use Markdown task-list syntax and preserve provider order.
- Omit an empty `Suggested Questions` section.
- Escape all provider-derived inline text using the existing helper.
- Do not render `Draft Acceptance Criteria` in this story.

### Checklist-Line Budget

Make FR10 deterministic so implementation and tests agree:

```ts
const TARGET_MAX_CHECKLIST_LINES = 10
const remainingQuestionSlots = Math.max(
  0,
  TARGET_MAX_CHECKLIST_LINES - report.missing_context.length
)
const renderedQuestions = report.suggested_questions.slice(0, remainingQuestionSlots)
```

The budget counts rendered task-list lines from `missing_context` plus `suggested_questions`. Missing context has priority because silently hiding validated implementation risk would be worse than exceeding the target. If missing context alone exceeds 10 items, render it all and omit suggested questions as the unusually-complex exception.

The lower bound of 5 is a product target, not permission for the renderer to invent filler. When the validated report contains fewer than 5 useful checklist/suggestion items, render only those useful items.

### Architecture Compliance

- Keep Markdown generation inside `src/report-renderer.ts`.
- Accept validated, policy-normalized `PreflightReport` data only.
- Keep rendering deterministic and side-effect free.
- Use Markdown task-list syntax for actionable items.
- Omit empty sections rather than emitting placeholders.
- Never expose raw prompt content or raw provider JSON.
- Keep `github-comments.ts` as the only future GitHub write boundary.
- No package dependency changes are required.

### Previous Story Intelligence

Story 3.1 established the renderer contract and review expectations:

- Exact-output tests are preferred for canonical Markdown shape and section order.
- Every rendered item should be proven to appear once and in input order.
- Missing-context empty state must remain explicit.
- Provider-derived text must not be able to inject Markdown structure.
- The renderer must not silently drop missing-context items.

The prior review specifically tightened tests around exact output and item preservation. Preserve that rigor when adding the two new sections.

### Testing Requirements

Add tests in `__tests__/report-renderer.test.ts`; do not create a separate integration test layer for this pure function.

Minimum high-value cases:

- Full canonical output with missing context, risk explanation, and suggested questions.
- Empty suggested-question list omits the section.
- Questions are rendered once, in order, as task-list items.
- Inline escaping protects risk explanation and questions from newlines, headings, HTML, and task-list injection.
- A report with 8 missing-context items renders only 2 suggested questions.
- A report with 10 or more missing-context items keeps all missing context and renders no suggested questions.
- A report with fewer than 5 useful items does not receive filler prose or fabricated checklist items.
- Existing Story 3.1 tests continue to pass, except the prior assertion that later sections are absent must be updated to allow this story's sections while still excluding `Draft Acceptance Criteria`.

### Project Structure Notes

Expected files:

- Modify: `src/report-renderer.ts`
- Modify: `__tests__/report-renderer.test.ts`
- Do not modify: `package.json`, `package-lock.json`, GitHub write modules, schema modules, or generated output unless implementation proves a real need.

### Technical Research

No external technical research is needed. This story uses existing TypeScript, Markdown rendering, schema, and test patterns already present in the repository.

## References

- `_bmad-output/planning-artifacts/epics.md` - Epic 3 and Story 3.2 acceptance criteria
- `_bmad-output/planning-artifacts/architecture.md` - canonical Markdown report structure and renderer ownership
- `_bmad-output/planning-artifacts/prds/prd-serminal-2026-06-03/prd.md` - FR8, FR10, FR12, report UX, and concision target
- `_bmad-output/implementation-artifacts/3-1-render-canonical-markdown-preflight-report.md` - established renderer behavior and review learnings
- `src/report-renderer.ts` - current implementation
- `__tests__/report-renderer.test.ts` - current renderer test suite

## Dev Agent Record

### Agent Model Used

To be completed by the implementing agent.

### Debug Log References

To be completed by the implementing agent.

### Completion Notes List

To be completed by the implementing agent.

### File List

To be completed by the implementing agent.

### Change Log

- 2026-06-04: Story created and marked ready for development.
