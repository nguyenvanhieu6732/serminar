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
