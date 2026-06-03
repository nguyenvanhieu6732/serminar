---
title: "Dev Ticket Preflight GitHub Action MVP"
status: "draft"
created: "2026-06-03"
updated: "2026-06-03"
---

# PRD: Dev Ticket Preflight GitHub Action MVP

## 0. Document Purpose

This PRD defines the validation MVP for **Dev Ticket Preflight**, a GitHub-native readiness assistant that helps solo founders, indie hackers, and small startup teams check whether a GitHub Issue is clear enough before development starts. It is intended for the product owner, implementation agent, architecture workflow, and downstream story-creation workflow. Technical implementation details are summarized in `addendum.md`; this PRD focuses on product behavior, requirements, boundaries, and validation metrics.

## 1. Vision

Dev Ticket Preflight helps lightweight GitHub-native teams avoid building from vague issues. When a GitHub Issue is marked `ready-for-dev`, the product posts a concise preflight report that identifies missing context, explains likely delivery risk, and gives the issue owner a checklist of questions or acceptance criteria to resolve before work begins.

The product matters because solo founders and small teams often move directly from idea to implementation without a dedicated PM, BA, or QA layer. That speed is useful until a vague issue is handed to a developer, contractor, collaborator, or AI coding agent and produces rework. Dev Ticket Preflight adds a small readiness ritual without forcing a new project-management system.

The MVP should prove one core behavior: when users receive a useful preflight checklist inside a GitHub Issue, they update the issue before development starts.

## 2. Target User

### 2.1 Jobs To Be Done

- When I mark an issue ready for development, I want a quick second-pass clarity check so I do not hand vague work to a developer, contractor, or AI coding agent.
- When I write a feature or bug issue quickly, I want missing context surfaced as concrete questions so I can fix the issue without writing a full PRD.
- When I manage a small repo without Jira or a PM process, I want a lightweight "definition of ready" ritual that lives inside GitHub.
- When I use AI coding tools, I want the task contract to be clear enough that the agent is less likely to build the wrong thing.

### 2.2 Non-Users for MVP

- Enterprise Jira-first teams that require workflow gates, approvals, dashboards, or compliance reporting.
- QA organizations looking for full test-management generation or Xray/Zephyr-style workflows.
- Teams that need full spec-driven development platforms.
- Managers looking for team performance analytics or people scoring.

### 2.3 Key User Journeys

- **UJ-1. Alex checks a feature issue before handing it to an AI coding agent.**
  - **Persona + context:** Alex is a solo technical founder using GitHub Issues to manage product work and AI coding tools to implement features.
  - **Entry state:** Alex has a GitHub Issue describing a feature and applies the `ready-for-dev` label.
  - **Path:** The Action runs automatically, reads the issue title/body, performs readiness checks, and posts a preflight comment.
  - **Climax:** Alex sees that the issue is missing acceptance criteria, error behavior, and role/permission details.
  - **Resolution:** Alex updates the issue before asking an AI coding agent to implement it.
  - **Edge case:** If the issue body is empty or too short, the report should avoid pretending to understand the feature and instead ask for minimum required context.

- **UJ-2. Mina prevents a small startup ticket from becoming rework.**
  - **Persona + context:** Mina is a founder/dev lead in a tiny startup using GitHub Issues instead of Jira.
  - **Entry state:** A teammate labels a bug or feature issue `ready-for-dev`.
  - **Path:** Dev Ticket Preflight posts a checklist comment that identifies ambiguous expected behavior and missing testable acceptance criteria.
  - **Climax:** Mina realizes the developer would likely build only the happy path.
  - **Resolution:** Mina answers the suggested questions in the issue and leaves the label in place.

- **UJ-3. Sam tests whether the tool is worth installing.**
  - **Persona + context:** Sam is an indie hacker evaluating whether this Action is better than copy-pasting an issue into ChatGPT.
  - **Entry state:** Sam installs the Action in a sandbox repo and labels one real issue `ready-for-dev`.
  - **Path:** The Action comments a short, readable report without mutating labels, assignees, files, or project state.
  - **Climax:** Sam sees one missing context item they had not considered.
  - **Resolution:** Sam keeps the Action enabled for more issues.

## 3. Glossary

- **Dev Ticket Preflight** - The product defined by this PRD.
- **Issue** - A GitHub Issue being evaluated for development readiness. Pull requests are not Issues for MVP behavior, even though GitHub APIs share comment endpoints.
- **Ready Label** - The GitHub label that triggers evaluation. Default: `ready-for-dev`.
- **Preflight Report** - The GitHub Issue comment produced by Dev Ticket Preflight.
- **Preflight Status** - The report status: `Ready`, `Needs Clarification`, or `High Risk`.
- **Missing Context** - Information absent from the Issue that may cause implementation or testing errors.
- **Suggested Question** - A concrete question the Issue owner can answer to improve readiness.
- **Draft Acceptance Criteria** - Suggested pass/fail criteria generated only when enough context exists.
- **Checklist Item** - A Markdown task-list item inside the Preflight Report.
- **Issue Owner** - The person responsible for clarifying or updating the Issue before development starts.
- **AI Coding Agent** - Any AI tool or agent used to implement work from the Issue.

## 4. Features

### 4.1 Ready Label Trigger

**Description:** Dev Ticket Preflight runs when an Issue receives the Ready Label. The MVP uses `ready-for-dev` as the default label. The product does not run on every Issue creation because users may still be drafting. Realizes UJ-1, UJ-2, UJ-3.

**Functional Requirements:**

#### FR-1: Trigger on Ready Label

The system must start a preflight run when a GitHub Issue receives the Ready Label.

**Consequences (testable):**

- Applying `ready-for-dev` to an Issue starts one preflight run.
- Applying any other label does not produce a Preflight Report.
- The Ready Label value is configurable only if repository configuration is included in MVP; otherwise it defaults to `ready-for-dev`. [ASSUMPTION: MVP uses the fixed default first.]

#### FR-2: Skip Pull Requests

The system must not produce a Preflight Report for pull requests in MVP.

**Consequences (testable):**

- A labeled pull request does not receive a Preflight Report.
- The run exits without mutating pull request state.

#### FR-3: Prevent Duplicate Concurrent Runs

The system must avoid duplicate Preflight Reports caused by overlapping runs for the same Issue.

**Consequences (testable):**

- Rapid repeated labeling does not create multiple simultaneous comments for the same Issue.
- If duplicate prevention cannot fully guarantee this in MVP, the risk is documented. [ASSUMPTION]

### 4.2 Issue Readiness Analysis

**Description:** Dev Ticket Preflight evaluates the Issue title/body and determines whether the Issue appears ready for implementation. The analysis prioritizes missing-context detection over generating polished requirements. Realizes UJ-1 and UJ-2.

**Functional Requirements:**

#### FR-4: Analyze Issue Title and Body

The system must analyze the Issue title and body as the default source of context.

**Consequences (testable):**

- An Issue with a meaningful title/body receives a context-specific Preflight Report.
- An empty or very short Issue body receives a minimal report asking for basic context.
- The system does not read repository code files in MVP.

#### FR-5: Detect Missing Context Categories

The system must identify missing or weak context across common readiness categories.

**Consequences (testable):**

- The report can flag missing actor/user role.
- The report can flag missing expected behavior.
- The report can flag missing acceptance criteria.
- The report can flag missing error/failure behavior.
- The report can flag missing permission/security implications when relevant.
- The report can flag missing edge cases or non-functional constraints when relevant.

#### FR-6: Produce Conservative Status

The system must assign one Preflight Status based on available context.

**Consequences (testable):**

- `Ready` is used only when no material missing context is detected.
- `Needs Clarification` is used when the Issue is understandable but lacks details.
- `High Risk` is used when the Issue is too vague to safely implement.
- The status wording must not blame the Issue Owner.

### 4.3 Preflight Report Comment

**Description:** Dev Ticket Preflight posts one GitHub Issue comment with a concise report. The report is actionable, non-blocking, and readable inside the Issue without visiting a separate dashboard. Realizes UJ-1, UJ-2, UJ-3.

**Functional Requirements:**

#### FR-7: Post Preflight Report as GitHub Comment

The system must post the Preflight Report as a GitHub Issue comment.

**Consequences (testable):**

- A successful run creates a GitHub comment on the triggering Issue.
- The comment includes a recognizable heading.
- The comment does not require users to open another app.

#### FR-8: Include Required Report Sections

The Preflight Report must include status, missing context, risk explanation, suggested questions, and checklist items.

**Consequences (testable):**

- The report includes `Preflight Status`.
- The report includes `Missing Context` or explicitly says no material missing context was found.
- The report includes `Why This Matters`.
- The report includes `Suggested Questions`.
- The report includes Markdown task-list Checklist Items.

#### FR-9: Generate Draft Acceptance Criteria When Safe

The system may include Draft Acceptance Criteria only when the Issue provides enough context.

**Consequences (testable):**

- If core context is missing, the report asks questions before drafting acceptance criteria.
- If enough context exists, Draft Acceptance Criteria are framed as editable suggestions.
- Draft Acceptance Criteria must be testable.

#### FR-10: Keep Report Concise

The system must keep the Preflight Report short enough to read in the Issue.

**Consequences (testable):**

- Reports should target 5-10 checklist/suggestion lines unless the Issue is unusually complex. [ASSUMPTION]
- The report avoids generic educational prose.

### 4.4 Non-Blocking Workflow Behavior

**Description:** The MVP helps users clarify Issues without enforcing process. It does not remove labels, fail checks, assign users, block development, or create dashboards. Realizes UJ-2 and UJ-3.

**Functional Requirements:**

#### FR-11: Do Not Block Development Workflow

The system must not prevent the team from starting development.

**Consequences (testable):**

- The system does not remove the Ready Label.
- The system does not fail a required check.
- The system does not assign or unassign users.
- The system does not close, reopen, or edit the Issue.

#### FR-12: Avoid People Analytics

The system must evaluate Issue clarity, not individual performance.

**Consequences (testable):**

- The report does not score or name people as causes of low readiness.
- The system does not produce user/team dashboards in MVP.
- The report language focuses on the work artifact, not the author.

### 4.5 Installation and Configuration

**Description:** Users should be able to install the MVP in a repository with minimal setup. The first version may require a GitHub workflow file and an LLM API key. Realizes UJ-3.

**Functional Requirements:**

#### FR-13: Provide Copy-Paste Workflow Setup

The product must provide a documented GitHub Actions workflow example.

**Consequences (testable):**

- A user can add the workflow under `.github/workflows/`.
- The example includes required permissions.
- The example includes the Ready Label trigger.
- The example explains required secrets.

#### FR-14: Support API Key-Based LLM Configuration

The MVP must support configuring the LLM API key through GitHub Actions secrets.

**Consequences (testable):**

- The Action reads the API key from a secret or action input.
- The API key is not printed in logs.
- Missing API key produces a clear failure message.

#### FR-15: Document Data Handling

The product must document what Issue data is sent to the LLM.

**Consequences (testable):**

- README or setup docs state that Issue title/body are sent for analysis.
- Docs state that repository code is not read in MVP.
- Docs state whether comments are included; MVP defaults to not including comments. [ASSUMPTION]

## 5. Cross-Cutting Non-Functional Requirements

- **NFR-1 Security:** Issue title/body/comment content must be treated as untrusted input. The system must not interpolate Issue content into shell commands.
- **NFR-2 Privacy:** The MVP must minimize data sent to the LLM and document data handling before private-repo use.
- **NFR-3 Reliability:** A failed LLM call or malformed model response must not mutate the Issue beyond a clear failure path in logs.
- **NFR-4 Maintainability:** The Action must separate event parsing, readiness checks, LLM interaction, schema validation, Markdown rendering, and GitHub comment creation.
- **NFR-5 Observability:** Logs must include trigger reason, Issue number, whether deterministic prechecks ran, whether the LLM was called, and whether a comment was created. Logs must not include full private Issue content by default.
- **NFR-6 Cost Control:** The system must avoid unnecessary LLM calls for deterministic low-information cases.

## 6. Constraints and Guardrails

### 6.1 Security Guardrails

- The LLM must not control labels, assignees, file writes, shell commands, or workflow state.
- The LLM response must be validated before rendering.
- The product must request least-privilege GitHub permissions.

### 6.2 Product Guardrails

- No hard gate in MVP.
- No dashboard in MVP.
- No people analytics in MVP.
- No codebase scan in MVP.
- No Jira/Linear/Slack integration in MVP.

### 6.3 Cost Guardrails

- Run only on the Ready Label trigger.
- Keep input bounded.
- Use deterministic prechecks where possible.

## 7. API Contracts / Public Surface

### 7.1 GitHub Action Inputs

[ASSUMPTION: Final names may change during implementation.]

- `github-token` - Required. Token used to post the Issue comment.
- `openai-api-key` - Required for OpenAI-backed MVP.
- `ready-label` - Optional. Defaults to `ready-for-dev`.
- `include-comments` - Optional. Defaults to `false`.

### 7.2 Preflight Status Values

- `Ready`
- `Needs Clarification`
- `High Risk`

### 7.3 Preflight Report Shape

The internal structured report should include:

- `status`
- `missing_context`
- `risk_explanation`
- `suggested_questions`
- `draft_acceptance_criteria`
- `confidence`
- `evidence`

## 8. Non-Goals (Explicit)

- Do not build a GitHub App in MVP.
- Do not build a hosted SaaS dashboard in MVP.
- Do not support Jira, Linear, Slack, or Teams in MVP.
- Do not read repository code files in MVP.
- Do not enforce workflow gates or required checks.
- Do not generate full PRDs or long specs.
- Do not score people or teams.
- Do not optimize for enterprise procurement or compliance workflows in MVP.

## 9. MVP Scope

### 9.1 In Scope

- TypeScript GitHub Action.
- Trigger on `issues.labeled`.
- Filter to Ready Label.
- Skip pull requests.
- Analyze Issue title/body.
- Run deterministic prechecks.
- Generate structured readiness report using an LLM.
- Validate report shape locally.
- Render Markdown Preflight Report.
- Post GitHub Issue comment.
- Provide setup docs, workflow YAML, sample Issue, sample report, and security/data-handling notes.

### 9.2 Out of Scope for MVP

- GitHub App installation and billing.
- Dashboard, account system, or hosted backend.
- Reading code, diffs, linked PRs, or repository files.
- Automatic label changes.
- Required check status.
- Update-in-place comment lifecycle; append-only is acceptable for first prototype. [ASSUMPTION]
- Slash command `/preflight`; late-MVP only if users ask for reruns.
- Repo-specific YAML config beyond the Ready Label. [ASSUMPTION]

## 10. Success Metrics

**Primary**

- **SM-1:** Useful report rate - at least 6 of 10 real preflight reports identify a missing context item the Issue Owner agrees is useful. Validates FR-4, FR-5, FR-8.
- **SM-2:** Issue update rate - at least 30% of flagged Issues are updated after receiving a Preflight Report. Validates FR-7, FR-8, FR-10.
- **SM-3:** Setup completion - a target user can install and trigger the Action in under 10 minutes. Validates FR-13, FR-14.

**Secondary**

- **SM-4:** Valid structured output - at least 95% of successful LLM calls produce schema-valid reports. Validates FR-6, FR-8, FR-9.
- **SM-5:** No unintended mutation - pilot runs do not change labels, assignees, issue state, or repository files. Validates FR-11.
- **SM-6:** Repeat use - at least 3 pilot repositories run the Action on more than one Issue. Validates overall MVP usefulness.

**Counter-metrics**

- **SM-C1:** Comment noise - do not optimize for number of comments generated; excessive comments reduce trust.
- **SM-C2:** Report length - do not optimize for comprehensive reports; the MVP should prefer concise actionable output.
- **SM-C3:** AI-generated acceptance criteria volume - do not optimize for more generated AC; missing-context questions are more important when the Issue is underspecified.

## 11. Open Questions

1. Should MVP include `/preflight` manual rerun, or keep only label-triggered runs?
2. Should the first Action support configurable `ready-label`, or hardcode `ready-for-dev` for validation?
3. Should Issue comments be included in the LLM context, or remain title/body only for privacy and cost?
4. Which LLM provider/model should be used for the first implementation?
5. Should the Action be open source from day one?
6. Should the Action use append-only comments or update a previous bot comment after the first pilot?
7. What exact report format should win: checklist-first, risk-first, or suggested-questions-first?

## 12. Assumptions Index

- §4.1 FR-1 - MVP uses fixed default Ready Label `ready-for-dev` before adding config.
- §4.1 FR-3 - Duplicate prevention may rely on GitHub Actions concurrency and may not cover all edge cases.
- §4.3 FR-10 - Target report length is 5-10 checklist/suggestion lines.
- §4.5 FR-15 - MVP defaults to excluding Issue comments from LLM context.
- §7.1 - GitHub Action input names may change during implementation.
- §9.2 - Append-only comments are acceptable for first prototype.
- §9.2 - Repo-specific config beyond Ready Label is out of MVP.
