import type {
  ChecklistItem,
  MissingContextItem,
  PreflightReport,
  PreflightStatus
} from "./report-schema.js"

const TARGET_MAX_CHECKLIST_LINES = 10

export function renderReport(report: PreflightReport): string {
  const sections = [
    `## Kiểm Tra Ticket Trước Khi Dev: ${renderStatus(report.status)}`,
    `### Ngữ Cảnh Còn Thiếu\n${renderMissingContext(report.missing_context)}`,
    `### Vì Sao Điều Này Quan Trọng\n${escapeInlineText(report.risk_explanation)}`
  ]
  const suggestedQuestions = renderSuggestedQuestions(report)

  if (suggestedQuestions !== "") {
    sections.push(`### Câu Hỏi Gợi Ý\n${suggestedQuestions}`)
  }

  const draftAcceptanceCriteria = renderDraftAcceptanceCriteria(report)

  if (draftAcceptanceCriteria !== "") {
    sections.push(
      `### Tiêu Chí Chấp Nhận Nháp\nGợi ý có thể chỉnh sửa:\n${draftAcceptanceCriteria}`
    )
  }

  return sections.join("\n\n")
}

function renderStatus(status: PreflightStatus): string {
  switch (status) {
    case "ready":
      return "Sẵn Sàng"
    case "needs_clarification":
      return "Cần Làm Rõ"
    case "high_risk":
      return "Rủi Ro Cao"
  }
}

function renderMissingContext(items: MissingContextItem[]): string {
  if (items.length === 0) {
    return "Không phát hiện thiếu ngữ cảnh quan trọng."
  }

  return items
    .map(
      ({ category, detail }) =>
        `- [ ] **${renderCategory(category)}:** ${escapeInlineText(detail)}`
    )
    .join("\n")
}

function renderSuggestedQuestions(report: PreflightReport): string {
  const remainingQuestionSlots = Math.max(
    0,
    TARGET_MAX_CHECKLIST_LINES - report.missing_context.length
  )

  return report.suggested_questions
    .slice(0, remainingQuestionSlots)
    .map(renderChecklistItem)
    .join("\n")
}

function renderDraftAcceptanceCriteria(report: PreflightReport): string {
  if (report.status !== "ready" || report.missing_context.length > 0) {
    return ""
  }

  return report.draft_acceptance_criteria.map(renderChecklistItem).join("\n")
}

function renderChecklistItem({ text }: ChecklistItem): string {
  return `- [ ] ${escapeInlineText(text)}`
}

function renderCategory(category: string): string {
  const label = category.replace(/_/g, " ")
  return capitalizeFirst(escapeInlineText(label))
}

function capitalizeFirst(value: string): string {
  return value.length === 0 ? value : value[0].toUpperCase() + value.slice(1)
}

function escapeInlineText(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/([\\`*_[\]{}#+|-])/g, "\\$1")
    .replace(/^(\d+)([.)])(?=\s)/, "$1\\$2")
}
