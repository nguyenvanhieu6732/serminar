import * as core from "@actions/core"
import { context } from "@actions/github"
import { loadConfig } from "./config.js"
import { createIssueComment } from "./github-comments.js"
import { parseIssueLabeledEvent } from "./github-context.js"
import {
  buildLlmAnalysisInput,
  LlmOutputParseError,
  OpenAiLlmClient
} from "./llm-client.js"
import { runPrechecks } from "./prechecks.js"
import {
  applyConservativeStatusPolicy,
  type PreflightReport,
  PreflightReportValidationError,
  validatePreflightReport
} from "./report-schema.js"
import { renderReport } from "./report-renderer.js"

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
        await postReport(
          config.githubToken,
          parseResult.issue,
          precheckResult.report
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

      let report: PreflightReport

      try {
        const llmClient = new OpenAiLlmClient(config.openaiApiKey)
        const rawReport = await llmClient.analyzeIssue(llmInput)
        const validatedReport = validatePreflightReport(rawReport)
        report = applyConservativeStatusPolicy(validatedReport)

        core.info(
          `LLM structured analysis validated for issue #${llmInput.logMetadata.issueNumber}: ${report.status}.`
        )
      } catch (error) {
        if (
          error instanceof LlmOutputParseError ||
          error instanceof PreflightReportValidationError
        ) {
          core.info(
            `LLM structured analysis failed validation for issue #${llmInput.logMetadata.issueNumber}: invalid_report.`
          )
          core.setFailed(
            "LLM structured analysis failed validation: invalid_report"
          )
          return
        }

        core.info(
          `LLM structured analysis failed for issue #${llmInput.logMetadata.issueNumber}: provider_error.`
        )
        core.setFailed("LLM structured analysis failed: provider_error")
        return
      }

      await postReport(config.githubToken, parseResult.issue, report)
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

async function postReport(
  githubToken: string,
  issue: {
    readonly owner: string
    readonly repo: string
    readonly issueNumber: number
  },
  report: PreflightReport
): Promise<void> {
  const body = renderReport(report)

  try {
    const commentId = await createIssueComment({
      token: githubToken,
      target: {
        owner: issue.owner,
        repo: issue.repo,
        issueNumber: issue.issueNumber
      },
      body
    })

    core.info(
      `Preflight comment created for issue #${issue.issueNumber}: comment_id=${commentId}.`
    )
  } catch {
    core.info(
      `GitHub comment creation failed for issue #${issue.issueNumber}: api_error.`
    )
    core.setFailed("GitHub comment creation failed: api_error")
  }
}
