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
      `## Dev Ticket Preflight: ${label}\n\n` +
        "### Missing Context\n" +
        "- [ ] **Acceptance criteria:** Missing testable pass/fail criteria.\n\n" +
        "### Why This Matters\n" +
        "The work artifact lacks enough detail for a reliable implementation.\n\n" +
        "### Suggested Questions\n" +
        "- [ ] What observable behavior proves completion?"
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
        "- [ ] **Edge cases:** Important edge cases are not specified.\n\n" +
        "### Why This Matters\n" +
        "The work artifact lacks enough detail for a reliable implementation.\n\n" +
        "### Suggested Questions\n" +
        "- [ ] What observable behavior proves completion?"
    )
    expect(markdown.match(/^- \[ \] /gm)).toHaveLength(3)
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
        "No material missing context was found.\n\n" +
        "### Why This Matters\n" +
        "The work artifact lacks enough detail for a reliable implementation.\n\n" +
        "### Suggested Questions\n" +
        "- [ ] What observable behavior proves completion?"
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

  it("renders risk explanation and suggested questions safely in canonical order", () => {
    const markdown = renderReport({
      ...baseReport,
      risk_explanation:
        "1. Implementation risk.\n### Injected Section\n<div>Injected HTML</div>",
      suggested_questions: [
        { text: "First question?\n- [ ] Injected task" },
        { text: "Second question?" }
      ]
    })

    expect(markdown).toContain(
      "### Why This Matters\n1\\. Implementation risk. \\#\\#\\# Injected Section &lt;div&gt;Injected HTML&lt;/div&gt;\n\n" +
        "### Suggested Questions\n" +
        "- [ ] First question? \\- \\[ \\] Injected task\n" +
        "- [ ] Second question?"
    )
    expect(markdown.indexOf("### Missing Context")).toBeLessThan(
      markdown.indexOf("### Why This Matters")
    )
    expect(markdown.indexOf("### Why This Matters")).toBeLessThan(
      markdown.indexOf("### Suggested Questions")
    )
    expect(markdown).not.toContain("\n### Injected Section")
    expect(markdown).not.toContain("\n- [ ] Injected task")
    expect(markdown).not.toContain("<div>")
    expect(markdown.match(/First question\?/g)).toHaveLength(1)
    expect(markdown.match(/Second question\?/g)).toHaveLength(1)
  })

  it("omits Suggested Questions when no questions are available", () => {
    const markdown = renderReport({ ...baseReport, suggested_questions: [] })

    expect(markdown).toContain("### Why This Matters")
    expect(markdown).not.toContain("### Suggested Questions")
  })

  it("caps suggested questions using the remaining ten-line budget", () => {
    const missing_context = Array.from({ length: 8 }, (_, index) => ({
      category: `context_${index + 1}`,
      detail: `Missing context ${index + 1}.`
    }))
    const suggested_questions = Array.from({ length: 4 }, (_, index) => ({
      text: `Question ${index + 1}?`
    }))

    const markdown = renderReport({
      ...baseReport,
      missing_context,
      suggested_questions
    })

    expect(markdown.match(/^- \[ \] /gm)).toHaveLength(10)
    expect(markdown).toContain("- [ ] Question 1?\n- [ ] Question 2?")
    expect(markdown).not.toContain("Question 3?")
    expect(markdown).not.toContain("Question 4?")
  })

  it("preserves unusually complex missing context and omits questions", () => {
    const missing_context = Array.from({ length: 11 }, (_, index) => ({
      category: `context_${index + 1}`,
      detail: `Missing context ${index + 1}.`
    }))

    const markdown = renderReport({ ...baseReport, missing_context })

    expect(markdown.match(/^- \[ \] /gm)).toHaveLength(11)
    expect(markdown).toContain("Missing context 11.")
    expect(markdown).not.toContain("### Suggested Questions")
    expect(markdown).not.toContain(baseReport.suggested_questions[0].text)
  })

  it("omits questions when missing context reaches the ten-line budget", () => {
    const missing_context = Array.from({ length: 10 }, (_, index) => ({
      category: `context_${index + 1}`,
      detail: `Missing context ${index + 1}.`
    }))

    const markdown = renderReport({ ...baseReport, missing_context })

    expect(markdown.match(/^- \[ \] /gm)).toHaveLength(10)
    expect(markdown).toContain("Missing context 10.")
    expect(markdown).not.toContain("### Suggested Questions")
    expect(markdown).not.toContain(baseReport.suggested_questions[0].text)
  })

  it("does not invent filler or render sections owned by later stories", () => {
    const markdown = renderReport(baseReport)

    expect(markdown.match(/^- \[ \] /gm)).toHaveLength(2)
    expect(markdown).not.toContain("Draft Acceptance Criteria")
    expect(markdown).not.toContain(baseReport.draft_acceptance_criteria[0].text)
    expect(markdown).not.toContain("Here are some tips")
  })
})
