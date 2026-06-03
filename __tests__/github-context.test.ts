import issueLabeledPayload from "./fixtures/issue-labeled.json"
import issueOtherLabelPayload from "./fixtures/issue-other-label.json"
import pullRequestLabeledPayload from "./fixtures/pull-request-labeled.json"
import { parseIssueLabeledEvent } from "../src/github-context.js"

describe("parseIssueLabeledEvent", () => {
  it("extracts ready issue context from a matching issues.labeled payload", () => {
    const result = parseIssueLabeledEvent({
      eventName: "issues",
      payload: issueLabeledPayload,
      readyLabel: "ready-for-dev"
    })

    expect(result).toEqual({
      kind: "ready",
      issue: {
        issueNumber: 42,
        issueTitle: "Add password reset flow",
        issueBody:
          "Implement reset request, email delivery, and token expiry behavior.",
        labelName: "ready-for-dev",
        owner: "demo-owner",
        repo: "demo-repo"
      }
    })
  })

  it("skips non-ready labels without treating the run as an error", () => {
    const result = parseIssueLabeledEvent({
      eventName: "issues",
      payload: issueOtherLabelPayload,
      readyLabel: "ready-for-dev"
    })

    expect(result).toEqual({
      kind: "skipped",
      reason: "label_mismatch",
      issueNumber: 43,
      labelName: "triage"
    })
  })

  it("honors a custom ready label", () => {
    const result = parseIssueLabeledEvent({
      eventName: "issues",
      payload: issueOtherLabelPayload,
      readyLabel: "triage"
    })

    expect(result.kind).toBe("ready")
  })

  it("skips pull request payloads explicitly", () => {
    const result = parseIssueLabeledEvent({
      eventName: "issues",
      payload: pullRequestLabeledPayload,
      readyLabel: "ready-for-dev"
    })

    expect(result).toEqual({
      kind: "skipped",
      reason: "pull_request",
      issueNumber: 44,
      labelName: "ready-for-dev"
    })
  })

  it("skips unsupported event names", () => {
    const result = parseIssueLabeledEvent({
      eventName: "pull_request",
      payload: issueLabeledPayload,
      readyLabel: "ready-for-dev"
    })

    expect(result).toEqual({
      kind: "skipped",
      reason: "unsupported_event"
    })
  })

  it("skips unsupported payload shapes", () => {
    const result = parseIssueLabeledEvent({
      eventName: "issues",
      payload: { action: "labeled", issue: { number: 1 } },
      readyLabel: "ready-for-dev"
    })

    expect(result).toEqual({
      kind: "skipped",
      reason: "unsupported_payload"
    })
  })
})
