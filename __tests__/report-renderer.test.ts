import type { PreflightReport } from "../src/report-schema.js"
import { renderReport } from "../src/report-renderer.js"

const baseReport: PreflightReport = {
  status: "needs_clarification",
  missing_context: [
    {
      category: "acceptance_criteria",
      detail: "Missing testable pass/fail criteria."
    }
  ],
  risk_explanation:
    "The work artifact lacks enough detail for a reliable implementation.",
  suggested_questions: [
    { text: "What observable behavior proves completion?" }
  ],
  draft_acceptance_criteria: [
    { text: "Suggested: The expected behavior is visible." }
  ],
  confidence: "medium",
  evidence: [
    {
      source: "body",
      detail: "The body states a goal but no acceptance criteria."
    }
  ]
}

describe("renderReport", () => {
  it.each([
    ["ready", "Ready"],
    ["needs_clarification", "Needs Clarification"],
    ["high_risk", "High Risk"]
  ] as const)("renders %s as the user-facing status %s", (status, label) => {
    const markdown = renderReport({ ...baseReport, status })

    expect(markdown).toBe(
      `## Dev Ticket Preflight: ${label}\n\n### Missing Context\n- [ ] **Acceptance criteria:** Missing testable pass/fail criteria.`
    )
    expect(markdown).not.toContain(status)
  })

  it("renders every missing context item once and in order", () => {
    const markdown = renderReport({
      ...baseReport,
      missing_context: [
        ...baseReport.missing_context,
        {
          category: "edge_cases",
          detail: "Important edge cases are not specified."
        }
      ]
    })

    expect(markdown).toBe(
      "## Dev Ticket Preflight: Needs Clarification\n\n" +
        "### Missing Context\n" +
        "- [ ] **Acceptance criteria:** Missing testable pass/fail criteria.\n" +
        "- [ ] **Edge cases:** Important edge cases are not specified."
    )
    expect(markdown.match(/^- \[ \] /gm)).toHaveLength(2)
  })

  it("renders an explicit empty state without inventing checklist items", () => {
    const markdown = renderReport({
      ...baseReport,
      status: "ready",
      missing_context: []
    })

    expect(markdown).toBe(
      "## Dev Ticket Preflight: Ready\n\n" +
        "### Missing Context\n" +
        "No material missing context was found."
    )
  })

  it("keeps Markdown-shaped item text inside one task-list item", () => {
    const markdown = renderReport({
      ...baseReport,
      missing_context: [
        {
          category: "scope\n### Injected Section",
          detail:
            "Clarify the scope.\n- [ ] Injected task\n<div>Injected HTML</div>"
        }
      ]
    })

    expect(markdown).toContain(
      "- [ ] **Scope \\#\\#\\# Injected Section:** Clarify the scope. \\- \\[ \\] Injected task &lt;div&gt;Injected HTML&lt;/div&gt;"
    )
    expect(markdown).not.toContain("\n### Injected Section")
    expect(markdown).not.toContain("\n- [ ] Injected task")
    expect(markdown).not.toContain("<div>")
  })

  it("does not render sections owned by later stories", () => {
    const markdown = renderReport(baseReport)

    expect(markdown).not.toContain("Why This Matters")
    expect(markdown).not.toContain("Suggested Questions")
    expect(markdown).not.toContain("Draft Acceptance Criteria")
    expect(markdown).not.toContain(baseReport.risk_explanation)
    expect(markdown).not.toContain(baseReport.suggested_questions[0].text)
    expect(markdown).not.toContain(baseReport.draft_acceptance_criteria[0].text)
  })
})
