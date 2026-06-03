export interface ReadyIssueContext {
  readonly issueNumber: number
  readonly issueTitle: string
  readonly issueBody: string
  readonly labelName: string
  readonly owner: string
  readonly repo: string
}

export type IssueEventParseResult =
  | {
      readonly kind: "ready"
      readonly issue: ReadyIssueContext
    }
  | {
      readonly kind: "skipped"
      readonly reason:
        | "label_mismatch"
        | "unsupported_event"
        | "unsupported_payload"
      readonly labelName?: string
      readonly issueNumber?: number
    }

export interface ParseIssueLabeledEventInput {
  readonly eventName: string
  readonly payload: unknown
  readonly readyLabel: string
}

interface IssueLabeledPayload {
  readonly action: "labeled"
  readonly issue: {
    readonly number: number
    readonly title: string
    readonly body: string | null
  }
  readonly label: {
    readonly name: string
  }
  readonly repository: {
    readonly name: string
    readonly owner: {
      readonly login: string
    }
  }
}

export function parseIssueLabeledEvent({
  eventName,
  payload,
  readyLabel
}: ParseIssueLabeledEventInput): IssueEventParseResult {
  if (eventName !== "issues") {
    return { kind: "skipped", reason: "unsupported_event" }
  }

  if (!isIssueLabeledPayload(payload)) {
    return { kind: "skipped", reason: "unsupported_payload" }
  }

  const labelName = payload.label.name
  const issueNumber = payload.issue.number

  if (labelName !== readyLabel) {
    return {
      kind: "skipped",
      reason: "label_mismatch",
      issueNumber,
      labelName
    }
  }

  return {
    kind: "ready",
    issue: {
      issueNumber,
      issueTitle: payload.issue.title,
      issueBody: payload.issue.body ?? "",
      labelName,
      owner: payload.repository.owner.login,
      repo: payload.repository.name
    }
  }
}

function isIssueLabeledPayload(
  payload: unknown
): payload is IssueLabeledPayload {
  if (!isRecord(payload)) {
    return false
  }

  if (payload.action !== "labeled") {
    return false
  }

  if (
    !isRecord(payload.issue) ||
    typeof payload.issue.number !== "number" ||
    typeof payload.issue.title !== "string" ||
    !isNullableString(payload.issue.body)
  ) {
    return false
  }

  if (!isRecord(payload.label) || typeof payload.label.name !== "string") {
    return false
  }

  if (
    !isRecord(payload.repository) ||
    typeof payload.repository.name !== "string" ||
    !isRecord(payload.repository.owner) ||
    typeof payload.repository.owner.login !== "string"
  ) {
    return false
  }

  return true
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === "string" || value === null
}
