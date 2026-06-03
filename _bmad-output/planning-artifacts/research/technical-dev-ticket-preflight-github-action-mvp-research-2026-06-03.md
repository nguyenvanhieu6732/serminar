---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments:
  - _bmad-output/planning-artifacts/briefs/brief-serminal-2026-06-03/brief.md
  - _bmad-output/planning-artifacts/research/market-dev-ticket-preflight-for-github-issues-research-2026-06-03.md
workflowType: 'research'
lastStep: 1
research_type: 'technical'
research_topic: 'Dev Ticket Preflight GitHub Action MVP'
research_goals: 'Đánh giá kỹ thuật cho MVP GitHub Action: Action vs App, trigger ready-for-dev, GitHub permissions/API, issue comment workflow, LLM integration, privacy/data handling, security risks, implementation architecture, and prototype path.'
user_name: 'Nguyenhieu'
date: '2026-06-03'
web_research_enabled: true
source_verification: true
---

# Research Report: technical

**Date:** 2026-06-03
**Author:** Nguyenhieu
**Research Type:** technical

---

## Research Overview

This technical research evaluates the best implementation path for **Dev Ticket Preflight GitHub Action MVP**. The research focuses on whether the product should begin as a GitHub Action or GitHub App, what GitHub permissions and APIs are required, how the label-triggered issue-comment workflow should work, and how to integrate an LLM safely with private issue data and untrusted user content.

The key finding is clear: the MVP should start as a **stateless TypeScript GitHub Action**, not a hosted GitHub App or SaaS. The Action should trigger on `issues.labeled`, filter for `ready-for-dev`, run deterministic prechecks, request a structured LLM report, validate the schema locally, render Markdown from trusted code, and post one non-blocking issue comment. See the Research Synthesis section for final recommendations, risk assessment, and implementation roadmap.

---

## Technical Research Scope Confirmation

**Research Topic:** Dev Ticket Preflight GitHub Action MVP
**Research Goals:** Đánh giá kỹ thuật cho MVP GitHub Action: Action vs App, trigger ready-for-dev, GitHub permissions/API, issue comment workflow, LLM integration, privacy/data handling, security risks, implementation architecture, and prototype path.

**Technical Research Scope:**

- Architecture Analysis - GitHub Action/App choice, runtime model, report generation flow
- Implementation Approaches - JavaScript Action, workflow YAML, prompt/report schema, testing strategy
- Technology Stack - Node.js/TypeScript, GitHub Actions Toolkit, GitHub REST API/Octokit, LLM provider SDK
- Integration Patterns - issue label trigger, issue body/comment reading, issue comment writing, optional slash command rerun
- Performance/Security Considerations - token permissions, private issue data handling, LLM cost, prompt injection, GitHub Actions supply-chain risk

**Research Methodology:**

- Current web data with rigorous source verification
- Primary-source preference for GitHub and OpenAI technical claims
- Multi-source validation for critical security and privacy risks
- Confidence level framework for uncertain information

**Scope Confirmed:** 2026-06-03

## Technology Stack Analysis

### Web Search Analysis

Technology-stack research focused on official GitHub Actions documentation, GitHub REST API documentation, GitHub Actions Toolkit, GitHub Marketplace/App documentation, and OpenAI API documentation for structured LLM output and data handling. The goal is not to compare many general stacks; it is to identify the smallest credible technical path for a validation MVP.

The strongest conclusion is that the first MVP should be a **JavaScript/TypeScript GitHub Action**, not a full hosted GitHub App. This matches the market research recommendation: fast validation, low scope, one-repo installation, label-triggered execution, and a Markdown issue comment output.

### Programming Languages

**Recommended language: TypeScript running as a JavaScript Action.**

GitHub's JavaScript Action guide uses the GitHub Actions Toolkit and Node.js. The Actions Toolkit provides packages such as `@actions/core` for inputs/outputs/logging and related packages for building reusable actions. A TypeScript source compiled/bundled to JavaScript gives better type safety while still publishing as a normal JavaScript Action.

_Popular Languages_: JavaScript/TypeScript is the most direct fit because GitHub's action authoring examples and toolkit ecosystem are centered around JavaScript Actions, and Octokit/OpenAI SDK support is mature.

_Emerging Languages_: Go or Python could work for a container action or script-based workflow, but they add friction for a small marketplace-style reusable Action. They are not the best first choice unless the implementation requires a binary or Python-specific NLP libraries.

_Language Evolution_: The main watch item is GitHub runner/runtime support for Node versions. The implementation should track GitHub's current supported `runs.using` runtime and avoid pinning to an old Node runtime.

_Performance Characteristics_: TypeScript/JavaScript is sufficient. The bottleneck will be LLM latency and GitHub API calls, not local compute.

_Sources_: https://docs.github.com/en/actions/tutorials/create-actions/create-a-javascript-action, https://github.com/actions/toolkit, https://github.com/actions/setup-node

### Development Frameworks and Libraries

**Recommended libraries:**

- `@actions/core` for inputs, outputs, logging, failure handling, and secret masking
- `@actions/github` / Octokit for GitHub API access
- OpenAI JavaScript SDK or generic HTTP client for LLM calls
- Zod or JSON Schema for validating the preflight report schema locally
- A Markdown renderer/template function for the final issue comment

The MVP should keep dependencies narrow. Each dependency in a GitHub Action increases supply-chain risk and maintenance surface. A small TypeScript Action with GitHub Toolkit, Octokit, and one LLM client is enough.

_Major Frameworks_: GitHub Actions Toolkit and Octokit are the core framework/library choices.

_Micro-frameworks_: Zod is useful if the LLM returns JSON that must be validated before rendering. However, OpenAI Structured Outputs can reduce schema drift by making responses conform to a JSON Schema.

_Evolution Trends_: AI workflow Actions increasingly use custom prompts and structured outputs. GitHub's own `ai-assessment-comment-labeler` demonstrates a label-triggered pattern that processes issue text and produces labels/comments/structured assessments.

_Ecosystem Maturity_: GitHub Actions Toolkit and REST API are mature; LLM structured output support is mature enough for MVP but still requires validation and fallback behavior.

_Sources_: https://github.com/actions/toolkit, https://github.com/github/ai-assessment-comment-labeler, https://platform.openai.com/docs/guides/structured-outputs, https://openai.com/index/introducing-structured-outputs-in-the-api/

### Database and Storage Technologies

**Recommendation: no database for MVP.**

The first MVP should be stateless:

- Input: issue title/body, possibly selected comments, repo configuration
- Processing: local prompt assembly + LLM call
- Output: one issue comment with checklist

Persistence can live in GitHub itself: the issue comment is the durable artifact, and repo configuration can live in YAML checked into the repository.

_Relational Databases_: not needed for MVP.

_NoSQL Databases_: not needed unless adding account-level billing, usage analytics, or multi-repo dashboards.

_In-Memory Databases_: not needed.

_Data Warehousing_: explicitly out of scope because market research warned against manager analytics/dashboard positioning.

Potential future storage:

- GitHub issue comments for report history
- Repository config file such as `.github/dev-ticket-preflight.yml`
- Hosted database only after moving to GitHub App/SaaS for multi-repo usage, billing, or customization

_Sources_: https://docs.github.com/en/rest/issues/comments, https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions

### Development Tools and Platforms

**Core platform: GitHub Actions.**

The workflow should trigger on the `issues` event with activity type `labeled`, then filter for label name `ready-for-dev`. GitHub's event documentation says `labeled` can be used for the `issues` event when a label is added. This is exactly the desired MVP trigger.

**Minimum GitHub permission model:**

The job should request only what it needs. GitHub workflow syntax documents that `issues: write` permits adding a comment to an issue. The MVP likely needs:

```yaml
permissions:
  issues: write
  contents: read
```

`contents: read` is only needed if the workflow reads repo config or prompt files. If config is passed entirely as action inputs, even that can be reduced. `models: read` may be relevant only if using GitHub Models instead of an external LLM API.

**GitHub API usage:**

- Read event payload from `github.context.payload.issue`
- Optionally fetch full issue comments through REST API
- Create issue comment through REST API
- Avoid label mutation in MVP

_IDE and Editors_: no special IDE requirement; TypeScript development can use VS Code or any editor.

_Version Control_: GitHub repo for Action source, semantic version tags for action releases, and Marketplace listing later.

_Build Systems_: TypeScript + bundler such as `ncc`, `tsup`, or equivalent to package runtime JS. Keep release artifact deterministic.

_Testing Frameworks_: unit tests for report rendering/schema validation and fixture-based tests for GitHub event payloads. Integration tests can use mocked Octokit and LLM responses first.

_Sources_: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows, https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions, https://docs.github.com/v3/issues/comments, https://github.com/actions/toolkit

### Cloud Infrastructure and Deployment

**Recommendation: no separate cloud infrastructure for MVP.**

GitHub-hosted runners provide the runtime. The only external service is the LLM API provider, unless using GitHub Models. Avoiding hosted infrastructure reduces build time, privacy surface, and operating cost.

_Major Cloud Providers_: not needed for MVP.

_Container Technologies_: container actions are unnecessary unless dependencies require a custom runtime. A JavaScript Action is simpler.

_Serverless Platforms_: not needed until moving to a GitHub App or hosted SaaS.

_CDN and Edge Computing_: not relevant.

Future infrastructure may be needed for:

- GitHub App webhooks
- Multi-repo configuration
- Billing/usage metering
- Audit logs
- Hosted playground

_Sources_: https://docs.github.com/en/actions/tutorials/create-actions/create-a-javascript-action, https://docs.github.com/en/apps/github-marketplace/github-marketplace-overview/about-github-marketplace-for-apps

### LLM Integration Stack

**Recommended MVP approach: external LLM call with structured output.**

The Action should ask the LLM for a structured report, not raw Markdown. Then local code renders Markdown. This makes output safer, easier to validate, easier to test, and less likely to produce malformed checklist comments.

OpenAI Structured Outputs are specifically designed to make model responses adhere to a developer-supplied JSON Schema. The official docs also note benefits such as type-safety and programmatically detectable refusals. For this MVP, a schema could include:

- `status`: `ready | needs_clarification | high_risk`
- `missing_context[]`
- `risk_explanation`
- `suggested_questions[]`
- `draft_acceptance_criteria[]`
- `confidence`
- `evidence[]` referencing snippets or fields from the issue

Important limitation: structured output guarantees shape, not truth. The Action still needs local checks, conservative prompting, and clear "suggestion" wording.

_Sources_: https://platform.openai.com/docs/guides/structured-outputs, https://openai.com/index/introducing-structured-outputs-in-the-api/, https://platform.openai.com/docs/api-reference/responses/compact?api-mode=responses

### Technology Adoption Trends

The stack recommendation aligns with current adoption and market signals:

- GitHub Actions and Marketplace provide a native distribution path for developer workflow automations.
- GitHub's own AI assessment action demonstrates label-triggered issue analysis as an existing pattern.
- AI coding/spec workflows are increasing the need for task clarity.
- Developer-tool buyers are sensitive to install friction and permissions, so Action-first is preferable for validation.

_Migration Patterns_: start as reusable GitHub Action; migrate to GitHub App only if multi-repo management, billing, or richer UX becomes necessary.

_Emerging Technologies_: GitHub Models could be considered as an alternative to external LLM keys, but it needs separate technical validation for availability, cost, and model quality.

_Legacy Technology_: traditional issue templates remain useful but static; Dev Ticket Preflight adds just-in-time review at readiness transition.

_Community Trends_: developer-native tools often win by being copy-paste installable, open-source or transparent, and useful in the first run.

_Sources_: https://docs.github.com/en/actions/learn-github-actions/finding-and-customizing-actions, https://docs.github.com/en/actions/sharing-automations/creating-actions/publishing-actions-in-github-marketplace, https://github.com/github/ai-assessment-comment-labeler

### Technology Stack Recommendation

Recommended MVP stack:

- **Runtime:** GitHub Action, JavaScript Action
- **Language:** TypeScript compiled/bundled to JavaScript
- **GitHub API:** Octokit via `@actions/github`
- **Action utilities:** `@actions/core`
- **Trigger:** `issues.labeled` filtered to `ready-for-dev`
- **Permissions:** `issues: write`, plus `contents: read` only if loading config/prompts from repo
- **LLM:** OpenAI Responses API or equivalent provider with structured output
- **Output:** local Markdown renderer posting one issue comment
- **Storage:** none; use issue comment and optional repo YAML config
- **Prototype:** open-source Action with example workflow and sample reports

Confidence: high for Action-first MVP feasibility; medium for LLM/provider choice until cost, privacy, and output quality are tested.

## Integration Patterns Analysis

### Web Search Analysis

Integration research focused on official GitHub Actions event documentation, Actions contexts, workflow syntax, issue comment REST APIs, secrets handling, and label-comment workflow examples. These sources confirm that the desired MVP flow is technically straightforward: a workflow can trigger when an issue label is added, filter for `ready-for-dev`, read the event payload, call an LLM, and create a GitHub issue comment.

The key design choice is to keep the integration one-way and non-blocking in MVP. The Action reads issue context and writes a comment. It should not mutate labels, assign users, close issues, or create checks until user value is validated.

### API Design Patterns

**RESTful APIs**

The MVP should use GitHub's REST API through Octokit or `@actions/github`. The critical endpoint is `POST /repos/{owner}/{repo}/issues/{issue_number}/comments`, which creates a comment on an issue or pull request. GitHub documents that this endpoint requires a `body` and works with fine-grained tokens that have Issues write or Pull Requests write permissions.

**GraphQL APIs**

GraphQL is not needed for MVP. REST endpoints are sufficient for issue payload access and comment creation. GraphQL may become useful later for richer Project fields or cross-resource queries.

**RPC and gRPC**

Not relevant for MVP.

**Webhook Patterns**

GitHub Actions turns GitHub webhook events into workflow runs. The desired trigger is `issues` with `types: [labeled]`, then a job-level or step-level condition checks `github.event.label.name == 'ready-for-dev'`. GitHub's event docs explicitly support `labeled` and `unlabeled` activity types for issues.

_Sources_: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows, https://docs.github.com/en/actions/tutorials/manage-your-work/add-comments-with-labels, https://docs.github.com/en/rest/issues/comments

### Communication Protocols

**HTTP/HTTPS Protocols**

All integrations use HTTPS:

- GitHub Actions runner to GitHub REST API
- GitHub Actions runner to LLM provider API
- Optional calls to fetch issue comments or repository config

**WebSocket Protocols**

Not needed. The Action is batch/event-driven, not interactive realtime.

**Message Queue Protocols**

Not needed. GitHub Actions provides the event execution queue. If the product later becomes a hosted GitHub App, queueing may be useful for webhook processing and retries.

**gRPC and Protocol Buffers**

Not relevant for MVP.

_Sources_: https://docs.github.com/en/rest/issues/comments, https://platform.openai.com/docs/api-reference/responses/compact?api-mode=responses

### Data Formats and Standards

**JSON**

JSON is the primary interchange format:

- GitHub event payload via `github.event`
- GitHub REST API requests/responses
- LLM structured output
- Optional local config if YAML is parsed into JSON internally

**Markdown**

Markdown is the final user-facing output format because GitHub issue comments render Markdown naturally, including task lists.

**YAML**

YAML is the repository configuration format for GitHub workflow files and likely for optional product config, for example `.github/dev-ticket-preflight.yml`.

**Custom Data Formats**

The product should define a strict internal `PreflightReport` schema:

```json
{
  "status": "ready | needs_clarification | high_risk",
  "missing_context": [],
  "risk_explanation": "",
  "suggested_questions": [],
  "draft_acceptance_criteria": [],
  "evidence": [],
  "confidence": "low | medium | high"
}
```

The Action should render Markdown from this schema, rather than asking the LLM to produce the final comment directly.

_Sources_: https://docs.github.com/en/actions/learn-github-actions/contexts, https://docs.github.com/en/rest/issues/comments, https://platform.openai.com/docs/guides/structured-outputs

### System Interoperability Approaches

**Point-to-Point Integration**

MVP architecture is direct:

1. GitHub event triggers workflow.
2. Action reads issue payload.
3. Action optionally fetches issue comments/config.
4. Action sends bounded issue context to LLM.
5. Action validates structured result.
6. Action posts Markdown comment to GitHub.

This point-to-point pattern is appropriate because there is no hosted backend or multi-system orchestration in MVP.

**API Gateway Patterns**

Not needed until the product becomes a hosted app with billing, usage metering, or provider abstraction.

**Service Mesh / Enterprise Service Bus**

Not relevant.

_Sources_: https://docs.github.com/en/actions/learn-github-actions/contexts, https://docs.github.com/en/rest/issues/comments

### Event-Driven Integration

**Primary event: issue labeled**

Recommended workflow skeleton:

```yaml
name: Dev Ticket Preflight

on:
  issues:
    types: [labeled]

permissions:
  issues: write
  contents: read

concurrency:
  group: preflight-${{ github.event.issue.number }}
  cancel-in-progress: true

jobs:
  preflight:
    if: github.event.label.name == 'ready-for-dev'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: your-org/dev-ticket-preflight@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
```

**Optional rerun event: issue_comment created**

For `/preflight`, add:

```yaml
on:
  issue_comment:
    types: [created]
```

Then filter comments where `github.event.comment.body` starts with `/preflight`. This should be a post-MVP or late-MVP feature because it introduces more event paths and permission checks.

**Comment lifecycle**

Two options:

- **Append-only comments:** simplest, safest for MVP, but can create noise.
- **Update previous bot comment:** cleaner UX, but requires listing comments, identifying a bot marker, and patching the existing comment.

Recommendation: use append-only for manual validation and first prototype; move to update-in-place once repeat runs are common. If updating, include an HTML marker such as:

```html
<!-- dev-ticket-preflight:report -->
```

**Concurrency**

GitHub Actions supports concurrency groups. Use a per-issue group to avoid duplicate comments when labels are toggled quickly or reruns overlap.

_Sources_: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows, https://docs.github.com/en/actions/tutorials/manage-your-work/add-comments-with-labels, https://docs.github.com/en/actions/concepts/workflows-and-actions/concurrency, https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions

### Integration Security Patterns

**GITHUB_TOKEN permissions**

Use least privilege. For the basic MVP:

- `issues: write` to create issue comments
- `contents: read` only if reading repository config or prompt files

Avoid broad default permissions. Do not request `pull-requests: write`, `actions: write`, or `contents: write` unless a later feature explicitly requires them.

**Secrets**

LLM API keys should be passed through GitHub Actions secrets. GitHub docs state `GITHUB_TOKEN` is automatically created for workflow runs and secrets are available through the `secrets` context. Secrets should not be logged, and any dynamic sensitive values should be masked.

**Private issue data handling**

The Action may send issue title/body/comments to an LLM provider. This must be explicit in README and example workflow docs. For private repos, this is the biggest adoption/trust issue.

Recommended mitigations:

- Document exactly which fields are sent.
- Default to title/body only; comments opt-in.
- Add max-length truncation and redaction hooks.
- Support BYOK.
- Add a no-codebase mode; do not read files unless configured.
- Keep report evidence tied to issue text.

**Prompt injection**

Issue text is untrusted input. The system prompt must treat issue content as data, not instructions. The Action should not allow the model to trigger GitHub API calls directly; the model only returns structured analysis, and local code performs the single allowed write operation.

_Sources_: https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions, https://docs.github.com/actions/reference/encrypted-secrets, https://docs.github.com/en/actions/learn-github-actions/contexts, https://openai.com/business-data/

### Integration Edge Cases

**Pull requests are issues**

GitHub notes pull requests share issue comment endpoints. The Action should skip payloads where `github.event.issue.pull_request` exists unless PR support is explicitly enabled.

**Deleted or renamed label**

If `ready-for-dev` does not exist or is renamed, no run happens. Later, make label configurable.

**Issue body is empty**

Return `High Risk` or `Needs Clarification` with a minimal checklist. Do not call the LLM if a deterministic empty-body rule is enough.

**Very long issue/comment threads**

Limit input tokens. Prefer title/body first; comments opt-in and capped.

**Secondary rate limits**

GitHub's create-comment endpoint warns that creating content too quickly may trigger secondary rate limiting. Concurrency and update-in-place reduce this risk.

**Forks and secrets**

GitHub docs note secrets are not passed to workflows triggered from forks, except `GITHUB_TOKEN`. This matters less for `issues.labeled` on the base repository, but it matters if PR/comment triggers are added later.

_Sources_: https://docs.github.com/en/rest/issues/comments, https://docs.github.com/en/actions/learn-github-actions/contexts, https://docs.github.com/actions/reference/encrypted-secrets

### Integration Patterns Recommendation

Recommended MVP integration flow:

1. Trigger on `issues.labeled`.
2. Filter for configured ready label, default `ready-for-dev`.
3. Skip pull requests.
4. Read issue title/body from `github.event.issue`.
5. Optionally read repo config from `.github/dev-ticket-preflight.yml`.
6. Build bounded LLM input.
7. Request structured report.
8. Validate report schema.
9. Render Markdown.
10. Post issue comment using Issues API.

Recommended late-MVP additions:

- `/preflight` rerun via `issue_comment.created`
- Update previous preflight comment instead of appending
- Configurable checklist rules
- Optional inclusion of last N comments

Confidence: high for event/comment integration feasibility; medium for privacy acceptance until target users test private-repo workflows.

## Architectural Patterns and Design

### Web Search Analysis

Architecture research focused on GitHub Actions security hardening, script injection risks, CI/CD least privilege, OWASP GitHub Actions guidance, and agentic workflow injection research. The most important architectural insight is that this product processes **untrusted issue content** inside a workflow that has write permission to issues and access to an LLM API key. That combination is manageable, but only if the Action is designed as a constrained analyzer, not an autonomous agent.

The architecture should enforce a hard boundary: the model may produce a structured report, but local trusted code decides what to render and performs the only GitHub write operation.

### System Architecture Patterns

**Recommended pattern: stateless event-driven Action.**

The MVP architecture is a small event-driven pipeline:

```text
GitHub issues.labeled event
  -> GitHub-hosted runner
  -> Action input/context parser
  -> deterministic pre-checks
  -> LLM structured analysis
  -> schema validation
  -> Markdown renderer
  -> GitHub issue comment
```

This is intentionally not a microservice architecture. No hosted backend, database, queue, dashboard, or long-lived service is needed for validation. The durable system of record remains GitHub Issues.

**Why this pattern fits**

- It minimizes infrastructure.
- It has a clear trigger and output.
- It is installable per repository.
- It aligns with the market recommendation to validate before SaaS build.
- It keeps the blast radius small.

**Rejected pattern: hosted GitHub App first**

A GitHub App may become appropriate after validation, but starting there increases complexity: webhook receiver, installation tokens, billing, account management, deployment, operational security, and data storage decisions. None of those are necessary to test whether preflight reports are useful.

_Source: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows, https://docs.github.com/en/apps/github-marketplace/github-marketplace-overview/about-github-marketplace-for-apps_

### Design Principles and Best Practices

**1. Least privilege by default**

The workflow should declare explicit permissions and request only `issues: write` plus `contents: read` if repo config is loaded. GitHub and OWASP both emphasize least privilege for Actions workflows because the `GITHUB_TOKEN` can be abused if compromised.

**2. Treat GitHub event content as untrusted**

GitHub's script injection docs explicitly warn that attacker-controlled values can enter the `github` context, including issue titles and bodies. The Action must never interpolate issue title/body/comment directly into shell commands or workflow expressions.

**3. Separate untrusted analysis from trusted execution**

The LLM should not produce executable commands, API calls, labels to apply, or workflow decisions. It should produce a JSON report. Local code validates the report and renders safe Markdown.

**4. Prefer deterministic rules before LLM**

Some checks do not need AI:

- Empty issue body
- Missing title/body
- Body shorter than threshold
- Pull request detected instead of issue
- Label mismatch

These checks reduce cost and make behavior predictable.

**5. Make the output humble**

The comment should say "suggested questions" and "possible missing context," not "this ticket is invalid." This is a product/UX principle, but it also reduces risk from AI overconfidence.

_Sources: https://docs.github.com/en/actions/concepts/security/script-injections, https://cheatsheetseries.owasp.org/cheatsheets/GitHub_Actions_Security_Cheat_Sheet.html, https://github.blog/security/application-security/implementing-least-privilege-for-secrets-in-github-actions/_

### Scalability and Performance Patterns

MVP scale requirements are modest. The product runs only when labels are applied or `/preflight` is invoked. The practical constraints are LLM latency, API rate limits, comment noise, and GitHub Actions minutes.

**Performance approach**

- Keep issue context bounded.
- Default to title/body only.
- Make comments opt-in and capped.
- Avoid reading codebase files in MVP.
- Use deterministic pre-checks to skip unnecessary LLM calls.
- Use a small/fast model where possible.

**Concurrency approach**

Use GitHub Actions concurrency per issue:

```yaml
concurrency:
  group: preflight-${{ github.event.issue.number }}
  cancel-in-progress: true
```

This prevents duplicate comments if a label is toggled repeatedly or multiple preflight runs overlap. GitHub's concurrency docs support limiting concurrent workflow runs and canceling in-progress runs.

**Rate limit approach**

GitHub's create-comment endpoint warns that creating content too quickly can trigger secondary rate limiting. The architecture should avoid loops and repeated comment creation. Update-in-place can be added later to reduce noise.

_Sources: https://docs.github.com/en/actions/concepts/workflows-and-actions/concurrency, https://docs.github.com/en/rest/issues/comments_

### Integration and Communication Patterns

The Action should use a layered module design:

```text
src/
  action.ts              # reads inputs/context, orchestrates
  github-context.ts      # parses/normalizes GitHub event payload
  config.ts              # loads action inputs and optional repo config
  prechecks.ts           # deterministic readiness checks
  llm-client.ts          # provider abstraction
  report-schema.ts       # JSON schema / Zod schema
  report-renderer.ts     # Markdown output
  github-comments.ts     # create/update issue comment
  security.ts            # input truncation/redaction utilities
```

**Boundary rules**

- `github-context.ts` treats all event text as untrusted data.
- `llm-client.ts` cannot access GitHub credentials.
- `report-renderer.ts` only renders validated schema data.
- `github-comments.ts` only receives final Markdown body and issue number.
- No module shells out with issue-provided text.

This is a simple clean/hexagonal architecture applied at small scale: GitHub and LLM are adapters; core analysis/report schema stays testable.

_Sources: https://docs.github.com/en/actions/learn-github-actions/contexts, https://docs.github.com/en/rest/issues/comments, https://platform.openai.com/docs/guides/structured-outputs_

### Security Architecture Patterns

**Threat model summary**

Primary threats:

- Script injection from issue title/body/comment
- Prompt injection from issue content
- LLM output influencing privileged workflow behavior
- Secret leakage through logs
- Overbroad `GITHUB_TOKEN` permissions
- Third-party Action supply-chain compromise
- Private issue data sent to an LLM unexpectedly

**Mitigation architecture**

- Never interpolate issue content into shell scripts.
- Use JavaScript code paths instead of inline shell for untrusted input handling.
- Declare least-privilege workflow permissions.
- Pass LLM API key via secrets; never log request payloads by default.
- Mask any dynamically derived sensitive values if needed.
- Pin third-party Actions in example workflows where practical.
- Document exactly what data leaves GitHub.
- Keep the LLM response non-executable and schema-validated.
- Do not let the LLM decide labels, assignees, or file writes in MVP.

Recent research on agentic workflow injection describes risks where untrusted GitHub event context, such as issue bodies or comments, crosses prompt boundaries and then influences downstream workflow logic. Dev Ticket Preflight should explicitly avoid "agent" behavior in MVP. It is a report generator, not an actor.

_Sources: https://docs.github.com/en/actions/concepts/security/script-injections, https://docs.github.com/en/enterprise-cloud%40latest/actions/reference/security/secure-use, https://cheatsheetseries.owasp.org/cheatsheets/GitHub_Actions_Security_Cheat_Sheet.html, https://arxiv.org/abs/2605.07135_

### Data Architecture Patterns

**MVP data flow**

```text
Issue title/body/config
  -> bounded prompt input
  -> LLM structured JSON
  -> local validation
  -> Markdown issue comment
```

**No persistent data store**

There should be no database. The Action should not store issue data outside GitHub. The only durable artifact is the comment in the issue. If a hosted playground is later introduced, it should be treated as a separate product surface with its own privacy model.

**Data minimization**

- Default input: title + body only.
- Optional input: last N comments.
- Do not include repository files by default.
- Do not include secrets, diffs, or code unless a future feature explicitly opts in.
- Truncate long inputs and disclose truncation in logs/comment if it affects confidence.

**Config data**

Optional config file:

```yaml
readyLabel: ready-for-dev
includeComments: false
maxComments: 0
issueTypes:
  - feature
  - bug
  - api-change
rules:
  requireAcceptanceCriteria: true
  requireActor: true
  requireErrorBehavior: true
```

For MVP, this config can be minimal or skipped. Defaults matter more than customization in first validation.

_Sources: https://docs.github.com/en/actions/reference/security/secrets, https://openai.com/business-data/, https://platform.openai.com/docs/guides/structured-outputs_

### Deployment and Operations Architecture

**MVP deployment**

- Publish an open-source Action repository.
- Tag releases, e.g. `v0.1.0`, `v1`.
- Provide copy-paste workflow YAML.
- Provide sample issue and sample report.
- Provide local test fixtures for event payloads.

**Operational model**

The user owns the workflow run in their repository. There is no hosted service to monitor, aside from the LLM provider dependency. Logs live in GitHub Actions. Costs are mostly Actions minutes plus LLM calls.

**Release safety**

Example workflows should recommend pinning to a version tag at minimum, and security-conscious users may pin to commit SHA. OWASP and CI/CD security guidance repeatedly warn about third-party Action supply-chain risks and excessive permissions.

**Observability**

MVP logs should include:

- Trigger reason
- Issue number
- Deterministic prechecks applied
- Whether LLM was called
- Rendered report length
- Comment ID created

MVP logs should not include:

- LLM API key
- Full private issue text by default
- Full LLM prompt by default

_Sources: https://docs.github.com/en/actions/sharing-automations/creating-actions/publishing-actions-in-github-marketplace, https://cheatsheetseries.owasp.org/cheatsheets/GitHub_Actions_Security_Cheat_Sheet.html, https://docs.github.com/actions/reference/encrypted-secrets_

### Architectural Decision Summary

**ADR-001: Start with GitHub Action, not GitHub App**

Decision: Use a JavaScript GitHub Action for MVP.

Rationale: fastest validation, no backend, no billing, no webhooks, no database.

Trade-off: harder monetization and multi-repo UX.

**ADR-002: Stateless architecture**

Decision: no database or hosted service.

Rationale: reduce complexity and privacy surface.

Trade-off: limited analytics and customization.

**ADR-003: Structured LLM output**

Decision: LLM returns JSON report, local code renders Markdown.

Rationale: safer, testable, less malformed output.

Trade-off: schema design and validation needed.

**ADR-004: Non-blocking comment output**

Decision: post checklist comment only.

Rationale: aligns with target segment and reduces adoption friction.

Trade-off: weaker enforcement.

**ADR-005: No codebase reading in MVP**

Decision: analyze issue text only.

Rationale: privacy, cost, simplicity.

Trade-off: less context-aware reports.

### Architectural Recommendation

Recommended MVP architecture:

- Stateless TypeScript GitHub Action
- Explicit workflow permissions
- Event parser and deterministic prechecks
- LLM structured-output analyzer
- Local schema validation
- Markdown renderer
- Issue comment adapter
- No DB, no hosted backend, no codebase scan
- Security-first handling of untrusted issue content

Confidence: high that this architecture can validate the product concept quickly. Security risk is manageable if the Action is treated as a constrained analyzer and avoids autonomous agent behavior.

## Implementation Approaches and Technology Adoption

### Web Search Analysis

Implementation research focused on GitHub's official guidance for creating JavaScript Actions, publishing Actions, version management, workflow syntax, GitHub Actions security hardening, GitHub Actions Toolkit, and OpenAI structured output implementation. The key practical finding is that the MVP can be built as a small open-source Action repository with no hosted infrastructure.

### Technology Adoption Strategies

The recommended adoption path is gradual:

1. Manual/concierge reports before code, to validate report usefulness.
2. Internal/sandbox GitHub Action to validate event trigger and comment workflow.
3. Open-source alpha Action for early users.
4. Marketplace listing only after the Action has stable docs, examples, and versioned releases.
5. GitHub App/SaaS migration only if multi-repo installation, billing, or centralized config becomes necessary.

This avoids building platform infrastructure before proving the core report is useful.

_Source: https://docs.github.com/en/actions/tutorials/create-actions/create-a-javascript-action, https://docs.github.com/en/actions/sharing-automations/creating-actions/publishing-actions-in-github-marketplace_

### Development Workflows and Tooling

Recommended Action repository structure:

```text
dev-ticket-preflight-action/
  action.yml
  package.json
  tsconfig.json
  README.md
  SECURITY.md
  src/
    action.ts
    github-context.ts
    config.ts
    prechecks.ts
    llm-client.ts
    report-schema.ts
    report-renderer.ts
    github-comments.ts
    security.ts
  test/
    fixtures/
      issue-labeled.json
      empty-issue.json
      pull-request-labeled.json
      prompt-injection-issue.json
    prechecks.test.ts
    report-renderer.test.ts
    schema.test.ts
    github-context.test.ts
```

Recommended implementation sequence:

1. Create Action metadata in `action.yml`.
2. Parse GitHub event payload and validate event type.
3. Add deterministic prechecks.
4. Define `PreflightReport` schema.
5. Build Markdown renderer.
6. Add mocked LLM client and tests.
7. Add real structured-output LLM client.
8. Add GitHub comment adapter.
9. Add sandbox integration workflow.
10. Publish `v0.1.0` alpha tag.

_Source: https://docs.github.com/en/actions/tutorials/create-actions/create-a-javascript-action, https://github.com/actions/toolkit_

### Testing and Quality Assurance

Testing should focus on correctness, safety, and output usefulness.

**Unit tests**

- `prechecks.ts`: empty issue body, too-short issue, PR skip, label mismatch
- `report-schema.ts`: valid report, malformed report, missing required fields
- `report-renderer.ts`: Markdown checklist output, escaping, length limits
- `security.ts`: truncation, redaction, prompt-injection examples

**Fixture tests**

- Realistic `issues.labeled` payload
- PR-labeled payload that should be skipped
- Issue with empty body
- Issue with malicious/prompt-injection content

**Mock integration tests**

- LLM timeout/error
- LLM refusal
- malformed structured output
- GitHub comment API failure
- duplicate run/concurrency assumptions

**Sandbox integration test**

- Create a private test repo.
- Add issue.
- Apply `ready-for-dev`.
- Verify a comment is created.
- Verify no labels/assignees/files are modified.

_Source: https://docs.github.com/en/actions/learn-github-actions/contexts, https://docs.github.com/en/rest/issues/comments, https://docs.github.com/en/actions/concepts/security/script-injections_

### Deployment and Operations Practices

GitHub Actions can be shared through a public repository and optionally published to GitHub Marketplace. GitHub's publishing docs require metadata in `action.yml` at the repository root and a release. Versioning should use SemVer tags. Example users can pin to `v0`, `v1`, or a specific SHA depending on risk tolerance.

Example consumer workflow:

```yaml
name: Dev Ticket Preflight

on:
  issues:
    types: [labeled]

permissions:
  issues: write
  contents: read

concurrency:
  group: preflight-${{ github.event.issue.number }}
  cancel-in-progress: true

jobs:
  preflight:
    if: github.event.label.name == 'ready-for-dev' && !github.event.issue.pull_request
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: your-org/dev-ticket-preflight@v0
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
```

Operational practices:

- Log only metadata, not full private issue content.
- Surface failures as Action logs, not issue comments, unless the failure is user-actionable.
- Make config optional and defaults strong.
- Provide a sample issue and sample report in README.
- Provide security/privacy docs before asking users to install on private repos.

_Source: https://docs.github.com/en/actions/sharing-automations/creating-actions/publishing-actions-in-github-marketplace, https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions, https://docs.github.com/actions/reference/encrypted-secrets_

### Team Organization and Skills

The MVP can be built by one strong TypeScript/Node developer familiar with GitHub Actions. Required skills:

- GitHub Actions workflow/event model
- TypeScript and Node package/bundling
- Octokit/GitHub REST API usage
- LLM prompt/schema design
- Secure handling of untrusted input and secrets
- Basic test automation
- Developer-facing documentation

No backend/cloud/DevOps specialist is needed for MVP unless the project moves to a hosted GitHub App.

_Source: https://docs.github.com/en/actions/tutorials/create-actions/create-a-javascript-action, https://github.com/actions/toolkit_

### Cost Optimization and Resource Management

Primary costs:

- GitHub Actions minutes in the user's repo
- LLM API calls
- Developer time

Cost controls:

- Trigger only on `ready-for-dev`.
- Deterministic prechecks before LLM calls.
- Limit issue text/comment input length.
- Do not read repository files in MVP.
- Use a cost-effective model for first pass.
- Cache nothing in MVP unless repeated reruns become expensive.

Pricing/packaging implications:

- Open-source/free public repo usage can drive trust.
- BYOK is attractive for MVP because users control LLM spend and data relationship.
- Hosted billing should wait until private repo/team usage is validated.

_Source: https://docs.github.com/en/actions/using-github-hosted-runners/about-github-hosted-runners, https://platform.openai.com/docs/guides/structured-outputs_

### Risk Assessment and Mitigation

**Implementation Risks**

- LLM output too generic
- Prompt injection from issue content
- Script injection from unsafe workflow handling
- Duplicate/noisy comments
- Private data leakage through prompts/logs
- Overbroad workflow permissions
- User setup friction

**Mitigations**

- Use structured output and local renderer.
- Treat issue content as untrusted data.
- Avoid inline shell with issue-derived values.
- Add concurrency per issue.
- Append-only comments first; update-in-place later.
- Default to title/body only.
- Document permissions and data flow clearly.
- Provide a paste/demo mode for users unwilling to install immediately.

_Source: https://docs.github.com/en/actions/concepts/security/script-injections, https://cheatsheetseries.owasp.org/cheatsheets/GitHub_Actions_Security_Cheat_Sheet.html, https://arxiv.org/abs/2605.07135_

## Technical Research Recommendations

### Implementation Roadmap

**Milestone 0: Manual validation**

- Produce 20 manual reports.
- Freeze the report structure based on user feedback.

**Milestone 1: Local Action core**

- Implement parser, prechecks, schema, renderer.
- Use mocked LLM reports.

**Milestone 2: LLM integration**

- Add structured-output API call.
- Validate and fallback on errors.

**Milestone 3: GitHub integration**

- Add comment creation.
- Test in sandbox repo.

**Milestone 4: Alpha release**

- Publish `v0.1.0`.
- Add README, example workflow, sample reports, security notes.

**Milestone 5: Early user test**

- Install in 3-5 real repos.
- Measure whether users update flagged issues.

### Technology Stack Recommendations

- TypeScript GitHub Action
- GitHub Actions Toolkit
- Octokit/GitHub REST API
- OpenAI or equivalent LLM with structured output
- Zod/JSON Schema for validation
- Markdown renderer from local trusted code
- No database
- No hosted backend
- Optional YAML config after first working default

### Skill Development Requirements

Before building, the implementer should be comfortable with:

- GitHub Actions event payloads and workflow permissions
- Secure use of `GITHUB_TOKEN` and secrets
- TypeScript testing
- Prompt/schema design for structured AI output
- CI/CD security basics

### Success Metrics and KPIs

Technical success:

- Setup under 10 minutes
- First successful run on sandbox repo
- Valid schema output in >95% of successful LLM calls
- No duplicate comments in normal label flow
- No full issue content in logs by default
- Minimal permission workflow documented

Product/validation success:

- At least 6/10 reports identify useful missing context
- At least 30% of flagged issues are updated after report
- Users prefer report/checklist over copy-paste ChatGPT for repeat usage

## Research Synthesis and Final Technical Recommendations

### Executive Summary

The recommended technical path is to build **Dev Ticket Preflight** as a small, stateless, open-source TypeScript GitHub Action. This architecture directly supports the product's validation goal: test whether users find a `ready-for-dev` preflight comment useful enough to update real GitHub Issues before implementation starts.

Starting with a GitHub App, hosted backend, database, or SaaS platform would add premature complexity. The MVP can validate the core technical and product risks with one workflow trigger, one LLM call, local schema validation, and one issue comment. The durable artifact is the GitHub issue comment; GitHub remains the system of record.

Security is the main engineering constraint. The Action processes untrusted issue text and holds permissions to comment on issues. It must therefore treat issue title/body/comment content as data, never executable instruction. The model should only produce structured analysis; trusted local code should decide what to render and post.

### Table of Contents

1. Technical Research Scope Confirmation
2. Technology Stack Analysis
3. Integration Patterns Analysis
4. Architectural Patterns and Design
5. Implementation Approaches and Technology Adoption
6. Research Synthesis and Final Technical Recommendations
7. Implementation Roadmap
8. Risk Assessment
9. Source Verification and Limitations

### Key Technical Findings

- **GitHub Action-first is the right MVP path.** It avoids backend, webhooks, billing, database, and operational overhead.
- **TypeScript/JavaScript Action is the best stack.** GitHub's Actions Toolkit and Octokit ecosystem fit the workflow directly.
- **The trigger is straightforward.** Use `issues.labeled`, then filter `github.event.label.name == 'ready-for-dev'`.
- **The minimal permission set is small.** Use `issues: write`; add `contents: read` only if reading repo config/prompts.
- **No database is needed.** The issue comment is the durable artifact.
- **Structured LLM output is strongly preferred.** The LLM should return JSON; local code should validate and render Markdown.
- **Issue content is untrusted input.** Never interpolate it into shell scripts or allow it to drive GitHub mutations.
- **GitHub App is a later-stage option.** It becomes useful for multi-repo install, billing, centralized config, and hosted UX.

### Final Architecture Recommendation

Recommended MVP pipeline:

```text
GitHub issue receives ready-for-dev label
  -> GitHub Actions workflow starts
  -> Action validates event and skips PRs
  -> Action reads issue title/body
  -> deterministic prechecks run
  -> LLM returns structured PreflightReport JSON
  -> local schema validation
  -> trusted Markdown renderer creates checklist comment
  -> GitHub REST API posts issue comment
```

Recommended module boundaries:

```text
src/
  action.ts
  github-context.ts
  config.ts
  prechecks.ts
  llm-client.ts
  report-schema.ts
  report-renderer.ts
  github-comments.ts
  security.ts
```

The core rule: **only `github-comments.ts` writes to GitHub, and it receives already-rendered trusted Markdown.**

### Implementation Roadmap

**Milestone 0: Manual validation**

- Produce 20 manual reports from real GitHub Issues.
- Freeze first report format from user feedback.

**Milestone 1: Local core**

- Implement event parser, deterministic prechecks, schema, renderer.
- Use mocked LLM output.

**Milestone 2: LLM integration**

- Add structured-output LLM client.
- Validate model response.
- Add fallback/error handling.

**Milestone 3: GitHub integration**

- Add issue comment creation.
- Test with sandbox repo and `ready-for-dev` label.

**Milestone 4: Alpha release**

- Publish `v0.1.0`.
- Add README, sample workflow, sample issue, sample report, and security notes.

**Milestone 5: Pilot**

- Install in 3-5 real repos.
- Measure whether reports cause issue updates.

### Recommended Consumer Workflow

```yaml
name: Dev Ticket Preflight

on:
  issues:
    types: [labeled]

permissions:
  issues: write
  contents: read

concurrency:
  group: preflight-${{ github.event.issue.number }}
  cancel-in-progress: true

jobs:
  preflight:
    if: github.event.label.name == 'ready-for-dev' && !github.event.issue.pull_request
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: your-org/dev-ticket-preflight@v0
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
```

### Risk Assessment

**High risks**

- Prompt injection from issue content
- Script injection if issue text is interpolated into shell
- Private issue data sent to LLM without clear user understanding
- Generic LLM output that users ignore
- Overbroad GitHub permissions

**Mitigations**

- Treat issue content as untrusted.
- Avoid shell for issue-derived values.
- Use least-privilege permissions.
- Default to title/body only.
- Validate structured output locally.
- Render Markdown from trusted code.
- Document exactly what data is sent to the LLM.
- Avoid label/assignee/file mutation in MVP.

### Technical Go/No-Go Recommendation

**Go for a GitHub Action prototype.**

The technical risk is manageable and the MVP is small enough to build without infrastructure. The main unknown is not feasibility; it is report usefulness. Therefore, the correct next step is not more architecture. It is either:

1. Manual preflight validation on real issues, or
2. A minimal Action prototype if the user wants to test the workflow mechanics immediately.

Do not build a GitHub App until at least one of these becomes true:

- users want multi-repo installation,
- users want hosted billing,
- users need centralized config,
- users need usage/history tracking,
- Action setup becomes the main adoption blocker.

### Source Verification and Limitations

Primary technical sources used:

- GitHub Actions event, workflow syntax, contexts, concurrency, security, secrets, and publishing docs
- GitHub REST API issue comments docs
- GitHub Actions Toolkit
- OpenAI Structured Outputs and business data references
- OWASP GitHub Actions Security Cheat Sheet
- GitHub security hardening references
- Agentic workflow injection research

Limitations:

- LLM provider choice still needs cost and quality testing.
- GitHub Models was not selected or rejected definitively; it needs separate validation if BYOK/OpenAI is undesirable.
- Private-repo trust cannot be solved by docs alone; it needs target-user testing.
- Report usefulness must be validated with real issues before committing to PRD/build scope.

### Final Technical Conclusion

The MVP should be a **minimal, secure, stateless GitHub Action**. Keep it narrow, readable, and auditable. The Action should do one job well: when a GitHub Issue is labeled `ready-for-dev`, post a concise checklist that helps the owner decide whether the issue is clear enough to build.

<!-- Content will be appended sequentially through research workflow steps -->
