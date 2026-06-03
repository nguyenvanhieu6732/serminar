import type { ReadyIssueContext } from "../src/github-context.js"
import { MIN_USEFUL_BODY_LENGTH, runPrechecks } from "../src/prechecks.js"

function issueWithBody(issueBody: string): ReadyIssueContext {
  return {
    issueNumber: 123,
    issueTitle: "Synthetic issue",
    issueBody,
    labelName: "ready-for-dev",
    owner: "demo-owner",
    repo: "demo-repo"
  }
}

describe("runPrechecks", () => {
  it("returns a deterministic high-risk report for an empty body", () => {
    const result = runPrechecks(issueWithBody(""))

    expect(result.kind).toBe("report")
    if (result.kind !== "report") {
      throw new Error("Expected deterministic report")
    }

    expect(result.reason).toBe("empty_body")
    expect(result.report.status).toBe("high_risk")
    expect(result.report.confidence).toBe("high")
    expect(result.report.draft_acceptance_criteria).toEqual([])
    expect(result.report.missing_context.map((item) => item.category)).toEqual(
      expect.arrayContaining([
        "expected_behavior",
        "acceptance_criteria",
        "edge_and_failure_behavior"
      ])
    )
    expect(result.report.suggested_questions.length).toBeGreaterThanOrEqual(4)
  })

  it("treats whitespace-only bodies as empty", () => {
    const result = runPrechecks(issueWithBody(" \n\t "))

    expect(result.kind).toBe("report")
    if (result.kind !== "report") {
      throw new Error("Expected deterministic report")
    }

    expect(result.reason).toBe("empty_body")
    expect(result.report.status).toBe("high_risk")
  })

  it("returns a deterministic report for a short body without pretending to understand the work", () => {
    const shortBody = "Fix checkout."
    const result = runPrechecks(issueWithBody(shortBody))

    expect(shortBody.length).toBeLessThan(MIN_USEFUL_BODY_LENGTH)
    expect(result.kind).toBe("report")
    if (result.kind !== "report") {
      throw new Error("Expected deterministic report")
    }

    expect(result.reason).toBe("short_body")
    expect(result.report.status).toBe("high_risk")
    expect(result.report.draft_acceptance_criteria).toEqual([])
    expect(result.report.risk_explanation).toContain(
      "does not provide enough implementation detail"
    )
    expect(JSON.stringify(result.report)).not.toContain(shortBody)
  })

  it("returns a short-body report at one character below the useful body threshold", () => {
    const body = "a".repeat(MIN_USEFUL_BODY_LENGTH - 1)
    const result = runPrechecks(issueWithBody(body))

    expect(result.kind).toBe("report")
    if (result.kind !== "report") {
      throw new Error("Expected deterministic report")
    }

    expect(result.reason).toBe("short_body")
    expect(result.report.status).toBe("high_risk")
  })

  it("continues at the exact useful body threshold", () => {
    const body = "a".repeat(MIN_USEFUL_BODY_LENGTH)

    expect(runPrechecks(issueWithBody(body))).toEqual({ kind: "continue" })
  })

  it("allows later LLM analysis when the body has enough context", () => {
    const result = runPrechecks(
      issueWithBody(
        "Implement reset request, email delivery, and token expiry behavior."
      )
    )

    expect(result).toEqual({ kind: "continue" })
  })

  it("keeps deterministic reports free of prompt, secret, and blame language", () => {
    const result = runPrechecks(issueWithBody(""))

    expect(result.kind).toBe("report")
    if (result.kind !== "report") {
      throw new Error("Expected deterministic report")
    }

    const serialized = JSON.stringify(result.report).toLowerCase()
    expect(serialized).not.toContain("prompt")
    expect(serialized).not.toContain("openai")
    expect(serialized).not.toContain("api key")
    expect(serialized).not.toContain("owner failed")
    expect(serialized).not.toContain("author")
    expect(serialized).not.toContain("blame")
  })
})
