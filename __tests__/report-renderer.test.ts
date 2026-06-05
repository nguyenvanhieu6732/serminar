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
    ["ready", "Sẵn Sàng"],
    ["needs_clarification", "Cần Làm Rõ"],
    ["high_risk", "Rủi Ro Cao"]
  ] as const)("renders %s as the user-facing status %s", (status, label) => {
    const markdown = renderReport({ ...baseReport, status })

    expect(markdown).toBe(
      `## Kiểm Tra Ticket Trước Khi Dev: ${label}\n\n` +
        "### Ngữ Cảnh Còn Thiếu\n" +
        "- [ ] **Acceptance criteria:** Missing testable pass/fail criteria.\n\n" +
        "### Vì Sao Điều Này Quan Trọng\n" +
        "The work artifact lacks enough detail for a reliable implementation.\n\n" +
        "### Câu Hỏi Gợi Ý\n" +
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
      "## Kiểm Tra Ticket Trước Khi Dev: Cần Làm Rõ\n\n" +
        "### Ngữ Cảnh Còn Thiếu\n" +
        "- [ ] **Acceptance criteria:** Missing testable pass/fail criteria.\n" +
        "- [ ] **Edge cases:** Important edge cases are not specified.\n\n" +
        "### Vì Sao Điều Này Quan Trọng\n" +
        "The work artifact lacks enough detail for a reliable implementation.\n\n" +
        "### Câu Hỏi Gợi Ý\n" +
        "- [ ] What observable behavior proves completion?"
    )
    expect(markdown.match(/^- \[ \] /gm)).toHaveLength(3)
  })

  it("renders an explicit empty missing-context state without inventing missing-context items", () => {
    const markdown = renderReport({
      ...baseReport,
      status: "ready",
      missing_context: []
    })

    expect(markdown).toBe(
      "## Kiểm Tra Ticket Trước Khi Dev: Sẵn Sàng\n\n" +
        "### Ngữ Cảnh Còn Thiếu\n" +
        "Không phát hiện thiếu ngữ cảnh quan trọng.\n\n" +
        "### Vì Sao Điều Này Quan Trọng\n" +
        "The work artifact lacks enough detail for a reliable implementation.\n\n" +
        "### Câu Hỏi Gợi Ý\n" +
        "- [ ] What observable behavior proves completion?\n\n" +
        "### Tiêu Chí Chấp Nhận Nháp\n" +
        "Gợi ý có thể chỉnh sửa:\n" +
        "- [ ] Suggested: The expected behavior is visible."
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
      "### Vì Sao Điều Này Quan Trọng\n1\\. Implementation risk. \\#\\#\\# Injected Section &lt;div&gt;Injected HTML&lt;/div&gt;\n\n" +
        "### Câu Hỏi Gợi Ý\n" +
        "- [ ] First question? \\- \\[ \\] Injected task\n" +
        "- [ ] Second question?"
    )
    expect(markdown.indexOf("### Ngữ Cảnh Còn Thiếu")).toBeLessThan(
      markdown.indexOf("### Vì Sao Điều Này Quan Trọng")
    )
    expect(markdown.indexOf("### Vì Sao Điều Này Quan Trọng")).toBeLessThan(
      markdown.indexOf("### Câu Hỏi Gợi Ý")
    )
    expect(markdown).not.toContain("\n### Injected Section")
    expect(markdown).not.toContain("\n- [ ] Injected task")
    expect(markdown).not.toContain("<div>")
    expect(markdown.match(/First question\?/g)).toHaveLength(1)
    expect(markdown.match(/Second question\?/g)).toHaveLength(1)
  })

  it("omits suggested questions when no questions are available", () => {
    const markdown = renderReport({ ...baseReport, suggested_questions: [] })

    expect(markdown).toContain("### Vì Sao Điều Này Quan Trọng")
    expect(markdown).not.toContain("### Câu Hỏi Gợi Ý")
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
    expect(markdown).not.toContain("### Câu Hỏi Gợi Ý")
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
    expect(markdown).not.toContain("### Câu Hỏi Gợi Ý")
    expect(markdown).not.toContain(baseReport.suggested_questions[0].text)
  })

  it("renders safe draft acceptance criteria as editable suggestions", () => {
    const markdown = renderReport({
      ...baseReport,
      status: "ready",
      missing_context: [],
      draft_acceptance_criteria: [
        { text: "The export completes with the selected date range." },
        {
          text: "The result is testable.\n### Injected Section\n- [ ] Injected task\n<div>Injected HTML</div>"
        }
      ]
    })

    expect(markdown).toBe(
      "## Kiểm Tra Ticket Trước Khi Dev: Sẵn Sàng\n\n" +
        "### Ngữ Cảnh Còn Thiếu\n" +
        "Không phát hiện thiếu ngữ cảnh quan trọng.\n\n" +
        "### Vì Sao Điều Này Quan Trọng\n" +
        "The work artifact lacks enough detail for a reliable implementation.\n\n" +
        "### Câu Hỏi Gợi Ý\n" +
        "- [ ] What observable behavior proves completion?\n\n" +
        "### Tiêu Chí Chấp Nhận Nháp\n" +
        "Gợi ý có thể chỉnh sửa:\n" +
        "- [ ] The export completes with the selected date range.\n" +
        "- [ ] The result is testable. \\#\\#\\# Injected Section \\- \\[ \\] Injected task &lt;div&gt;Injected HTML&lt;/div&gt;"
    )
    expect(markdown.match(/Gợi ý có thể chỉnh sửa:/g)).toHaveLength(1)
    expect(markdown.match(/The export completes/g)).toHaveLength(1)
    expect(markdown.match(/The result is testable/g)).toHaveLength(1)
    expect(markdown).not.toContain("\n### Injected Section")
    expect(markdown).not.toContain("\n- [ ] Injected task")
    expect(markdown).not.toContain("<div>")
  })

  it.each(["needs_clarification", "high_risk"] as const)(
    "omits draft acceptance criteria for %s reports",
    (status) => {
      const markdown = renderReport({ ...baseReport, status })

      expect(markdown).toContain("### Câu Hỏi Gợi Ý")
      expect(markdown).not.toContain("### Tiêu Chí Chấp Nhận Nháp")
      expect(markdown).not.toContain(
        baseReport.draft_acceptance_criteria[0].text
      )
    }
  )

  it("omits draft acceptance criteria when context is missing even if status is ready", () => {
    const markdown = renderReport({ ...baseReport, status: "ready" })

    expect(markdown).toContain("### Ngữ Cảnh Còn Thiếu")
    expect(markdown).toContain("### Câu Hỏi Gợi Ý")
    expect(markdown).not.toContain("### Tiêu Chí Chấp Nhận Nháp")
    expect(markdown).not.toContain(baseReport.draft_acceptance_criteria[0].text)
  })

  it("omits draft acceptance criteria when none are available", () => {
    const markdown = renderReport({
      ...baseReport,
      status: "ready",
      missing_context: [],
      draft_acceptance_criteria: []
    })

    expect(markdown).not.toContain("### Tiêu Chí Chấp Nhận Nháp")
    expect(markdown).not.toContain("Gợi ý có thể chỉnh sửa:")
  })

  it("renders draft acceptance criteria after the risk explanation when questions are absent", () => {
    const markdown = renderReport({
      ...baseReport,
      status: "ready",
      missing_context: [],
      suggested_questions: []
    })

    expect(markdown).toContain(
      "### Vì Sao Điều Này Quan Trọng\n" +
        "The work artifact lacks enough detail for a reliable implementation.\n\n" +
        "### Tiêu Chí Chấp Nhận Nháp\n" +
        "Gợi ý có thể chỉnh sửa:"
    )
    expect(markdown).not.toContain("### Câu Hỏi Gợi Ý")
  })

  it("does not invent filler or render sections owned by later stories", () => {
    const markdown = renderReport(baseReport)

    expect(markdown.match(/^- \[ \] /gm)).toHaveLength(2)
    expect(markdown).not.toContain("Tiêu Chí Chấp Nhận Nháp")
    expect(markdown).not.toContain(baseReport.draft_acceptance_criteria[0].text)
    expect(markdown).not.toContain("Here are some tips")
  })
})
