import type { PreflightReport } from "./report-schema.js"

const PEOPLE_ROLES =
  "author|issue owner|ticket owner|requester|reporter|developer|engineer|teammate|team member|assignee|user"

const UNSAFE_NORMALIZED_PATTERNS = [
  new RegExp(
    `\\b(?:${PEOPLE_ROLES})\\b.{0,48}\\b(?:failed|forgot|neglected|omitted|caused|responsible|to blame|at fault)\\b`
  ),
  new RegExp(
    `\\b(?:score|rate|rating|rank|grade|performance)\\b.{0,48}\\b(?:${PEOPLE_ROLES}|person|people|team)\\b`
  ),
  new RegExp(
    `\\b(?:${PEOPLE_ROLES}|person|people|team)\\b.{0,48}\\b(?:score|rating|rank|grade|performance)\\b`
  ),
  /\b(?:remove|add|apply|replace|change)\b.{0,48}\blabels?\b/,
  /\b(?:assign|unassign|reassign)\b.{0,48}\b(?:issue|ticket|user|person|people|owner|assignee|team)\b/,
  /\b(?:edit|update|rewrite|replace|change)\b.{0,48}\b(?:issue|ticket)\s+(?:body|description)\b/,
  /\b(?:close|reopen|lock|unlock)\b.{0,32}\b(?:issue|ticket)\b/,
  /\b(?:write|create|modify|edit|delete|remove)\b.{0,48}\b(?:repository\s+)?files?\b/,
  /\b(?:create|add|require|mark)\b.{0,48}\brequired checks?\b/,
  /\b(?:close|merge|update|edit|change)\b.{0,48}\b(?:pull request|pr)\b/,
  /\b(?:block|stop|prevent|gate|halt)\b.{0,48}\b(?:development|implementation|merge|merging|workflow|release)\b/
]

const NAMED_PERSON_CAUSALITY_PATTERN =
  /\b[A-Z][a-z]{1,}\b.{0,48}\b(?:cause|caused|failed|forgot|neglected|omitted|is responsible|is to blame)\b/

export class ReportGuardrailError extends Error {
  constructor(message = "Unsafe preflight report") {
    super(message)
    this.name = "ReportGuardrailError"
  }
}

export function enforceReportGuardrails(
  report: PreflightReport
): PreflightReport {
  for (const text of getRenderableText(report)) {
    if (isUnsafeText(text)) {
      throw new ReportGuardrailError()
    }
  }

  return report
}

function getRenderableText(report: PreflightReport): string[] {
  return [
    ...report.missing_context.flatMap(({ category, detail }) => [
      category,
      detail
    ]),
    report.risk_explanation,
    ...report.suggested_questions.map(({ text }) => text),
    ...report.draft_acceptance_criteria.map(({ text }) => text)
  ]
}

function isUnsafeText(text: string): boolean {
  if (NAMED_PERSON_CAUSALITY_PATTERN.test(text)) {
    return true
  }

  const normalized = text.normalize("NFKC").toLowerCase().replace(/\s+/g, " ")
  return UNSAFE_NORMALIZED_PATTERNS.some((pattern) => pattern.test(normalized))
}
