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
  constructor(message = "Invalid preflight report") {
    super(message)
    this.name = "PreflightReportValidationError"
  }
}

export function validatePreflightReport(raw: unknown): PreflightReport {
  const report = requirePlainObject(raw)
  rejectUnexpectedKeys(report)

  const riskExplanation = requireString(report.risk_explanation).trim()

  if (riskExplanation.length === 0) {
    throwInvalidReport()
  }

  return {
    status: requireEnum(report.status, PREFLIGHT_STATUSES),
    missing_context: normalizeMissingContextItems(report.missing_context),
    risk_explanation: riskExplanation,
    suggested_questions: normalizeChecklistItems(report.suggested_questions),
    draft_acceptance_criteria: normalizeChecklistItems(
      report.draft_acceptance_criteria
    ),
    confidence: requireEnum(report.confidence, CONFIDENCE_VALUES),
    evidence: normalizeEvidenceItems(report.evidence)
  }
}

function normalizeMissingContextItems(raw: unknown): MissingContextItem[] {
  return requireArray(raw).map((item) => {
    const object = requirePlainObject(item)
    rejectUnexpectedKeys(object, MISSING_CONTEXT_ITEM_KEYS)
    const category = requireNonEmptyTrimmedString(object.category)
    const detail = requireNonEmptyTrimmedString(object.detail)

    return { category, detail }
  })
}

function normalizeChecklistItems(raw: unknown): ChecklistItem[] {
  return requireArray(raw).map((item) => {
    const object = requirePlainObject(item)
    rejectUnexpectedKeys(object, CHECKLIST_ITEM_KEYS)
    const text = requireNonEmptyTrimmedString(object.text)

    return { text }
  })
}

function normalizeEvidenceItems(raw: unknown): EvidenceItem[] {
  return requireArray(raw).map((item) => {
    const object = requirePlainObject(item)
    rejectUnexpectedKeys(object, EVIDENCE_ITEM_KEYS)
    const source = requireEnum(object.source, EVIDENCE_SOURCES)
    const detail = requireNonEmptyTrimmedString(object.detail)

    return { source, detail }
  })
}

function rejectUnexpectedKeys(
  report: Record<string, unknown>,
  allowedKeys = PREFLIGHT_REPORT_KEYS
): void {
  for (const key of Object.keys(report)) {
    if (!allowedKeys.has(key)) {
      throwInvalidReport()
    }
  }

  for (const key of allowedKeys) {
    if (!Object.prototype.hasOwnProperty.call(report, key)) {
      throwInvalidReport()
    }
  }
}

function requirePlainObject(raw: unknown): Record<string, unknown> {
  if (
    typeof raw !== "object" ||
    raw === null ||
    Array.isArray(raw) ||
    Object.getPrototypeOf(raw) !== Object.prototype
  ) {
    throwInvalidReport()
  }

  return raw as Record<string, unknown>
}

function requireArray(raw: unknown): unknown[] {
  if (!Array.isArray(raw)) {
    throwInvalidReport()
  }

  return raw
}

function requireString(raw: unknown): string {
  if (typeof raw !== "string") {
    throwInvalidReport()
  }

  return raw
}

function requireNonEmptyTrimmedString(raw: unknown): string {
  const value = requireString(raw).trim()

  if (value.length === 0) {
    throwInvalidReport()
  }

  return value
}

function requireEnum<T extends string>(raw: unknown, values: Set<T>): T {
  if (typeof raw !== "string" || !values.has(raw as T)) {
    throwInvalidReport()
  }

  return raw as T
}

function throwInvalidReport(): never {
  throw new PreflightReportValidationError()
}
