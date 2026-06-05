import * as core from "@actions/core"
import { context } from "@actions/github"
import { run } from "../src/action.js"
import { DEFAULT_READY_LABEL } from "../src/config.js"
import { MAX_ISSUE_BODY_CHARS } from "../src/llm-client.js"
import { renderReport } from "../src/report-renderer.js"
import type { PreflightReport } from "../src/report-schema.js"
import emptyIssuePayload from "./fixtures/empty-issue.json"
import issueLabeledPayload from "./fixtures/issue-labeled.json"
import issueOtherLabelPayload from "./fixtures/issue-other-label.json"
import longIssuePayload from "./fixtures/long-issue.json"
import promptInjectionPayload from "./fixtures/prompt-injection-issue.json"
import pullRequestLabeledPayload from "./fixtures/pull-request-labeled.json"
import shortIssuePayload from "./fixtures/short-issue.json"
import {
  mockCreateComment,
  mockDeleteComment,
  mockForbiddenGitHubMutations,
  mockUpdateComment
} from "./mocks/actions-github.js"

jest.mock("@actions/core")

const mockResponsesCreate = jest.fn()

jest.mock("openai", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    responses: {
      create: mockResponsesCreate
    }
  }))
}))

const mockedCore = jest.mocked(core)
const githubContext = context as typeof context & {
  eventName: string
  payload: unknown
}

const structuredReport: PreflightReport = {
  status: "needs_clarification",
  missing_context: [
    {
      category: "acceptance_criteria",
      detail: "The issue needs testable acceptance criteria."
    }
  ],
  risk_explanation:
    "The work artifact lacks pass/fail criteria, increasing implementation risk.",
  suggested_questions: [
    { text: "What behavior should prove this work is complete?" }
  ],
  draft_acceptance_criteria: [],
  confidence: "medium",
  evidence: [
    {
      source: "body",
      detail: "The body describes work but omits acceptance criteria."
    }
  ]
}

function mockInputs(inputs: Record<string, string>): void {
  mockedCore.getInput.mockImplementation((name: string) => inputs[name] ?? "")
}

describe("run", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockResponsesCreate.mockResolvedValue({
      output_text: JSON.stringify(structuredReport)
    })
    mockCreateComment.mockResolvedValue({ data: { id: 123 } })
    githubContext.eventName = "issues"
    githubContext.payload = issueLabeledPayload
  })

  it("loads configuration and logs eligible issue metadata safely", async () => {
    const githubToken = "gh-secret-token"
    const openaiApiKey = "openai-secret-key"
    mockInputs({
      "github-token": githubToken,
      "openai-api-key": openaiApiKey
    })

    await run()

    expect(mockedCore.setSecret).toHaveBeenCalledWith(githubToken)
    expect(mockedCore.setSecret).toHaveBeenCalledWith(openaiApiKey)
    expect(mockedCore.info).toHaveBeenCalledWith(
      `Configuration loaded: required credentials present, ready-label "${DEFAULT_READY_LABEL}".`
    )
    expect(mockedCore.info).toHaveBeenCalledWith(
      'Issue #42 received ready label "ready-for-dev"; preflight eligibility confirmed.'
    )
    expect(mockedCore.info).toHaveBeenCalledWith(
      "Deterministic prechecks completed for issue #42: enough_context. Preparing bounded LLM input."
    )
    expect(mockedCore.info).toHaveBeenCalledWith(
      "Bounded LLM input prepared for issue #42: body_truncated=false, included_body_chars=67."
    )
    expect(mockedCore.info).toHaveBeenCalledWith(
      "LLM structured analysis requested for issue #42."
    )
    expect(mockedCore.info).toHaveBeenCalledWith(
      "LLM structured analysis validated for issue #42: needs_clarification."
    )
    expect(mockCreateComment).toHaveBeenCalledWith({
      owner: "demo-owner",
      repo: "demo-repo",
      issue_number: 42,
      body: renderReport(structuredReport)
    })
    expect(mockedCore.info).toHaveBeenCalledWith(
      "Preflight comment created for issue #42: comment_id=123."
    )
    expect(mockResponsesCreate).toHaveBeenCalledTimes(1)
    expect(mockedCore.info).not.toHaveBeenCalledWith(
      expect.stringContaining(githubToken)
    )
    expect(mockedCore.info).not.toHaveBeenCalledWith(
      expect.stringContaining(openaiApiKey)
    )
    expect(mockedCore.info).not.toHaveBeenCalledWith(
      expect.stringContaining("github-token")
    )
    expect(mockedCore.info).not.toHaveBeenCalledWith(
      expect.stringContaining("openai-api-key")
    )
    expect(mockedCore.info).not.toHaveBeenCalledWith(
      expect.stringContaining(issueLabeledPayload.issue.body)
    )
    expect(mockedCore.setFailed).not.toHaveBeenCalled()
  })

  it("skips label mismatches without failing", async () => {
    githubContext.payload = issueOtherLabelPayload
    mockInputs({
      "github-token": "gh-secret-token",
      "openai-api-key": "openai-secret-key"
    })

    await run()

    expect(mockedCore.info).toHaveBeenCalledWith(
      'Skipping issue #43: label "triage" does not match ready label "ready-for-dev".'
    )
    expect(mockCreateComment).not.toHaveBeenCalled()
    expect(mockedCore.setFailed).not.toHaveBeenCalled()
  })

  it("uses the configured ready label for eligibility", async () => {
    githubContext.payload = issueOtherLabelPayload
    mockInputs({
      "github-token": "gh-secret-token",
      "openai-api-key": "openai-secret-key",
      "ready-label": "triage"
    })

    await run()

    expect(mockedCore.info).toHaveBeenCalledWith(
      'Issue #43 received ready label "triage"; preflight eligibility confirmed.'
    )
    expect(mockedCore.info).toHaveBeenCalledWith(
      "Bounded LLM input prepared for issue #43: body_truncated=false, included_body_chars=66."
    )
    expect(mockResponsesCreate).toHaveBeenCalledTimes(1)
    expect(mockedCore.info).toHaveBeenCalledWith(
      "LLM structured analysis validated for issue #43: needs_clarification."
    )
    expect(mockedCore.setFailed).not.toHaveBeenCalled()
  })

  it("logs the conservative status when validated LLM output is ready but still has missing context", async () => {
    mockResponsesCreate.mockResolvedValue({
      output_text: JSON.stringify({
        ...structuredReport,
        status: "ready"
      })
    })
    mockInputs({
      "github-token": "gh-secret-token",
      "openai-api-key": "openai-secret-key"
    })

    await run()

    expect(mockedCore.info).toHaveBeenCalledWith(
      "LLM structured analysis validated for issue #42: needs_clarification."
    )
    expect(mockedCore.info).not.toHaveBeenCalledWith(
      "LLM structured analysis validated for issue #42: ready."
    )
    expect(mockCreateComment).toHaveBeenCalledWith(
      expect.objectContaining({
        body: renderReport(structuredReport)
      })
    )
    expect(mockedCore.setFailed).not.toHaveBeenCalled()
  })

  it("logs ready when validated LLM output has no missing context", async () => {
    mockResponsesCreate.mockResolvedValue({
      output_text: JSON.stringify({
        ...structuredReport,
        status: "needs_clarification",
        missing_context: []
      })
    })
    mockInputs({
      "github-token": "gh-secret-token",
      "openai-api-key": "openai-secret-key"
    })

    await run()

    expect(mockedCore.info).toHaveBeenCalledWith(
      "LLM structured analysis validated for issue #42: ready."
    )
    expect(mockCreateComment).toHaveBeenCalledWith(
      expect.objectContaining({
        body: renderReport({
          ...structuredReport,
          status: "ready",
          missing_context: []
        })
      })
    )
    expect(mockedCore.setFailed).not.toHaveBeenCalled()
  })

  it("logs long-body truncation metadata without logging title, body, or truncated content", async () => {
    const githubToken = "gh-secret-token"
    const openaiApiKey = "openai-secret-key"
    const truncatedTail = "sensitive-tail-after-bound"
    const longBody = `${"a".repeat(MAX_ISSUE_BODY_CHARS)}${truncatedTail}`
    githubContext.payload = {
      ...longIssuePayload,
      issue: {
        ...longIssuePayload.issue,
        body: longBody
      }
    }
    mockInputs({
      "github-token": githubToken,
      "openai-api-key": openaiApiKey
    })

    await run()

    expect(mockedCore.info).toHaveBeenCalledWith(
      "Bounded LLM input prepared for issue #47: body_truncated=true, included_body_chars=6000."
    )
    expect(mockResponsesCreate).toHaveBeenCalledTimes(1)
    expect(mockedCore.info).not.toHaveBeenCalledWith(
      expect.stringContaining(longIssuePayload.issue.title)
    )
    expect(mockedCore.info).not.toHaveBeenCalledWith(
      expect.stringContaining(longBody)
    )
    expect(mockedCore.info).not.toHaveBeenCalledWith(
      expect.stringContaining(truncatedTail)
    )
    expect(mockedCore.info).not.toHaveBeenCalledWith(
      expect.stringContaining(githubToken)
    )
    expect(mockedCore.info).not.toHaveBeenCalledWith(
      expect.stringContaining(openaiApiKey)
    )
    expect(mockedCore.setFailed).not.toHaveBeenCalled()
  })

  it("keeps prompt-injection-like issue content out of trusted logs", async () => {
    githubContext.payload = promptInjectionPayload
    mockInputs({
      "github-token": "gh-secret-token",
      "openai-api-key": "openai-secret-key"
    })

    await run()

    expect(mockedCore.info).toHaveBeenCalledWith(
      "Bounded LLM input prepared for issue #48: body_truncated=false, included_body_chars=234."
    )
    expect(mockResponsesCreate).toHaveBeenCalledTimes(1)
    expect(mockedCore.info).not.toHaveBeenCalledWith(
      expect.stringContaining("ignore previous instructions")
    )
    expect(mockedCore.info).not.toHaveBeenCalledWith(
      expect.stringContaining("remove the ready-for-dev label")
    )
    expect(mockedCore.setFailed).not.toHaveBeenCalled()
  })

  it("skips pull request payloads without failing or logging private content", async () => {
    const githubToken = "gh-secret-token"
    const openaiApiKey = "openai-secret-key"
    githubContext.payload = pullRequestLabeledPayload
    mockInputs({
      "github-token": githubToken,
      "openai-api-key": openaiApiKey
    })

    await run()

    expect(mockedCore.info).toHaveBeenCalledWith(
      "Skipping issue #44: pull requests are not supported by the MVP."
    )
    expect(mockResponsesCreate).not.toHaveBeenCalled()
    expect(mockCreateComment).not.toHaveBeenCalled()
    expect(mockedCore.info).not.toHaveBeenCalledWith(
      expect.stringContaining(pullRequestLabeledPayload.issue.body)
    )
    expect(mockedCore.info).not.toHaveBeenCalledWith(
      expect.stringContaining(githubToken)
    )
    expect(mockedCore.info).not.toHaveBeenCalledWith(
      expect.stringContaining(openaiApiKey)
    )
    expect(mockedCore.setFailed).not.toHaveBeenCalled()
  })

  it("skips unsupported event payloads without posting comments", async () => {
    githubContext.eventName = "push"
    githubContext.payload = {}
    mockInputs({
      "github-token": "gh-secret-token",
      "openai-api-key": "openai-secret-key"
    })

    await run()

    expect(mockedCore.info).toHaveBeenCalledWith(
      "Skipping run: unsupported event payload for issue label preflight."
    )
    expect(mockResponsesCreate).not.toHaveBeenCalled()
    expect(mockCreateComment).not.toHaveBeenCalled()
    expect(mockedCore.setFailed).not.toHaveBeenCalled()
  })

  it("logs empty-body precheck results safely without failing", async () => {
    const githubToken = "gh-secret-token"
    const openaiApiKey = "openai-secret-key"
    githubContext.payload = emptyIssuePayload
    mockInputs({
      "github-token": githubToken,
      "openai-api-key": openaiApiKey
    })

    await run()

    expect(mockedCore.info).toHaveBeenCalledWith(
      "Deterministic prechecks completed for issue #45: empty_body -> high_risk. LLM analysis skipped."
    )
    expect(mockResponsesCreate).not.toHaveBeenCalled()
    expect(mockCreateComment).toHaveBeenCalledTimes(1)
    expect(mockCreateComment).toHaveBeenCalledWith(
      expect.objectContaining({
        issue_number: 45,
        body: expect.stringContaining("## Dev Ticket Preflight: High Risk")
      })
    )
    expect(mockedCore.info).toHaveBeenCalledWith(
      "Preflight comment created for issue #45: comment_id=123."
    )
    expect(mockedCore.info).not.toHaveBeenCalledWith(
      expect.stringContaining("Bounded LLM input prepared")
    )
    expect(mockedCore.info).not.toHaveBeenCalledWith(
      expect.stringContaining(emptyIssuePayload.issue.title)
    )
    expect(mockedCore.info).not.toHaveBeenCalledWith(
      expect.stringContaining(githubToken)
    )
    expect(mockedCore.info).not.toHaveBeenCalledWith(
      expect.stringContaining(openaiApiKey)
    )
    expect(mockedCore.setFailed).not.toHaveBeenCalled()
  })

  it("logs short-body precheck results safely without failing", async () => {
    const githubToken = "gh-secret-token"
    const openaiApiKey = "openai-secret-key"
    githubContext.payload = shortIssuePayload
    mockInputs({
      "github-token": githubToken,
      "openai-api-key": openaiApiKey
    })

    await run()

    expect(mockedCore.info).toHaveBeenCalledWith(
      "Deterministic prechecks completed for issue #46: short_body -> high_risk. LLM analysis skipped."
    )
    expect(mockResponsesCreate).not.toHaveBeenCalled()
    expect(mockCreateComment).toHaveBeenCalledTimes(1)
    expect(mockedCore.info).toHaveBeenCalledWith(
      "Preflight comment created for issue #46: comment_id=123."
    )
    expect(mockedCore.info).not.toHaveBeenCalledWith(
      expect.stringContaining("Bounded LLM input prepared")
    )
    expect(mockedCore.info).not.toHaveBeenCalledWith(
      expect.stringContaining(shortIssuePayload.issue.body)
    )
    expect(mockedCore.info).not.toHaveBeenCalledWith(
      expect.stringContaining(githubToken)
    )
    expect(mockedCore.info).not.toHaveBeenCalledWith(
      expect.stringContaining(openaiApiKey)
    )
    expect(mockedCore.setFailed).not.toHaveBeenCalled()
  })

  it("marks the action failed when required configuration is missing", async () => {
    mockInputs({
      "github-token": "gh-secret-token",
      "openai-api-key": ""
    })

    await run()

    expect(mockedCore.setFailed).toHaveBeenCalledWith(
      "Setup error: Missing required input: openai-api-key"
    )
  })

  it("fails safely when structured LLM analysis fails without logging private content", async () => {
    const githubToken = "gh-secret-token"
    const openaiApiKey = "openai-secret-key"
    mockResponsesCreate.mockRejectedValue(new Error("provider secret detail"))
    mockInputs({
      "github-token": githubToken,
      "openai-api-key": openaiApiKey
    })

    await run()

    expect(mockedCore.info).toHaveBeenCalledWith(
      "LLM structured analysis requested for issue #42."
    )
    expect(mockedCore.info).toHaveBeenCalledWith(
      "LLM structured analysis failed for issue #42: provider_error."
    )
    expect(mockedCore.setFailed).toHaveBeenCalledWith(
      "LLM structured analysis failed: provider_error"
    )
    expect(mockCreateComment).not.toHaveBeenCalled()
    expect(mockedCore.info).not.toHaveBeenCalledWith(
      expect.stringContaining(issueLabeledPayload.issue.title)
    )
    expect(mockedCore.info).not.toHaveBeenCalledWith(
      expect.stringContaining(issueLabeledPayload.issue.body)
    )
    expect(mockedCore.info).not.toHaveBeenCalledWith(
      expect.stringContaining(githubToken)
    )
    expect(mockedCore.info).not.toHaveBeenCalledWith(
      expect.stringContaining(openaiApiKey)
    )
    expect(mockedCore.info).not.toHaveBeenCalledWith(
      expect.stringContaining("provider secret detail")
    )
  })

  it("rejects unsafe report language without posting or logging model content", async () => {
    const unsafeText = "The author failed to provide acceptance criteria."
    mockResponsesCreate.mockResolvedValue({
      output_text: JSON.stringify({
        ...structuredReport,
        risk_explanation: unsafeText
      })
    })
    mockInputs({
      "github-token": "gh-secret-token",
      "openai-api-key": "openai-secret-key"
    })

    await run()

    expect(mockCreateComment).not.toHaveBeenCalled()
    expect(mockUpdateComment).not.toHaveBeenCalled()
    expect(mockDeleteComment).not.toHaveBeenCalled()
    for (const mutation of mockForbiddenGitHubMutations) {
      expect(mutation).not.toHaveBeenCalled()
    }
    expect(mockedCore.warning).toHaveBeenCalledWith(
      "Preflight report rejected for issue #42: unsafe_report."
    )
    expect(mockedCore.setFailed).toHaveBeenCalledWith(
      "Preflight report rejected: unsafe_report"
    )
    expect(mockedCore.info).not.toHaveBeenCalledWith(
      expect.stringContaining(unsafeText)
    )
  })

  it.each([
    ["malformed JSON", '{"risk_explanation":"private raw model output"'],
    [
      "incomplete report",
      JSON.stringify({
        status: "ready",
        risk_explanation: "private incomplete model output"
      })
    ],
    [
      "unexpected mutation fields",
      JSON.stringify({
        ...structuredReport,
        labels: ["ready-for-dev"],
        comment_body: "private rendered comment"
      })
    ],
    [
      "invalid enum values",
      JSON.stringify({
        ...structuredReport,
        status: "blocked"
      })
    ]
  ])(
    "posts a safe fallback when LLM output is invalid: %s",
    async (_caseName, outputText) => {
      const githubToken = "gh-secret-token"
      const openaiApiKey = "openai-secret-key"
      mockResponsesCreate.mockResolvedValue({ output_text: outputText })
      mockInputs({
        "github-token": githubToken,
        "openai-api-key": openaiApiKey
      })

      await run()

      expect(mockedCore.info).toHaveBeenCalledWith(
        "LLM structured analysis requested for issue #42."
      )
      expect(mockedCore.info).toHaveBeenCalledWith(
        "LLM structured analysis failed validation for issue #42: invalid_report. Posting safe fallback report."
      )
      expect(mockCreateComment).toHaveBeenCalledWith(
        expect.objectContaining({
          issue_number: 42,
          body: expect.stringContaining(
            "A valid structured analysis report was not available for this run."
          )
        })
      )
      expect(mockedCore.setFailed).not.toHaveBeenCalled()
      expect(mockedCore.info).not.toHaveBeenCalledWith(
        expect.stringContaining(issueLabeledPayload.issue.title)
      )
      expect(mockedCore.info).not.toHaveBeenCalledWith(
        expect.stringContaining(issueLabeledPayload.issue.body)
      )
      expect(mockedCore.info).not.toHaveBeenCalledWith(
        expect.stringContaining(githubToken)
      )
      expect(mockedCore.info).not.toHaveBeenCalledWith(
        expect.stringContaining(openaiApiKey)
      )
      expect(mockedCore.info).not.toHaveBeenCalledWith(
        expect.stringContaining("private raw model output")
      )
      expect(mockedCore.info).not.toHaveBeenCalledWith(
        expect.stringContaining("private incomplete model output")
      )
      expect(mockedCore.info).not.toHaveBeenCalledWith(
        expect.stringContaining("private rendered comment")
      )
      expect(mockedCore.info).not.toHaveBeenCalledWith(
        expect.stringContaining("blocked")
      )
    }
  )

  it("fails safely when GitHub comment creation fails without retrying", async () => {
    mockCreateComment.mockRejectedValue(new Error("private API detail"))
    mockInputs({
      "github-token": "gh-secret-token",
      "openai-api-key": "openai-secret-key"
    })

    await run()

    expect(mockCreateComment).toHaveBeenCalledTimes(1)
    expect(mockedCore.info).toHaveBeenCalledWith(
      "GitHub comment creation failed for issue #42: api_error."
    )
    expect(mockedCore.setFailed).toHaveBeenCalledWith(
      "GitHub comment creation failed: api_error"
    )
    expect(mockUpdateComment).not.toHaveBeenCalled()
    expect(mockDeleteComment).not.toHaveBeenCalled()
    expect(mockedCore.info).not.toHaveBeenCalledWith(
      expect.stringContaining("private API detail")
    )
  })
})
