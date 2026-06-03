import * as core from "@actions/core"
import { context } from "@actions/github"
import { run } from "../src/action.js"
import { DEFAULT_READY_LABEL } from "../src/config.js"
import issueLabeledPayload from "./fixtures/issue-labeled.json"
import issueOtherLabelPayload from "./fixtures/issue-other-label.json"

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
