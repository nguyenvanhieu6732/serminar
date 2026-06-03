# Documentation Validation Report: Dev Ticket Preflight PRD

**Date:** 2026-06-03
**Reviewer:** Paige / Technical Writer
**Target:** `prd.md`
**Verdict:** Conditionally ready. The PRD is clear enough for architecture planning, but should resolve a few MVP-level ambiguities before epics/stories are generated.

## High Priority

### 1. Resolve the Ready Label configuration contradiction

**Where:** `prd.md` lines 92, 302, 384, 393

**Issue:** FR-1 says the MVP uses fixed `ready-for-dev` first, but the public Action surface already lists `ready-label` as an optional input. The open question asks whether this should be configurable. This leaves downstream implementation unsure whether config support is in or out of MVP.

**Recommended fix:** Choose one:

- MVP fixed label only: remove `ready-label` from Action Inputs and keep it as a v2 option.
- MVP configurable label: remove the assumption and make `ready-label` an explicit FR/consequence.

**Suggested wording:** “MVP supports `ready-label` input with default `ready-for-dev`; if omitted, only `ready-for-dev` triggers the Action.”

### 2. Define comment lifecycle behavior for v1

**Where:** `prd.md` lines 110, 357, 388

**Issue:** The PRD says duplicate prevention may rely on concurrency and that append-only comments are acceptable, but it does not define what happens when the same issue is labeled again after updates. This affects user experience, testing, and story boundaries.

**Recommended fix:** Add a small requirement under `4.3 Preflight Report Comment`:

“For MVP, each successful run posts a new Preflight Report comment. The product does not search for or update prior reports. Duplicate prevention only applies to concurrent runs, not intentional reruns.”

This makes append-only explicit and prevents architecture from overbuilding update-in-place.

### 3. Add explicit failure/error output requirements

**Where:** `prd.md` lines 243, 267, 367

**Issue:** FR-14 covers missing API key, and NFR-3 says malformed model responses must not mutate the issue beyond logs. But the PRD does not clearly define the user-facing behavior for LLM timeout, invalid structured output, GitHub comment API failure, or missing permissions.

**Recommended fix:** Add an FR under Installation/Configuration or Report Comment:

“The system must fail safely when required credentials, LLM response, or GitHub comment creation fails.”

Consequences should specify:

- Missing API key fails the Action with clear logs.
- Invalid LLM output does not post a misleading report.
- GitHub API failure is surfaced in Action logs.
- No labels, assignees, files, or issue state are changed on failure.

### 4. Tighten data-handling requirements before private-repo use

**Where:** `prd.md` lines 253-261, 265-270, 303, 385

**Issue:** Data handling is directionally clear, but still leaves ambiguity around whether issue comments can be included. The PRD says MVP defaults to excluding comments, while Action input lists `include-comments`. That is acceptable only if the optional behavior is explicitly scoped.

**Recommended fix:** Decide and document:

- MVP title/body only, no `include-comments` input; or
- MVP supports `include-comments=false` by default, with explicit opt-in and capped comment count.

If including comments is deferred, remove `include-comments` from the public surface.

## Medium Priority

### 5. Add report format example

**Where:** `prd.md` section 4.3

**Issue:** Requirements list required sections, but implementation/story authors will benefit from a concrete expected Markdown shape.

**Recommended fix:** Add a short canonical example:

```md
## Dev Ticket Preflight: Needs Clarification

### Missing Context
- [ ] Acceptance criteria
- [ ] Error behavior

### Why This Matters
Without error behavior, implementation may cover only the happy path.

### Suggested Questions
- [ ] What should the user see if export fails?
```

### 6. Clarify “Ready” threshold

**Where:** `prd.md` lines 170-178

**Issue:** `Ready` is defined as no “material” missing context, but “material” is not defined. This may lead to inconsistent model output.

**Recommended fix:** Add criteria:

- `Ready`: actor, expected behavior, and at least one testable acceptance condition are present.
- `Needs Clarification`: task is understandable but one or more readiness categories are incomplete.
- `High Risk`: issue lacks enough context to infer intended behavior.

### 7. Move implementation-specific module structure fully to addendum

**Where:** `prd.md` NFR-4 line 268, `addendum.md`

**Issue:** NFR-4 names implementation module boundaries inside the PRD. It is acceptable, but slightly leaks “how” into the main PRD.

**Recommended fix:** Reword NFR-4 to focus on maintainability outcome:

“The product must keep event handling, analysis, report rendering, and GitHub write behavior separable enough to test independently.”

Keep exact module names in `addendum.md`.

## Low Priority

### 8. Fix encoding artifacts in section references

**Where:** `prd.md` lines 393-399

**Issue:** Section symbols render as `Â§`, which looks like encoding drift.

**Recommended fix:** Replace `Â§` with `Section` or plain `§`.

### 9. Add source reference block

**Where:** PRD end or addendum

**Issue:** PRD references research files in addendum, but the main PRD does not state it is grounded in market and technical research.

**Recommended fix:** Add a short “Source Inputs” paragraph in Document Purpose or keep as-is if the addendum is always read with the PRD.

## Suggested Next Action

Resolve the four High Priority items before running architecture or epics. After those fixes, the PRD is strong enough for:

1. `bmad-create-architecture`
2. `bmad-create-epics-and-stories`
3. `bmad-check-implementation-readiness`
