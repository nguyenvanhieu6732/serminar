import * as core from "@actions/core"
import {
  DEFAULT_READY_LABEL,
  loadConfig,
  type ActionConfig
} from "../src/config.js"

jest.mock("@actions/core")

const mockedCore = jest.mocked(core)

function mockInputs(inputs: Record<string, string>): void {
  mockedCore.getInput.mockImplementation((name: string) => inputs[name] ?? "")
}

describe("loadConfig", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("loads required secrets and defaults ready-label", () => {
    mockInputs({
      "github-token": " gh-token ",
      "openai-api-key": " openai-key "
    })

    const config: ActionConfig = loadConfig()

    expect(config).toEqual({
      githubToken: "gh-token",
      openaiApiKey: "openai-key",
      readyLabel: DEFAULT_READY_LABEL
    })
    expect(mockedCore.getInput).toHaveBeenCalledWith("github-token", {
      required: true
    })
    expect(mockedCore.getInput).toHaveBeenCalledWith("openai-api-key", {
      required: true
    })
    expect(mockedCore.getInput).toHaveBeenCalledWith("ready-label")
    expect(mockedCore.setSecret).toHaveBeenCalledWith("gh-token")
    expect(mockedCore.setSecret).toHaveBeenCalledWith("openai-key")
  })

  it("uses a trimmed custom ready-label", () => {
    mockInputs({
      "github-token": "gh-token",
      "openai-api-key": "openai-key",
      "ready-label": " custom-ready "
    })

    expect(loadConfig().readyLabel).toBe("custom-ready")
  })

  it("uses the default ready-label when the input is blank", () => {
    mockInputs({
      "github-token": "gh-token",
      "openai-api-key": "openai-key",
      "ready-label": "   "
    })

    expect(loadConfig().readyLabel).toBe(DEFAULT_READY_LABEL)
  })

  it("fails clearly when github-token is blank", () => {
    mockInputs({
      "github-token": "   ",
      "openai-api-key": "openai-key"
    })

    expect(() => loadConfig()).toThrow("Missing required input: github-token")
    expect(mockedCore.setSecret).not.toHaveBeenCalledWith("openai-key")
  })

  it("fails clearly when openai-api-key is blank without exposing the secret", () => {
    const secretValue = "super-secret-openai-key"
    mockInputs({
      "github-token": "gh-token",
      "openai-api-key": "   "
    })

    expect(() => loadConfig()).toThrow("Missing required input: openai-api-key")
    expect(() => loadConfig()).not.toThrow(secretValue)
  })
})
