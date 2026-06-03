import * as core from "@actions/core"
import { context } from "@actions/github"
import { loadConfig } from "./config.js"
import { parseIssueLabeledEvent } from "./github-context.js"

export async function run(): Promise<void> {
  try {
    const config = loadConfig()

    core.info(
      `Configuration loaded: github-token present, openai-api-key present, ready-label "${config.readyLabel}".`
    )

    const parseResult = parseIssueLabeledEvent({
      eventName: context.eventName,
      payload: context.payload,
      readyLabel: config.readyLabel
    })

    if (parseResult.kind === "ready") {
      core.info(
        `Issue #${parseResult.issue.issueNumber} received ready label "${parseResult.issue.labelName}"; preflight eligibility confirmed.`
      )
      return
    }

    if (parseResult.reason === "label_mismatch") {
      core.info(
        `Skipping issue #${parseResult.issueNumber}: label "${parseResult.labelName}" does not match ready label "${config.readyLabel}".`
      )
      return
    }

    core.info(
      "Skipping run: unsupported event payload for issue label preflight."
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    core.setFailed(`Setup error: ${message}`)
  }
}
