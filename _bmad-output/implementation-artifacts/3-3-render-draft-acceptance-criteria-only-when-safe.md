---
baseline_commit: f408363
---

# Story 3.3: Render Draft Acceptance Criteria Only When Safe

Status: done

Story Key: `3-3-render-draft-acceptance-criteria-only-when-safe`

## Story

As an issue owner,
I want draft acceptance criteria only when there is enough context,
So that the Action does not produce false precision from vague tickets.

## Acceptance Criteria

1. Given the validated report includes safe draft acceptance criteria, when Markdown is rendered, then the report includes a `Draft Acceptance Criteria` section, and each criterion is testable and framed as editable.
2. Given core context is missing, when Markdown is rendered, then the `Draft Acceptance Criteria` section is omitted, and the report prioritizes questions needed to clarify the Issue.
3. Given acceptance criteria are rendered, when the output is reviewed, then they do not imply final product decisions beyond the Issue context, and they do not introduce GitHub mutations or workflow gates.

## Tasks / Subtasks

- [x] Add a deterministic safety gate for draft acceptance criteria in `src/report-renderer.ts`. (AC: 1, 2, 3)
  - [x] Render criteria only when `report.status === "ready"`, `report.missing_context.length === 0`, and `report.draft_acceptance_criteria` is non-empty.
  - [x] Treat both status and missing-context checks as defense in depth, even though policy-normalized reports should already make `ready` equivalent to no material missing context.
  - [x] Omit the entire section for `needs_clarification`, `high_risk`, any non-empty `missing_context`, or an empty criteria list.
  - [x] Keep `renderReport(report: PreflightReport): string` pure and dependent only on validated, policy-normalized report data.

- [x] Extend the canonical Markdown report with locally owned editable framing. (AC: 1, 3)
  - [x] Append `### Draft Acceptance Criteria` after `Suggested Questions`, or after `Why This Matters` when no questions are rendered.
  - [x] Add one concise fixed framing line such as `Editable suggestions:` before the criteria task list.
  - [x] Render each criterion as a Markdown task-list item in provider order.
  - [x] Reuse the existing checklist-item and inline-escaping behavior so provider text cannot inject headings, HTML, extra task items, or other Markdown structure.
  - [x] Do not rewrite, invent, or semantically "improve" criteria in the renderer; upstream LLM instructions and validation own whether content is testable and grounded.

- [x] Preserve Story 3.2 behavior and scope boundaries. (AC: 1, 2, 3)
  - [x] Keep missing context and suggested questions unchanged when criteria are omitted.
  - [x] Do not change the existing 10-line budget for `missing_context` plus `suggested_questions`; this story has no approved product rule for reallocating or truncating draft criteria.
  - [x] Do not render raw prompt text, raw LLM JSON, evidence, or generic educational prose.
  - [x] Do not add GitHub API writes, comment posting, action orchestration, schema changes, dependencies, people-scoring logic, or workflow-gate behavior.

- [x] Extend focused renderer tests in `__tests__/report-renderer.test.ts`. (AC: 1, 2, 3)
  - [x] Assert exact canonical output and section order for a ready report with safe draft acceptance criteria.
  - [x] Assert editable framing appears once and criteria render once, in provider order, as Markdown task-list items.
  - [x] Assert criteria cannot inject headings, task-list items, HTML, extra lines, or other Markdown structure.
  - [x] Assert the section is omitted when the criteria list is empty.
  - [x] Assert the section is omitted for `needs_clarification` and `high_risk`.
  - [x] Assert the section is omitted when `missing_context` is non-empty, including an inconsistent input whose status is `ready`.
  - [x] Assert questions remain present and unchanged when criteria are omitted because clarification is still needed.
  - [x] Preserve Story 3.1 and 3.2 exact-output, empty-state, budget, and injection-safety regression coverage.

- [x] Run the local validation gate.
  - [x] Run `rtk npm test`.
  - [x] Run `rtk npm run build`.
  - [x] Run `rtk npm run all`.

## Dev Notes

### Scope Boundary

Story 3.3 extends the existing pure Markdown renderer only. Story 3.1 owns the heading, status, `Missing Context`, and empty state. Story 3.2 owns `Why This Matters`, `Suggested Questions`, inline escaping, and the deterministic 10-line budget for missing-context plus suggested-question task items.

Do not implement later Epic 3 responsibilities:

- Story 3.4 owns GitHub comment posting, append-only behavior, API failure handling, and comment ID logging.
- Story 3.5 owns final enforcement of non-blocking behavior, no people analytics, and mutation guardrails across the Action.

### Source Context

- FR9 permits Draft Acceptance Criteria only when the Issue provides enough context; missing-context questions are more important when the Issue is underspecified.
- The product counter-metric explicitly says not to optimize for AI-generated acceptance criteria volume.
- The architecture requires Markdown to be rendered only from validated `PreflightReport` data and forbids model output from controlling GitHub mutations or workflow state.
- The LLM client already instructs the provider to include criteria only when title/body context is sufficient, make them testable, and phrase them as editable suggestions. The renderer still needs a local exposure gate and local editable framing.

### Deterministic Safety Rule

The project does not currently define a reliable taxonomy that distinguishes "core" missing context from "minor" missing context. Use the conservative rule:

```ts
const shouldRenderDraftAcceptanceCriteria =
  report.status === "ready" &&
  report.missing_context.length === 0 &&
  report.draft_acceptance_criteria.length > 0
```

`applyConservativeStatusPolicy` already normalizes a report to `ready` only when `missing_context` is empty. Checking both fields in the renderer protects against inconsistent typed inputs, future callers that bypass policy normalization, and regression tests.

When the gate fails, omit the entire `Draft Acceptance Criteria` section. Do not replace it with a placeholder, warning, or educational explanation. Existing `Suggested Questions` remain the clarification path.

### Rendering Contract

The canonical section order after this story is:

```md
## Dev Ticket Preflight: Ready

### Missing Context
No material missing context was found.

### Why This Matters
The work artifact provides enough detail for a reliable implementation.

### Suggested Questions
- [ ] Is there a specific edge case worth confirming?

### Draft Acceptance Criteria
Editable suggestions:
- [ ] The export completes with the selected date range.
```

Rules:

- Omit `Suggested Questions` when Story 3.2 budgeting leaves no questions.
- Append `Draft Acceptance Criteria` after `Suggested Questions` when present; otherwise append it after `Why This Matters`.
- Use a fixed local editable-framing line so the user is not asked to treat model-generated criteria as final product decisions.
- Render provider criteria with the existing `renderChecklistItem` and `escapeInlineText` helpers.
- Do not add heuristics that attempt to judge semantic testability inside the renderer. The renderer cannot reliably infer product correctness from a string.
- Do not add semantic keyword filtering for mutation or workflow-gate language in this story. Provider text remains inert comment content; Story 3.5 owns final enforcement against mutation suggestions and workflow-gate language.

### Checklist Budget

Do not alter `TARGET_MAX_CHECKLIST_LINES` or the existing `renderSuggestedQuestions` allocation in this story. Story 3.2 deliberately defines that budget for `missing_context` plus `suggested_questions`. The current requirements do not specify whether draft criteria should compete for those slots, be truncated, or create a separate exception.

If product feedback later shows that criteria make comments too long, define a new explicit allocation rule in a follow-up story rather than silently changing Story 3.2 behavior.

### Current Code State

`src/report-renderer.ts` currently:

- Builds a `sections` array and joins sections with blank lines.
- Renders heading, `Missing Context`, and `Why This Matters` unconditionally.
- Renders `Suggested Questions` conditionally after applying the existing 10-line budget.
- Exposes reusable private helpers `renderChecklistItem` and `escapeInlineText`.
- Collapses whitespace, escapes HTML and Markdown control characters, and protects standalone ordered-list markers.

Extend the existing sections-array pattern. Do not introduce a second renderer, template engine, new dependency, or schema change.

### Previous Story Intelligence

Story 3.2 established several review expectations that directly apply:

- Exact-output tests are preferred for canonical Markdown shape and section order.
- Provider-derived text must not be able to inject Markdown structure.
- Conditional sections should be omitted entirely when empty or unsafe.
- Existing missing-context and suggested-question behavior must not regress.
- Review added protection for ordered-list markers in standalone text and exact boundary coverage for the 10-line question budget.

### Architecture Compliance

- Keep Markdown generation inside `src/report-renderer.ts`.
- Accept validated, policy-normalized `PreflightReport` data only.
- Keep rendering deterministic and side-effect free.
- Use Markdown task-list syntax for actionable items.
- Never expose raw prompt content, raw provider JSON, or evidence.
- Keep `github-comments.ts` as the only future GitHub write boundary.
- No package dependency changes are required.

### Testing Requirements

Add tests only in `__tests__/report-renderer.test.ts`; do not create a new integration layer for this pure function.

Minimum high-value cases:

- Ready + no missing context + non-empty criteria renders the section with fixed editable framing.
- Ready + no missing context + empty criteria omits the section.
- `needs_clarification` or `high_risk` omits criteria even if the provider supplied them.
- Inconsistent `ready` + non-empty missing context omits criteria and preserves clarification questions.
- Criteria containing newlines, headings, HTML, or task-list syntax remain escaped inside one task-list item.
- Existing Story 3.1 and 3.2 tests continue to pass.

### Project Structure Notes

Expected files:

- Modify: `src/report-renderer.ts`
- Modify: `__tests__/report-renderer.test.ts`
- Do not modify: `src/report-schema.ts`, `src/llm-client.ts`, `src/action.ts`, `package.json`, `package-lock.json`, GitHub write modules, or generated output unless implementation proves a real need.

### Technical Research

No external technical research is required. This story uses existing TypeScript, Markdown rendering, schema, and test patterns already present in the repository.

## References

- `_bmad-output/planning-artifacts/epics.md` - Epic 3 and Story 3.3 acceptance criteria
- `_bmad-output/planning-artifacts/architecture.md` - canonical Markdown report order, renderer ownership, and GitHub mutation boundaries
- `_bmad-output/planning-artifacts/prds/prd-serminal-2026-06-03/prd.md` - FR9, FR10, report UX, and acceptance-criteria counter-metric
- `_bmad-output/planning-artifacts/prds/prd-serminal-2026-06-03/addendum.md` - validated local rendering and no-mutation guardrails
- `_bmad-output/implementation-artifacts/3-2-render-suggested-questions-and-checklist-items.md` - renderer patterns, review learnings, and scope boundaries
- `src/report-renderer.ts` - current renderer implementation
- `src/report-schema.ts` - `PreflightReport` contract and conservative status policy
- `src/llm-client.ts` - provider instructions for safe, testable, editable draft criteria
- `__tests__/report-renderer.test.ts` - current renderer regression suite

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Implementation Plan

- Add a renderer-local safety gate for ready reports with no missing context.
- Render a conditional Draft Acceptance Criteria section using existing checklist escaping.
- Add exact-output, omission, ordering, and injection-safety tests before implementation.

### Debug Log References

- RED: `rtk npm test -- --runTestsByPath __tests__/report-renderer.test.ts` failed because the Draft Acceptance Criteria section was not implemented.
- GREEN: targeted renderer suite passed with 18 tests after implementation and expected-output updates.
- Validation: `rtk npm test`, `rtk npm run build`, and `rtk npm run all` passed.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Added a defense-in-depth gate that renders draft acceptance criteria only for ready reports with no missing context.
- Added locally owned editable framing and reused the existing checklist-item escaping path.
- Preserved Story 3.2 question budgeting and clarification behavior.
- Full validation passed: 9 suites, 104 tests, format, lint, TypeScript build, package, and package check.

### File List

- `src/report-renderer.ts`
- `__tests__/report-renderer.test.ts`
- `_bmad-output/implementation-artifacts/3-3-render-draft-acceptance-criteria-only-when-safe.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Change Log

- 2026-06-04: Story created and marked ready for development.
- 2026-06-04: Implemented safe Draft Acceptance Criteria rendering and marked ready for review.
- 2026-06-04: Code review completed with no actionable findings; marked done.
