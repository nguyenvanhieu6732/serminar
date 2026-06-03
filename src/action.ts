import * as core from "@actions/core"
import { context } from "@actions/github"
import { loadConfig } from "./config.js"
import { parseIssueLabeledEvent } from "./github-context.js"
import { buildLlmAnalysisInput, OpenAiLlmClient } from "./llm-client.js"
import { runPrechecks } from "./prechecks.js"

export async function run(): Promise<void> {
  try {
    const config = loadConfig()

    core.info(
      `Configuration loaded: required credentials present, ready-label "${config.readyLabel}".`
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
      const precheckResult = runPrechecks(parseResult.issue)

      if (precheckResult.kind === "report") {
        core.info(
          `Deterministic prechecks completed for issue #${parseResult.issue.issueNumber}: ${precheckResult.reason} -> ${precheckResult.report.status}. LLM analysis skipped.`
        )
        return
      }

      core.info(
        `Deterministic prechecks completed for issue #${parseResult.issue.issueNumber}: enough_context. Preparing bounded LLM input.`
      )

      const llmInput = buildLlmAnalysisInput(parseResult.issue)

      core.info(
        `Bounded LLM input prepared for issue #${llmInput.logMetadata.issueNumber}: body_truncated=${llmInput.logMetadata.truncated}, included_body_chars=${llmInput.logMetadata.includedBodyLength}.`
      )

      core.info(
        `LLM structured analysis requested for issue #${llmInput.logMetadata.issueNumber}.`
      )

      try {
        const llmClient = new OpenAiLlmClient(config.openaiApiKey)
        await llmClient.analyzeIssue(llmInput)
      } catch {
        core.info(
          `LLM structured analysis failed for issue #${llmInput.logMetadata.issueNumber}: provider_error.`
        )
        core.setFailed("LLM structured analysis failed: provider_error")
        return
      }

      core.info(
        `LLM structured analysis completed for issue #${llmInput.logMetadata.issueNumber}; validation deferred.`
      )
      return
    }

    if (parseResult.reason === "label_mismatch") {
      core.info(
        `Skipping issue #${parseResult.issueNumber}: label "${parseResult.labelName}" does not match ready label "${config.readyLabel}".`
      )
      return
    }

    if (parseResult.reason === "pull_request") {
      core.info(
        `Skipping issue #${parseResult.issueNumber}: pull requests are not supported by the MVP.`
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
