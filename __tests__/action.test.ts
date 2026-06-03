import * as core from "@actions/core"
import { context } from "@actions/github"
import { run } from "../src/action.js"
import { DEFAULT_READY_LABEL } from "../src/config.js"
import emptyIssuePayload from "./fixtures/empty-issue.json"
import issueLabeledPayload from "./fixtures/issue-labeled.json"
import issueOtherLabelPayload from "./fixtures/issue-other-label.json"
import pullRequestLabeledPayload from "./fixtures/pull-request-labeled.json"
import shortIssuePayload from "./fixtures/short-issue.json"

jest.mock("@actions/core")

const mockedCore = jest.mocked(core)
const githubContext = context as typeof context & {
  eventName: string
  payload: unknown
}

function mockInputs(inputs: Record<string, string>): void {
  mockedCore.getInput.mockImplementation((name: string) => inputs[name] ?? "")
}

describe("run", () => {
  beforeEach(() => {
    jest.clearAllMocks()
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
      `Configuration loaded: github-token present, openai-api-key present, ready-label "${DEFAULT_READY_LABEL}".`
    )
    expect(mockedCore.info).toHaveBeenCalledWith(
      'Issue #42 received ready label "ready-for-dev"; preflight eligibility confirmed.'
    )
    expect(mockedCore.info).toHaveBeenCalledWith(
      "Deterministic prechecks completed for issue #42: enough_context. LLM analysis allowed for a later story."
    )
    expect(mockedCore.info).not.toHaveBeenCalledWith(
      expect.stringContaining(githubToken)
    )
    expect(mockedCore.info).not.toHaveBeenCalledWith(
      expect.stringContaining(openaiApiKey)
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
      "Deterministic prechecks completed for issue #43: enough_context. LLM analysis allowed for a later story."
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
})
