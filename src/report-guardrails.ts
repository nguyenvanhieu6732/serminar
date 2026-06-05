import type { PreflightReport } from "./report-schema.js"

const PEOPLE_ROLES =
  "author|issue owner|ticket owner|requester|reporter|developer|engineer|teammate|team member|assignee"

const UNSAFE_NORMALIZED_PATTERNS = [
  /\b(?:readiness\s+)?(?:score|rating|rank|grade)\b.{0,32}\b(?:\d+\s*(?:\/|out of)\s*\d+|\d+%|high|medium|low)\b/,
  /\b(?:\d+\s*(?:\/|out of)\s*\d+|\d+%)\b.{0,32}\b(?:readiness\s+)?(?:score|rating|rank|grade)\b/,
  new RegExp(
    `\\b(?:${PEOPLE_ROLES})\\b.{0,48}\\b(?:failed\\s+to|forgot\\s+to|neglected\\s+to|omitted|caused|responsible|to blame|at fault)\\b`
  ),
  new RegExp(
    `\\b(?:score|rate|rating|rank|grade|performance)\\b.{0,48}\\b(?:${PEOPLE_ROLES}|person|people|team)\\b`
  ),
  new RegExp(
    `\\b(?:${PEOPLE_ROLES}|person|people|team)\\b.{0,48}\\b(?:score|rating|rank|grade|performance)\\b`
  ),
  /\b(?:remove|add|apply|replace|change)\b.{0,48}\blabels?\b/,
  /\blabels?\b.{0,48}\b(?:removed|added|applied|replaced|changed)\b/,
  /\b(?:assign|unassign|reassign)\b.{0,48}\b(?:issue|ticket|user|person|people|owner|assignee|team)\b/,
  /\b(?:issue|ticket|user|person|people|owner|assignee|team)\b.{0,48}\b(?:assigned|unassigned|reassigned)\b/,
  /\b(?:edit|update|rewrite|replace|change)\b.{0,48}\b(?:issue|ticket)\s+(?:body|description)\b/,
  /\b(?:issue|ticket)\s+(?:body|description)\b.{0,48}\b(?:edited|updated|rewritten|replaced|changed)\b/,
  /\b(?:close|reopen|lock|unlock)\b.{0,32}\b(?:issue|ticket)\b/,
  /\b(?:issue|ticket)\b.{0,32}\b(?:closed|reopened|locked|unlocked)\b/,
  /\b(?:write|create|modify|edit|delete|remove)\b.{0,48}\b(?:repository\s+)?files?\b/,
  /\b(?:repository\s+)?files?\b.{0,48}\b(?:written|created|modified|edited|deleted|removed)\b/,
  /\b(?:create|add|require|mark)\b.{0,48}\brequired checks?\b/,
  /\brequired checks?\b.{0,48}\b(?:created|added|required|marked)\b/,
  /\b(?:close|merge|update|edit|change)\b.{0,48}\b(?:pull request|pr)\b/,
  /\b(?:pull request|pr)\b.{0,48}\b(?:closed|merged|updated|edited|changed)\b/,
  /\b(?:post|create|add|update|edit|reply)\b.{0,48}\b(?:issue\s+)?comments?\b/,
  /\b(?:issue\s+)?comments?\b.{0,48}\b(?:posted|created|added|updated|edited|replied)\b/,
  /\b(?:block|stop|prevent|gate|halt)\b.{0,48}\b(?:development|implementation|merge|merging|workflow|release)\b/
]

const NAMED_PERSON_CAUSALITY_PATTERN =
  /\b[A-Z][a-z]{1,}\b.{0,48}\b(?:cause|caused|failed\s+to|forgot\s+to|neglected\s+to|omitted|is responsible|is to blame)\b/

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
  const normalized = text.normalize("NFKC").replace(/\s+/g, " ")

  if (NAMED_PERSON_CAUSALITY_PATTERN.test(normalized)) {
    return true
  }

  const normalizedLowercase = normalized.toLowerCase()
  return UNSAFE_NORMALIZED_PATTERNS.some((pattern) =>
    pattern.test(normalizedLowercase)
  )
}
