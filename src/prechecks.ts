import type { ReadyIssueContext } from "./github-context.js"
import type { PreflightReport } from "./report-schema.js"

export const MIN_USEFUL_BODY_LENGTH = 40

export type PrecheckReason = "empty_body" | "short_body"

export type PrecheckResult =
  | {
      readonly kind: "report"
      readonly reason: PrecheckReason
      readonly report: PreflightReport
    }
  | {
      readonly kind: "continue"
    }

export function runPrechecks(issue: ReadyIssueContext): PrecheckResult {
  const body = issue.issueBody.trim()

  if (body.length === 0) {
    return {
      kind: "report",
      reason: "empty_body",
      report: createInsufficientContextReport("empty_body")
    }
  }

  if (body.length < MIN_USEFUL_BODY_LENGTH) {
    return {
      kind: "report",
      reason: "short_body",
      report: createInsufficientContextReport("short_body")
    }
  }

  return { kind: "continue" }
}

function createInsufficientContextReport(
  reason: PrecheckReason
): PreflightReport {
  return {
    status: "high_risk",
    missing_context: [
      {
        category: "actor_or_role",
        detail:
          "The issue should identify who needs the change or who is affected."
      },
      {
        category: "expected_behavior",
        detail: "The issue should describe the behavior to implement or fix."
      },
      {
        category: "acceptance_criteria",
        detail: "The issue should include testable pass/fail criteria."
      },
      {
        category: "edge_and_failure_behavior",
        detail:
          "The issue should describe important edge cases or failure behavior."
      }
    ],
    risk_explanation:
      reason === "empty_body"
        ? "The issue body is empty, so there is not enough implementation detail to safely analyze the work."
        : "The issue body does not provide enough implementation detail to safely analyze the work.",
    suggested_questions: [
      { text: "Who is the user or actor affected by this work?" },
      { text: "What behavior should change, and what should stay the same?" },
      { text: "What are the testable acceptance criteria for completion?" },
      {
        text: "What edge cases, errors, or permission concerns should be handled?"
      }
    ],
    draft_acceptance_criteria: [],
    confidence: "high",
    evidence: [
      {
        source: "precheck",
        detail:
          reason === "empty_body"
            ? "Issue body was empty."
            : "Issue body was below minimum useful length."
      }
    ]
  }
}
