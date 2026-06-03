import type { PreflightReport } from "./report-schema.js"

export function renderReport(report: PreflightReport): string {
  return `# Dev Ticket Preflight\n\nStatus: ${report.status}`
}
