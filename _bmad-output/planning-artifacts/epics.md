---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-serminal-2026-06-03/prd.md
  - _bmad-output/planning-artifacts/architecture.md
workflowType: 'epics-and-stories'
lastStep: 4
status: 'complete'
completedAt: '2026-06-03'
project_name: 'serminal'
user_name: 'Nguyenhieu'
date: '2026-06-03'
---

# serminal - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for serminal, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: The system must start a preflight run when a GitHub Issue receives the Ready Label.

FR2: The system must not produce a Preflight Report for pull requests in MVP.

FR3: The system must avoid duplicate Preflight Reports caused by overlapping runs for the same Issue.

FR4: The system must analyze the Issue title and body as the default source of context.

FR5: The system must identify missing or weak context across common readiness categories, including actor/user role, expected behavior, acceptance criteria, error/failure behavior, permission/security implications when relevant, edge cases, and non-functional constraints.

FR6: The system must assign one conservative Preflight Status based on available context: `Ready`, `Needs Clarification`, or `High Risk`, without blaming the Issue Owner.

FR7: The system must post the Preflight Report as a GitHub Issue comment.

FR8: The Preflight Report must include status, missing context, risk explanation, suggested questions, and Markdown checklist items.

FR9: The system may include Draft Acceptance Criteria only when the Issue provides enough context; generated criteria must be framed as editable suggestions and must be testable.

FR10: The system must keep the Preflight Report concise, targeting 5-10 checklist/suggestion lines unless the Issue is unusually complex, and avoiding generic educational prose.

FR11: The system must not prevent the team from starting development and must not remove labels, fail required checks, assign/unassign users, close/reopen issues, or edit issues.

FR12: The system must evaluate Issue clarity rather than individual performance, avoiding people scoring, dashboards, or blame language.

FR13: The product must provide a documented GitHub Actions workflow example that users can copy under `.github/workflows/`, including required permissions, Ready Label trigger, and required secrets.

FR14: The MVP must support configuring the LLM API key through GitHub Actions secrets or action input, must not print the API key in logs, and must produce a clear failure message when the key is missing.

FR15: The product must document what Issue data is sent to the LLM, including that Issue title/body are sent for analysis, repository code is not read in MVP, and Issue comments are not included by default.

### NonFunctional Requirements

NFR1: Security - Issue title/body/comment content must be treated as untrusted input, and the system must not interpolate Issue content into shell commands.

NFR2: Privacy - The MVP must minimize data sent to the LLM and document data handling before private-repo use.

NFR3: Reliability - A failed LLM call or malformed model response must not mutate the Issue beyond a clear failure path in logs.

NFR4: Maintainability - The Action must separate event parsing, readiness checks, LLM interaction, schema validation, Markdown rendering, and GitHub comment creation.

NFR5: Observability - Logs must include trigger reason, Issue number, whether deterministic prechecks ran, whether the LLM was called, and whether a comment was created; logs must not include full private Issue content by default.

NFR6: Cost Control - The system must avoid unnecessary LLM calls for deterministic low-information cases.

### Additional Requirements

- Use GitHub official `actions/typescript-action` template as the project foundation; Epic 1 Story 1 should initialize or adapt this starter.
- Implement as a stateless TypeScript GitHub Action, not a GitHub App, hosted SaaS, backend, database, or dashboard.
- Prefer the current GitHub-supported JavaScript Action runtime and verify Node 24 support at implementation time.
- Use `issues.labeled` as the trigger and filter by configured Ready Label, defaulting to `ready-for-dev`.
- Use title/body only as default LLM context; exclude repository files, diffs, linked PRs, and Issue comments from MVP.
- Use deterministic prechecks before LLM calls for missing issue, pull request payload, label mismatch, empty body, and short body.
- Use OpenAI Structured Outputs or equivalent structured JSON mode for LLM response generation.
- Validate all model output locally against the `PreflightReport` schema before rendering.
- Render Markdown only from validated report data and never include raw prompts or raw LLM JSON in comments.
- Isolate all GitHub write behavior in `src/github-comments.ts`; no other module may mutate GitHub state.
- Allow only one GitHub write in MVP: create an Issue comment.
- Do not mutate labels, assignees, issue body, issue state, files, checks, PRs, or workflow state.
- Use least-privilege permissions: `issues: write`; include `contents: read` only if repository config or prompt files are read.
- Use GitHub Actions `GITHUB_TOKEN` for GitHub API access and GitHub Actions secrets for the LLM API key.
- Keep Action inputs kebab-case: `github-token`, `openai-api-key`, `ready-label`.
- Remove or defer `include-comments` unless Issue comments are explicitly added as an opt-in feature with cap and data-handling documentation.
- Organize source modules under `src/`: `action.ts`, `github-context.ts`, `config.ts`, `prechecks.ts`, `llm-client.ts`, `report-schema.ts`, `report-renderer.ts`, `github-comments.ts`, and `security.ts`.
- Use central tests under `__tests__/` and fixtures under `__tests__/fixtures/`.
- Add fixtures for labeled issue, other label, empty issue, short issue, pull request labeled payload, prompt injection issue, valid preflight report, and invalid preflight report.
- Provide documentation: `README.md`, `SECURITY.md`, `docs/data-handling.md`, `docs/permissions.md`, `docs/troubleshooting.md`, and `docs/report-format.md`.
- Provide examples: workflow YAML, sample feature issue, sample bug issue, and sample preflight report.
- CI should verify TypeScript compile, unit tests, lint/format, bundled `dist/index.js` freshness, and no obvious secret leakage in fixtures/examples.
- Bundle TypeScript source into `dist/index.js` and commit it for Action release.
- Publish versioned release tags such as `v0.1.0` and maintain a moving `v0` tag for early users.
- Use safe logging only: issue number, trigger label, precheck/LLM called state, report status, and comment ID after successful post.
- Do not log full Issue body, full prompt, LLM API key, raw private Issue comments, or raw LLM response if it may include private content.
- Treat Issue content as untrusted input and include prompt-injection-oriented tests.
- Failure behavior must be explicit in stories/tests for missing API key, LLM timeout/error, invalid structured output, and GitHub comment API failure.
- Prototype comment lifecycle is append-only; update-in-place comments are deferred unless PRD/architecture is updated.

### UX Design Requirements

No UX Design document was found. MVP has no separate UI; the user experience is GitHub Issues and the Markdown Preflight Report comment.

### FR Coverage Map

FR1: Epic 1 - Trigger Action khi Issue nhận Ready Label.

FR2: Epic 1 - Skip pull requests.

FR3: Epic 1 - Tránh duplicate concurrent runs.

FR4: Epic 2 - Phân tích Issue title/body.

FR5: Epic 2 - Detect missing context categories.

FR6: Epic 2 - Tạo conservative Preflight Status.

FR7: Epic 3 - Post Preflight Report dưới dạng GitHub comment.

FR8: Epic 3 - Include required report sections.

FR9: Epic 3 - Generate Draft Acceptance Criteria khi đủ context.

FR10: Epic 3 - Giữ report concise.

FR11: Epic 3 - Không block development workflow.

FR12: Epic 3 - Không people analytics/blame language.

FR13: Epic 1 và Epic 4 - Workflow setup ban đầu và docs hoàn chỉnh.

FR14: Epic 1 và Epic 4 - API key config trong Action và setup docs/failure behavior.

FR15: Epic 4 - Data handling documentation.

## Epic List

### Epic 1: Installable Ready-Label Action

Người dùng có thể cài Action vào repo, cấu hình secret/label, và trigger run khi một GitHub Issue được đánh dấu ready.

**FRs covered:** FR1, FR2, FR3, FR13, FR14

**User value:** Solo founder/startup nhỏ có thể copy workflow, thêm secret, gắn `ready-for-dev`, và thấy Action chạy đúng ngữ cảnh mà không ảnh hưởng PR hoặc tạo duplicate run ngoài ý muốn.

**Implementation notes:** Khởi tạo từ `actions/typescript-action`; thiết lập `action.yml`, config inputs, GitHub event parsing, Ready Label filter, PR skip, concurrency guidance, basic CI.

### Epic 2: Issue Readiness Analysis

Người dùng nhận được phân tích readiness dựa trên Issue title/body, với status bảo thủ và missing-context detection hữu ích.

**FRs covered:** FR4, FR5, FR6

**User value:** Issue owner biết ticket thiếu gì trước khi giao cho dev, contractor hoặc AI coding agent.

**Implementation notes:** Deterministic prechecks, bounded LLM input, structured output, `PreflightReport` schema, validation, prompt-injection-safe handling, cost-control behavior.

### Epic 3: Actionable Preflight Report Comment

Người dùng nhận một GitHub Issue comment ngắn, dễ đọc, có suggested questions/checklist/acceptance criteria khi đủ context.

**FRs covered:** FR7, FR8, FR9, FR10, FR11, FR12

**User value:** Team có feedback trực tiếp trong Issue mà không bị block workflow, không bị đánh giá cá nhân, không bị tool tự mutate repo state.

**Implementation notes:** Markdown renderer, GitHub comment adapter, append-only comment lifecycle, no labels/checks/assignees/files mutation, concise report rules, safe language.

### Epic 4: MVP Trust, Documentation, and Release Readiness

Người dùng có đủ tài liệu để hiểu dữ liệu nào gửi ra ngoài, quyền nào cần cấp, cách debug lỗi setup, và cách dùng Action versioned release.

**FRs covered:** FR13, FR14, FR15

**User value:** Người dùng thử trong sandbox/private repo có thể tự tin setup, biết quyền và data handling, và có sample issue/report để đánh giá.

**Implementation notes:** README, workflow example, docs/data-handling, docs/permissions, docs/troubleshooting, docs/report-format, examples, release tagging, `dist/index.js` freshness checks.

## Epic 1: Installable Ready-Label Action

Người dùng có thể cài Action vào repo, cấu hình secret/label, và trigger run khi một GitHub Issue được đánh dấu ready.

### Story 1.1: Set Up Initial Project from Starter Template

As a repo maintainer,
I want the project set up from the official TypeScript GitHub Action starter template,
So that I can add Dev Ticket Preflight to a repository through a normal GitHub Actions workflow.

**Acceptance Criteria:**

**Given** the project repository is created from or aligned with `actions/typescript-action`
**When** the maintainer installs dependencies and performs initial configuration
**Then** the repository has the starter project structure, package metadata, TypeScript configuration, test setup, and Action metadata needed for implementation.

**Given** the starter setup is complete
**When** the maintainer runs the project validation commands
**Then** TypeScript compile, unit test command, and bundle output are available
**And** `action.yml` exposes a runnable JavaScript Action entrypoint.

**Given** the Action is packaged for GitHub Actions usage
**When** a consumer references the Action in a workflow
**Then** the Action can run through the bundled `dist/index.js` entrypoint
**And** the repository includes CI coverage for build/test validation.

### Story 1.2: Configure Action Inputs and Secrets

As a repo maintainer,
I want to configure the GitHub token, LLM API key, and Ready Label,
So that the Action can run securely in my repository without exposing secrets.

**Acceptance Criteria:**

**Given** the workflow passes `github-token`, `openai-api-key`, and optionally `ready-label`
**When** the Action starts
**Then** it reads and validates the required inputs
**And** `ready-label` defaults to `ready-for-dev` when omitted.

**Given** `openai-api-key` is missing
**When** the Action starts
**Then** the Action fails with a clear setup error
**And** the API key value is never printed in logs.

**Given** the Action logs configuration state
**When** logs are inspected
**Then** logs may include whether required inputs are present
**And** logs must not include secret values or full private Issue content.

### Story 1.3: Trigger Only on Ready-Labeled Issues

As an issue owner,
I want the Action to run only when I mark an Issue ready for development,
So that draft Issues do not receive premature preflight reports.

**Acceptance Criteria:**

**Given** a GitHub Issue receives the configured Ready Label
**When** the workflow runs on `issues.labeled`
**Then** the Action recognizes the event as eligible for preflight
**And** it extracts issue number, title, body, label name, and repository context.

**Given** a GitHub Issue receives a different label
**When** the workflow runs
**Then** the Action exits without posting a report
**And** logs the label mismatch without treating it as an error.

**Given** the workflow is configured with a custom `ready-label`
**When** an Issue receives that custom label
**Then** the Action treats it as the Ready Label
**And** the default `ready-for-dev` is not required.

### Story 1.4: Ignore Pull Requests and Unsupported Payloads

As a repo maintainer,
I want pull requests and unsupported payloads to be ignored,
So that the MVP only evaluates GitHub Issues.

**Acceptance Criteria:**

**Given** a pull request receives the Ready Label
**When** the workflow runs
**Then** the Action detects `issue.pull_request` and skips processing
**And** no Preflight Report comment is posted.

**Given** the event payload is missing required issue or label fields
**When** the Action parses the event
**Then** it exits with a clear non-processing reason where safe
**And** it does not mutate labels, assignees, issue body, checks, files, or issue state.

### Story 1.5: Prevent Obvious Duplicate Concurrent Runs

As a repo maintainer,
I want overlapping Ready Label runs to avoid duplicate reports where practical,
So that users do not lose trust from repeated comments.

**Acceptance Criteria:**

**Given** the workflow example is installed
**When** the same Issue triggers rapid repeated labeled events
**Then** the workflow uses GitHub Actions concurrency guidance keyed by issue identity where available
**And** duplicate prevention limitations are documented.

**Given** duplicate prevention cannot fully guarantee one comment in every edge case
**When** setup docs describe the behavior
**Then** the risk is explicitly documented
**And** the implementation still avoids intentional duplicate posting paths inside one Action run.

## Epic 2: Issue Readiness Analysis

Người dùng nhận được phân tích readiness dựa trên Issue title/body, với status bảo thủ và missing-context detection hữu ích.

### Story 2.1: Run Deterministic Prechecks Before LLM Analysis

As an issue owner,
I want obviously incomplete issues to be handled without unnecessary AI analysis,
So that the Action gives useful minimum-context feedback while controlling cost.

**Acceptance Criteria:**

**Given** an eligible Issue has an empty body
**When** the Action runs prechecks
**Then** it returns a deterministic `High Risk` or equivalent insufficient-context report
**And** it does not call the LLM.

**Given** an eligible Issue body is below the minimum useful length
**When** the Action runs prechecks
**Then** it returns a deterministic report asking for basic context
**And** it does not pretend to understand the requested work.

**Given** an eligible Issue has enough title/body content for analysis
**When** prechecks complete
**Then** the Action allows LLM analysis to continue
**And** logs that prechecks ran without logging the full Issue body.

### Story 2.2: Build Bounded LLM Input from Issue Title and Body

As an issue owner,
I want the Action to analyze only the relevant Issue title/body,
So that private repo data exposure is minimized.

**Acceptance Criteria:**

**Given** an eligible Issue has title and body content
**When** the Action prepares analysis input
**Then** it includes the Issue title and bounded Issue body
**And** it excludes repository files, diffs, linked PRs, and Issue comments.

**Given** the Issue body exceeds the configured input bound
**When** the Action prepares analysis input
**Then** it truncates the body safely
**And** logs only that truncation occurred, not the truncated content.

**Given** the Issue content includes prompt-injection-like instructions
**When** the Action prepares analysis input
**Then** the content is treated as untrusted task data
**And** it cannot override system behavior or GitHub mutation guardrails.

### Story 2.3: Produce Structured Preflight Report Output

As an issue owner,
I want the readiness analysis to return a consistent structured report,
So that the Action can render reliable GitHub comments.

**Acceptance Criteria:**

**Given** the LLM analysis is called
**When** the provider returns a response
**Then** the Action receives structured output matching the expected report contract
**And** the raw provider result is not rendered directly.

**Given** the analysis identifies missing context
**When** the structured report is created
**Then** it includes missing context, risk explanation, suggested questions, confidence, and evidence fields
**And** the report focuses on the work artifact rather than the author.

**Given** the issue has enough context for suggested acceptance criteria
**When** the structured report is created
**Then** draft acceptance criteria may be included
**And** they are framed as editable suggestions.

### Story 2.4: Validate and Normalize Preflight Report Schema

As a repo maintainer,
I want model output validated before use,
So that malformed or unsafe responses cannot leak into GitHub comments.

**Acceptance Criteria:**

**Given** the LLM returns a valid structured report
**When** schema validation runs
**Then** the Action normalizes it into `PreflightReport`
**And** downstream modules receive only validated report data.

**Given** the LLM returns malformed or incomplete output
**When** schema validation runs
**Then** the Action fails with a clear log message or uses only a safe deterministic fallback
**And** no misleading Preflight Report is posted.

**Given** the model output includes unexpected fields that could imply GitHub mutations
**When** schema validation runs
**Then** those fields are rejected or ignored
**And** labels, assignees, files, checks, PRs, and issue state remain unchanged.

### Story 2.5: Assign Conservative Preflight Status

As an issue owner,
I want a conservative readiness status,
So that vague Issues are not incorrectly treated as ready for implementation.

**Acceptance Criteria:**

**Given** no material missing context is detected
**When** the report is normalized
**Then** status is `ready`.

**Given** the Issue is understandable but lacks important details
**When** the report is normalized
**Then** status is `needs_clarification`.

**Given** the Issue is too vague to safely implement
**When** the report is normalized
**Then** status is `high_risk`.

**Given** any status is rendered later
**When** the report language is inspected
**Then** it does not blame or score the Issue Owner.

## Epic 3: Actionable Preflight Report Comment

Người dùng nhận một GitHub Issue comment ngắn, dễ đọc, có suggested questions/checklist/acceptance criteria khi đủ context.

### Story 3.1: Render Canonical Markdown Preflight Report

As an issue owner,
I want the preflight result rendered as a readable GitHub comment,
So that I can quickly understand what needs clarification.

**Acceptance Criteria:**

**Given** a validated `PreflightReport`
**When** the renderer creates Markdown
**Then** the comment includes a recognizable `Dev Ticket Preflight` heading
**And** the rendered status uses user-facing labels: `Ready`, `Needs Clarification`, or `High Risk`.

**Given** the report contains missing context items
**When** Markdown is rendered
**Then** the report includes a `Missing Context` section
**And** items are concise and actionable.

**Given** no material missing context is found
**When** Markdown is rendered
**Then** the report explicitly says no material missing context was found
**And** it does not invent unnecessary checklist items.

### Story 3.2: Render Suggested Questions and Checklist Items

As an issue owner,
I want suggested questions and checklist items in the report,
So that I can update the Issue without needing a separate PM process.

**Acceptance Criteria:**

**Given** a validated report includes suggested questions
**When** Markdown is rendered
**Then** the report includes a `Suggested Questions` section
**And** questions are rendered as Markdown task-list items where appropriate.

**Given** a validated report includes risk explanation
**When** Markdown is rendered
**Then** the report includes a `Why This Matters` section
**And** the explanation stays focused on implementation risk, not the author.

**Given** the rendered report is inspected
**When** it contains checklist items
**Then** the total suggestion/checklist content targets 5-10 lines unless the Issue is unusually complex
**And** generic educational prose is omitted.

### Story 3.3: Render Draft Acceptance Criteria Only When Safe

As an issue owner,
I want draft acceptance criteria only when there is enough context,
So that the Action does not produce false precision from vague tickets.

**Acceptance Criteria:**

**Given** the validated report includes safe draft acceptance criteria
**When** Markdown is rendered
**Then** the report includes a `Draft Acceptance Criteria` section
**And** each criterion is testable and framed as editable.

**Given** core context is missing
**When** Markdown is rendered
**Then** the `Draft Acceptance Criteria` section is omitted
**And** the report prioritizes questions needed to clarify the Issue.

**Given** acceptance criteria are rendered
**When** the output is reviewed
**Then** they do not imply final product decisions beyond the Issue context
**And** they do not introduce GitHub mutations or workflow gates.

### Story 3.4: Post Report as Append-Only GitHub Issue Comment

As a repo maintainer,
I want the Action to post the report directly in the GitHub Issue,
So that users can act on feedback without opening another tool.

**Acceptance Criteria:**

**Given** a Markdown Preflight Report is generated for an eligible Issue
**When** the Action posts the report
**Then** a GitHub Issue comment is created on the triggering Issue
**And** the comment ID is logged after success.

**Given** the comment API call fails
**When** the Action handles the failure
**Then** it fails with a clear log message
**And** no fallback mutation is attempted.

**Given** the prototype runs multiple times on the same Issue
**When** each run succeeds
**Then** comments are append-only
**And** update-in-place behavior is not required for MVP.

### Story 3.5: Enforce Non-Blocking and No-People-Analytics Guardrails

As a small team lead,
I want the Action to provide feedback without enforcing process or judging people,
So that the team can adopt it without workflow friction.

**Acceptance Criteria:**

**Given** any preflight run completes
**When** GitHub state is inspected
**Then** the Action has not removed labels, changed assignees, edited issue body, closed/reopened issues, written files, or created required checks.

**Given** the report language is inspected
**When** the Issue has low readiness
**Then** the report describes missing context in the work artifact
**And** it does not blame, score, or name people as causes of readiness problems.

**Given** model output includes people-scoring or mutation suggestions
**When** validation/rendering occurs
**Then** those suggestions are rejected, ignored, or not rendered
**And** the final comment remains non-blocking.

## Epic 4: MVP Trust, Documentation, and Release Readiness

Người dùng có đủ tài liệu để hiểu dữ liệu nào gửi ra ngoài, quyền nào cần cấp, cách debug lỗi setup, và cách dùng Action versioned release.

### Story 4.1: Provide Copy-Paste Workflow Setup Documentation

As a repo maintainer,
I want a copy-paste GitHub Actions workflow example,
So that I can install Dev Ticket Preflight without guessing the setup.

**Acceptance Criteria:**

**Given** a user opens the README or example workflow
**When** they copy the workflow into `.github/workflows/`
**Then** it includes the `issues.labeled` trigger
**And** it shows required permissions, Action usage, `github-token`, `openai-api-key`, and optional `ready-label`.

**Given** the workflow example is reviewed
**When** required secrets are described
**Then** the docs explain how to configure the LLM API key as a GitHub Actions secret
**And** they do not ask users to hardcode secrets.

**Given** the example workflow includes permissions
**When** permissions are inspected
**Then** `issues: write` is included
**And** `contents: read` is included only if required by the implemented Action.

### Story 4.2: Document Data Handling and Privacy Boundaries

As a private-repo maintainer,
I want clear data-handling documentation,
So that I can decide whether the Action is acceptable for my repository.

**Acceptance Criteria:**

**Given** a user reads `docs/data-handling.md` or README data section
**When** they review what data is sent to the LLM
**Then** the docs state that Issue title/body are sent for analysis
**And** repository code, diffs, linked PRs, and Issue comments are not read in MVP.

**Given** Issue comments are not included by default
**When** the docs describe context sources
**Then** they explicitly state comments are excluded
**And** any future include-comments behavior is marked as deferred or opt-in only.

**Given** private repo use is considered
**When** the docs describe privacy limits
**Then** they explain that private Issue content may be sent to the configured LLM provider
**And** users are directed to their provider's data policy.

### Story 4.3: Document Permissions, Safety Guardrails, and Non-Blocking Behavior

As a small team lead,
I want to understand what the Action can and cannot change,
So that I can adopt it without fearing workflow disruption.

**Acceptance Criteria:**

**Given** a user reads `docs/permissions.md`
**When** permissions are described
**Then** each requested GitHub permission has a reason
**And** unnecessary permissions are not recommended.

**Given** a user reads safety documentation
**When** MVP guardrails are described
**Then** the docs state that the Action does not remove labels, assign users, edit issues, close/reopen issues, write files, or create required checks.

**Given** a user reads report behavior docs
**When** non-blocking behavior is described
**Then** the docs explain that Preflight Reports are advisory comments
**And** development can still proceed.

### Story 4.4: Provide Troubleshooting and Failure Behavior Documentation

As a repo maintainer,
I want clear troubleshooting guidance,
So that I can fix setup or provider errors quickly.

**Acceptance Criteria:**

**Given** `openai-api-key` is missing
**When** a user checks troubleshooting docs
**Then** they can identify the missing secret problem
**And** the docs show the expected fix.

**Given** the LLM call fails or times out
**When** troubleshooting docs are reviewed
**Then** they explain the likely causes
**And** they state that no misleading report should be posted.

**Given** GitHub comment creation fails
**When** troubleshooting docs are reviewed
**Then** they explain likely permission/setup causes
**And** they reference required `issues: write` permission.

### Story 4.5: Prepare Examples and Release Validation

As an evaluating user,
I want examples and release-ready validation,
So that I can test the Action and trust the published version.

**Acceptance Criteria:**

**Given** the repository includes examples
**When** a user opens `examples/`
**Then** they can find a sample workflow, feature issue, bug issue, and preflight report
**And** the examples do not contain real secrets.

**Given** the Action is prepared for release
**When** CI runs
**Then** it verifies TypeScript compile, tests, lint/format, and bundled `dist/index.js` freshness
**And** it checks fixtures/examples for obvious secret leakage.

**Given** a release is published
**When** users reference the Action
**Then** docs explain version tags such as `v0.1.0` and moving `v0`
**And** users understand the tradeoff between exact tags and moving tags.
