import {
  applyConservativeStatusPolicy,
  PreflightReportValidationError,
  validatePreflightReport
} from "../src/report-schema.js"

const validReport = {
  status: "needs_clarification",
  missing_context: [
    {
      category: " acceptance_criteria ",
      detail: " Missing testable pass/fail criteria. "
    }
  ],
  risk_explanation:
    " The work artifact lacks enough detail for a reliable implementation. ",
  suggested_questions: [
    { text: " What observable behavior proves completion? " }
  ],
  draft_acceptance_criteria: [
    {
      text: " Suggested: Given the work is complete, then the expected behavior is visible. "
    }
  ],
  confidence: "medium",
  evidence: [
    {
      source: "body",
      detail: " The body states a goal but no acceptance criteria. "
    }
  ]
}

describe("validatePreflightReport", () => {
  it("normalizes a valid provider-shaped report into the PreflightReport contract", () => {
    expect(validatePreflightReport(validReport)).toEqual({
      status: "needs_clarification",
      missing_context: [
        {
          category: "acceptance_criteria",
          detail: "Missing testable pass/fail criteria."
        }
      ],
      risk_explanation:
        "The work artifact lacks enough detail for a reliable implementation.",
      suggested_questions: [
        { text: "What observable behavior proves completion?" }
      ],
      draft_acceptance_criteria: [
        {
          text: "Suggested: Given the work is complete, then the expected behavior is visible."
        }
      ],
      confidence: "medium",
      evidence: [
        {
          source: "body",
          detail: "The body states a goal but no acceptance criteria."
        }
      ]
    })
  })

  it.each([
    ["invalid status enum", { status: "blocked" }],
    ["missing confidence", { confidence: undefined }],
    [
      "invalid evidence source",
      { evidence: [{ source: "comment", detail: "x" }] }
    ],
    ["non-array missing_context", { missing_context: "missing" }],
    [
      "non-string nested detail",
      { missing_context: [{ category: "x", detail: 1 }] }
    ],
    [
      "blank missing context category",
      { missing_context: [{ category: " ", detail: "x" }] }
    ],
    [
      "blank missing context detail",
      { missing_context: [{ category: "x", detail: " " }] }
    ],
    ["non-string suggested question", { suggested_questions: [{ text: 1 }] }],
    ["blank suggested question", { suggested_questions: [{ text: " " }] }],
    [
      "blank draft acceptance criterion",
      { draft_acceptance_criteria: [{ text: " " }] }
    ],
    ["blank evidence detail", { evidence: [{ source: "body", detail: " " }] }],
    ["empty risk_explanation", { risk_explanation: "   " }]
  ])("rejects %s", (_caseName, override) => {
    const raw = { ...validReport, ...override }

    expect(() => validatePreflightReport(raw)).toThrow(
      PreflightReportValidationError
    )
  })

  it.each([
    "labels",
    "assignees",
    "checks",
    "files",
    "pull_requests",
    "issue_comments",
    "issue_state",
    "markdown",
    "comment_body"
  ])("rejects unexpected top-level mutation/rendering field %s", (field) => {
    expect(() =>
      validatePreflightReport({
        ...validReport,
        [field]: ["unsafe private value"]
      })
    ).toThrow(PreflightReportValidationError)
  })

  it.each([
    [
      "missing_context",
      { missing_context: [{ category: "x", detail: "y", labels: ["unsafe"] }] }
    ],
    [
      "suggested_questions",
      { suggested_questions: [{ text: "x", body: "y" }] }
    ],
    [
      "draft_acceptance_criteria",
      { draft_acceptance_criteria: [{ text: "x", issue_state: "closed" }] }
    ],
    ["evidence", { evidence: [{ source: "body", detail: "x", markdown: "y" }] }]
  ])("rejects unexpected nested item fields in %s", (_field, override) => {
    expect(() =>
      validatePreflightReport({
        ...validReport,
        ...override
      })
    ).toThrow(PreflightReportValidationError)
  })

  it("uses generic validation errors without echoing private model values", () => {
    const privateValue = "secret issue payload content"

    expect(() =>
      validatePreflightReport({
        ...validReport,
        risk_explanation: privateValue,
        labels: [privateValue]
      })
    ).toThrow("Invalid preflight report")

    try {
      validatePreflightReport({
        ...validReport,
        risk_explanation: privateValue,
        labels: [privateValue]
      })
    } catch (error) {
      expect(error).toBeInstanceOf(PreflightReportValidationError)
      expect(String(error)).not.toContain(privateValue)
    }
  })
})

describe("applyConservativeStatusPolicy", () => {
  it.each([
    [
      "ready with missing context downgrades to needs_clarification",
      {
        status: "ready",
        missing_context: [
          {
            category: "acceptance_criteria",
            detail: "Missing testable pass/fail criteria."
          }
        ],
        confidence: "medium"
      },
      "needs_clarification"
    ],
    [
      "ready with low confidence and missing context escalates to high_risk",
      {
        status: "ready",
        missing_context: [
          {
            category: "expected_behavior",
            detail: "The expected behavior is unclear."
          }
        ],
        confidence: "low"
      },
      "high_risk"
    ],
    [
      "high risk with missing context stays high_risk",
      {
        status: "high_risk",
        missing_context: [
          {
            category: "scope",
            detail: "The implementation scope is too vague."
          }
        ],
        confidence: "medium"
      },
      "high_risk"
    ],
    [
      "needs clarification with missing context stays needs_clarification",
      {
        status: "needs_clarification",
        missing_context: [
          {
            category: "edge_cases",
            detail: "Important edge cases are not specified."
          }
        ],
        confidence: "high"
      },
      "needs_clarification"
    ],
    [
      "missing context always prevents ready even with high confidence",
      {
        status: "ready",
        missing_context: [
          {
            category: "permissions",
            detail: "Permission behavior is not described."
          }
        ],
        confidence: "high"
      },
      "needs_clarification"
    ],
    [
      "no missing context normalizes to ready",
      {
        status: "high_risk",
        missing_context: [],
        confidence: "low"
      },
      "ready"
    ]
  ])("%s", (_caseName, override, expectedStatus) => {
    const report = validatePreflightReport({
      ...validReport,
      ...override
    })

    expect(applyConservativeStatusPolicy(report).status).toBe(expectedStatus)
  })

  it("does not introduce blame or people-scoring language", () => {
    const report = applyConservativeStatusPolicy(
      validatePreflightReport({
        ...validReport,
        status: "ready"
      })
    )

    const serialized = JSON.stringify(report).toLowerCase()
    expect(serialized).not.toContain("owner failed")
    expect(serialized).not.toContain("author")
    expect(serialized).not.toContain("score")
    expect(serialized).not.toContain("rating")
    expect(serialized).not.toContain("blame")
  })
})
