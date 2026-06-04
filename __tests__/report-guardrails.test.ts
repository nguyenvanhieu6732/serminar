import {
  enforceReportGuardrails,
  ReportGuardrailError
} from "../src/report-guardrails.js"
import type { PreflightReport } from "../src/report-schema.js"

const safeReport: PreflightReport = {
  status: "needs_clarification",
  missing_context: [
    {
      category: "acceptance_criteria",
      detail: "The work artifact does not include testable pass/fail criteria."
    }
  ],
  risk_explanation:
    "Implementation risk comes from missing acceptance criteria in the work artifact.",
  suggested_questions: [
    { text: "Which label triggers the workflow?" },
    { text: "Which file should change?" }
  ],
  draft_acceptance_criteria: [],
  confidence: "medium",
  evidence: [
    {
      source: "body",
      detail: "The body describes the goal but not acceptance criteria."
    }
  ]
}

describe("enforceReportGuardrails", () => {
  it("returns safe artifact-focused reports unchanged", () => {
    expect(enforceReportGuardrails(safeReport)).toBe(safeReport)
  })

  it.each([
    [
      "missing context detail",
      {
        missing_context: [
          {
            category: "acceptance_criteria",
            detail: "The author failed to provide acceptance criteria."
          }
        ]
      }
    ],
    [
      "risk explanation",
      {
        risk_explanation: "The issue owner deserves a readiness score of 2/10."
      }
    ],
    [
      "suggested question",
      {
        suggested_questions: [
          { text: "Why did Alice cause this ticket to be unclear?" }
        ]
      }
    ],
    [
      "draft acceptance criteria",
      {
        draft_acceptance_criteria: [
          { text: "Remove the ready-for-dev label before development starts." }
        ]
      }
    ]
  ])("rejects unsafe language in %s", (_name, override) => {
    expect(() =>
      enforceReportGuardrails({ ...safeReport, ...override })
    ).toThrow(ReportGuardrailError)
  })

  it.each([
    "Assign the issue to the platform team.",
    "Edit the issue body with the missing details.",
    "Close the issue until requirements are complete.",
    "Write a repository file containing the final specification.",
    "Create a required check that blocks merging.",
    "Block development until the issue is clarified."
  ])("rejects mutation or workflow-gate suggestion: %s", (text) => {
    expect(() =>
      enforceReportGuardrails({
        ...safeReport,
        suggested_questions: [{ text }]
      })
    ).toThrow(ReportGuardrailError)
  })

  it.each([
    "Which label triggers the workflow?",
    "Which file should change?",
    "What permissions are required for the expected behavior?",
    "Should the issue describe what happens when the check fails?"
  ])("allows benign readiness context: %s", (text) => {
    expect(
      enforceReportGuardrails({
        ...safeReport,
        suggested_questions: [{ text }]
      })
    ).toEqual({
      ...safeReport,
      suggested_questions: [{ text }]
    })
  })

  it("uses a generic error without echoing rejected model content", () => {
    const unsafeText = "The author failed to provide private requirements."

    try {
      enforceReportGuardrails({
        ...safeReport,
        risk_explanation: unsafeText
      })
    } catch (error) {
      expect(error).toBeInstanceOf(ReportGuardrailError)
      expect(String(error)).toBe(
        "ReportGuardrailError: Unsafe preflight report"
      )
      expect(String(error)).not.toContain(unsafeText)
    }
  })
})
