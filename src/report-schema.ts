export type PreflightStatus = "ready" | "needs_clarification" | "high_risk"

export type Confidence = "low" | "medium" | "high"

export interface ChecklistItem {
  readonly text: string
}

export interface MissingContextItem {
  readonly category: string
  readonly detail: string
}

export interface EvidenceItem {
  readonly source: "title" | "body" | "precheck"
  readonly detail: string
}

export interface PreflightReport {
  readonly status: PreflightStatus
  readonly missing_context: MissingContextItem[]
  readonly risk_explanation: string
  readonly suggested_questions: ChecklistItem[]
  readonly draft_acceptance_criteria: ChecklistItem[]
  readonly confidence: Confidence
  readonly evidence: EvidenceItem[]
}

export type PreflightReportValidationReason =
  | "not_plain_object"
  | "unexpected_key"
  | "missing_key"
  | "invalid_type"
  | "empty_string"
  | "invalid_content"
  | "invalid_enum"

const PREFLIGHT_REPORT_KEYS = new Set([
  "status",
  "missing_context",
  "risk_explanation",
  "suggested_questions",
  "draft_acceptance_criteria",
  "confidence",
  "evidence"
])

const MISSING_CONTEXT_ITEM_KEYS = new Set(["category", "detail"])

const CHECKLIST_ITEM_KEYS = new Set(["text"])

const EVIDENCE_ITEM_KEYS = new Set(["source", "detail"])

const PREFLIGHT_STATUSES = new Set<PreflightStatus>([
  "ready",
  "needs_clarification",
  "high_risk"
])

const CONFIDENCE_VALUES = new Set<Confidence>(["low", "medium", "high"])

const EVIDENCE_SOURCES = new Set<EvidenceItem["source"]>([
  "title",
  "body",
  "precheck"
])

export class PreflightReportValidationError extends Error {
  readonly reason: PreflightReportValidationReason
  readonly path: string

  constructor(
    reason: PreflightReportValidationReason = "invalid_type",
    path = "report",
    message = "Invalid preflight report"
  ) {
    super(message)
    this.name = "PreflightReportValidationError"
    this.reason = reason
    this.path = path
  }
}

export function validatePreflightReport(raw: unknown): PreflightReport {
  const report = requirePlainObject(raw, "report")
  rejectUnexpectedKeys(report, PREFLIGHT_REPORT_KEYS, "report")

  const riskExplanation = requireString(
    report.risk_explanation,
    "report.risk_explanation"
  ).trim()

  if (riskExplanation.length === 0) {
    throwInvalidReport("empty_string", "report.risk_explanation")
  }

  if (!hasMeaningfulContent(riskExplanation)) {
    throwInvalidReport("invalid_content", "report.risk_explanation")
  }

  return {
    status: requireEnum(report.status, PREFLIGHT_STATUSES, "report.status"),
    missing_context: normalizeMissingContextItems(
      report.missing_context,
      "report.missing_context"
    ),
    risk_explanation: riskExplanation,
    suggested_questions: normalizeChecklistItems(
      report.suggested_questions,
      "report.suggested_questions"
    ),
    draft_acceptance_criteria: normalizeChecklistItems(
      report.draft_acceptance_criteria,
      "report.draft_acceptance_criteria"
    ),
    confidence: requireEnum(
      report.confidence,
      CONFIDENCE_VALUES,
      "report.confidence"
    ),
    evidence: normalizeEvidenceItems(report.evidence, "report.evidence")
  }
}

export function applyConservativeStatusPolicy(
  report: PreflightReport
): PreflightReport {
  const status = determineConservativeStatus(report)

  if (status === report.status) {
    return report
  }

  return { ...report, status }
}

function determineConservativeStatus(report: PreflightReport): PreflightStatus {
  if (report.missing_context.length === 0) {
    return "ready"
  }

  if (report.confidence === "low" || report.status === "high_risk") {
    return "high_risk"
  }

  return "needs_clarification"
}

function normalizeMissingContextItems(
  raw: unknown,
  path: string
): MissingContextItem[] {
  return requireArray(raw, path).map((item, index) => {
    const itemPath = `${path}[${index}]`
    const object = requirePlainObject(item, itemPath)
    rejectUnexpectedKeys(object, MISSING_CONTEXT_ITEM_KEYS, itemPath)
    const category = requireNonEmptyTrimmedString(
      object.category,
      `${itemPath}.category`
    )
    const detail = requireNonEmptyTrimmedString(
      object.detail,
      `${itemPath}.detail`
    )

    return { category, detail }
  })
}

function normalizeChecklistItems(raw: unknown, path: string): ChecklistItem[] {
  return requireArray(raw, path).map((item, index) => {
    const itemPath = `${path}[${index}]`
    const object = requirePlainObject(item, itemPath)
    rejectUnexpectedKeys(object, CHECKLIST_ITEM_KEYS, itemPath)
    const text = requireNonEmptyTrimmedString(object.text, `${itemPath}.text`)

    return { text }
  })
}

function normalizeEvidenceItems(raw: unknown, path: string): EvidenceItem[] {
  return requireArray(raw, path).map((item, index) => {
    const itemPath = `${path}[${index}]`
    const object = requirePlainObject(item, itemPath)
    rejectUnexpectedKeys(object, EVIDENCE_ITEM_KEYS, itemPath)
    const source = requireEnum(
      object.source,
      EVIDENCE_SOURCES,
      `${itemPath}.source`
    )
    const detail = requireNonEmptyTrimmedString(
      object.detail,
      `${itemPath}.detail`
    )

    return { source, detail }
  })
}

function rejectUnexpectedKeys(
  report: Record<string, unknown>,
  allowedKeys: Set<string>,
  path: string
): void {
  for (const key of Object.keys(report)) {
    if (!allowedKeys.has(key)) {
      throwInvalidReport("unexpected_key", `${path}.*`)
    }
  }

  for (const key of allowedKeys) {
    if (!Object.prototype.hasOwnProperty.call(report, key)) {
      throwInvalidReport("missing_key", `${path}.${key}`)
    }
  }
}

function requirePlainObject(
  raw: unknown,
  path: string
): Record<string, unknown> {
  if (
    typeof raw !== "object" ||
    raw === null ||
    Array.isArray(raw) ||
    Object.getPrototypeOf(raw) !== Object.prototype
  ) {
    throwInvalidReport("not_plain_object", path)
  }

  return raw as Record<string, unknown>
}

function requireArray(raw: unknown, path: string): unknown[] {
  if (!Array.isArray(raw)) {
    throwInvalidReport("invalid_type", path)
  }

  return raw
}

function requireString(raw: unknown, path: string): string {
  if (typeof raw !== "string") {
    throwInvalidReport("invalid_type", path)
  }

  return raw
}

function requireNonEmptyTrimmedString(raw: unknown, path: string): string {
  const value = requireString(raw, path).trim()

  if (value.length === 0) {
    throwInvalidReport("empty_string", path)
  }

  if (!hasMeaningfulContent(value)) {
    throwInvalidReport("invalid_content", path)
  }

  return value
}

function requireEnum<T extends string>(
  raw: unknown,
  values: Set<T>,
  path: string
): T {
  if (typeof raw !== "string" || !values.has(raw as T)) {
    throwInvalidReport("invalid_enum", path)
  }

  return raw as T
}

function throwInvalidReport(
  reason: PreflightReportValidationReason,
  path: string
): never {
  throw new PreflightReportValidationError(reason, path)
}

function hasMeaningfulContent(value: string): boolean {
  return /[\p{L}\p{N}]/u.test(value)
}
