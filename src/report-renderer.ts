import type {
  MissingContextItem,
  PreflightReport,
  PreflightStatus
} from "./report-schema.js"

export function renderReport(report: PreflightReport): string {
  return [
    `## Dev Ticket Preflight: ${renderStatus(report.status)}`,
    "",
    "### Missing Context",
    renderMissingContext(report.missing_context)
  ].join("\n")
}

function renderStatus(status: PreflightStatus): string {
  switch (status) {
    case "ready":
      return "Ready"
    case "needs_clarification":
      return "Needs Clarification"
    case "high_risk":
      return "High Risk"
  }
}

function renderMissingContext(items: MissingContextItem[]): string {
  if (items.length === 0) {
    return "No material missing context was found."
  }

  return items
    .map(
      ({ category, detail }) =>
        `- [ ] **${renderCategory(category)}:** ${escapeInlineText(detail)}`
    )
    .join("\n")
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
}
