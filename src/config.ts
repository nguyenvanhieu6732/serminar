import * as core from "@actions/core"

export const DEFAULT_READY_LABEL = "ready-for-dev"

export interface ActionConfig {
  readonly githubToken: string
  readonly openaiApiKey: string
  readonly readyLabel: string
}

export function loadConfig(): ActionConfig {
  const githubToken = core.getInput("github-token", { required: true }).trim()

  if (githubToken.length === 0) {
    throw new Error("Missing required input: github-token")
  }

  core.setSecret(githubToken)

  const openaiApiKey = core
    .getInput("openai-api-key", { required: true })
    .trim()

  if (openaiApiKey.length === 0) {
    throw new Error("Missing required input: openai-api-key")
  }

  core.setSecret(openaiApiKey)

  const readyLabelInput = core.getInput("ready-label").trim()

  return {
    githubToken,
    openaiApiKey,
    readyLabel:
      readyLabelInput.length > 0 ? readyLabelInput : DEFAULT_READY_LABEL
  }
}
