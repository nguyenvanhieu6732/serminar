---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-serminal-2026-06-03/prd.md
  - _bmad-output/planning-artifacts/prds/prd-serminal-2026-06-03/addendum.md
  - _bmad-output/planning-artifacts/prds/prd-serminal-2026-06-03/validation-report-tech-writer.md
  - _bmad-output/planning-artifacts/briefs/brief-serminal-2026-06-03/brief.md
  - _bmad-output/planning-artifacts/research/market-dev-ticket-preflight-for-github-issues-research-2026-06-03.md
  - _bmad-output/planning-artifacts/research/technical-dev-ticket-preflight-github-action-mvp-research-2026-06-03.md
workflowType: 'architecture'
lastStep: 8
status: 'complete'
completedAt: '2026-06-03'
project_name: 'serminal'
user_name: 'Nguyenhieu'
date: '2026-06-03'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Initialization Summary

Architecture workflow initialized from the confirmed input set.

### Loaded Input Documents

- PRD: `_bmad-output/planning-artifacts/prds/prd-serminal-2026-06-03/prd.md`
- PRD Addendum: `_bmad-output/planning-artifacts/prds/prd-serminal-2026-06-03/addendum.md`
- PRD Validation Report: `_bmad-output/planning-artifacts/prds/prd-serminal-2026-06-03/validation-report-tech-writer.md`
- Product Brief: `_bmad-output/planning-artifacts/briefs/brief-serminal-2026-06-03/brief.md`
- Market Research: `_bmad-output/planning-artifacts/research/market-dev-ticket-preflight-for-github-issues-research-2026-06-03.md`
- Technical Research: `_bmad-output/planning-artifacts/research/technical-dev-ticket-preflight-github-action-mvp-research-2026-06-03.md`

### Architecture Input Caveats

The PRD validation report marks the PRD as conditionally ready. Architecture can proceed using explicit assumptions, but these PRD points should be resolved before epics/stories:

- Ready Label config: fixed `ready-for-dev` vs configurable `ready-label`.
- Comment lifecycle: append-only vs update-in-place, rerun behavior.
- Failure behavior: missing credentials, invalid LLM output, GitHub API failure.
- Data handling: title/body only vs opt-in issue comments.

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

PRD has 15 functional requirements, grouped into 5 architectural areas:

1. **Trigger & event handling**
   - FR-1: Trigger when an Issue receives the Ready Label.
   - FR-2: Skip pull requests.
   - FR-3: Avoid duplicate concurrent runs.

2. **Issue readiness analysis**
   - FR-4: Analyze Issue title/body.
   - FR-5: Detect missing context categories.
   - FR-6: Produce conservative Preflight Status.

3. **Preflight report output**
   - FR-7: Post GitHub Issue comment.
   - FR-8: Include required report sections.
   - FR-9: Generate Draft Acceptance Criteria only when safe.
   - FR-10: Keep report concise.

4. **Non-blocking workflow**
   - FR-11: Do not block development workflow.
   - FR-12: Avoid people analytics.

5. **Installation/configuration/docs**
   - FR-13: Provide copy-paste workflow setup.
   - FR-14: Support API key-based LLM configuration.
   - FR-15: Document data handling.

Architecturally, this points to a small event-driven automation system: GitHub event in, bounded Issue context analysis, structured report generation, validated rendering, GitHub comment out.

**Non-Functional Requirements:**

The NFRs are architecture-shaping:

- Security: Issue content is untrusted input.
- Privacy: minimize data sent to LLM; document data handling.
- Reliability: failed LLM/API behavior must not mutate Issue state.
- Maintainability: separate event handling, analysis, rendering, and GitHub write behavior.
- Observability: log trigger/run metadata without logging full private Issue content.
- Cost control: avoid unnecessary LLM calls through deterministic prechecks.

**Scale & Complexity:**

- Primary domain: developer tooling / GitHub Action / AI-assisted workflow automation.
- Complexity level: low-to-medium for MVP.
- Estimated architectural components: 8-9 modules.

Likely components:

- GitHub event/context parser
- Action input/config loader
- Deterministic prechecks
- LLM prompt/input builder
- LLM structured-output client
- Report schema validator
- Markdown renderer
- GitHub issue comment adapter
- Security/redaction/truncation utilities

### Technical Constraints & Dependencies

Known constraints:

- MVP should be a stateless TypeScript GitHub Action.
- No GitHub App, hosted SaaS, database, dashboard, or codebase scan in MVP.
- Trigger is `issues.labeled`, filtered to `ready-for-dev`.
- Output is a non-blocking GitHub Issue comment.
- The Action must not mutate labels, assignees, issue state, files, PRs, or checks.
- LLM response must be structured JSON, then validated locally before rendering.
- GitHub permissions should be least-privilege: `issues: write`; `contents: read` only if needed.
- API key is supplied through GitHub Actions secrets.

Important unresolved PRD caveats that architecture must either assume or defer:

- `ready-label`: fixed `ready-for-dev` vs configurable input.
- Comment lifecycle: append-only vs update-in-place.
- Failure behavior: missing API key, LLM timeout, invalid model output, GitHub API failure.
- Data handling: title/body only vs optional Issue comments.

### Cross-Cutting Concerns Identified

- **Security boundary:** GitHub Issue content is attacker-controlled input.
- **Prompt injection:** Issue body/comments may try to override model/system behavior.
- **Secret handling:** LLM API key must not appear in logs or comments.
- **Privacy:** private Issue title/body may be sent to LLM provider.
- **Output safety:** model output must not directly control GitHub mutations.
- **Cost:** avoid LLM calls for empty/obviously invalid Issues.
- **Comment noise:** duplicate or overly long comments can hurt adoption.
- **Testability:** deterministic prechecks, schema validation, and renderer should be unit-testable.

## Starter Template Evaluation

### Primary Technology Domain

Primary domain: **GitHub Action / developer tooling automation**.

This project is not a web app, mobile app, backend service, or full-stack SaaS in MVP. It is a reusable GitHub Action that runs inside a consuming repository's GitHub Actions workflow.

### Starter Options Considered

#### Option 1: GitHub official `actions/typescript-action` template

**What it provides:**

- TypeScript Action template
- `action.yml` metadata
- Source structure under `src/`
- Test setup
- Linting/formatting workflow
- Bundling/publishing guidance
- Release/versioning guidance
- GitHub Actions Toolkit usage pattern

**Fit for project: high.**

This matches the technical research recommendation: stateless TypeScript GitHub Action, no backend, no database, no GitHub App.

#### Option 2: GitHub Docs "Create a JavaScript Action" from scratch

**What it provides:**

- Official tutorial for building a JavaScript Action
- Minimal action metadata and toolkit usage
- Good learning path, but less complete than the TypeScript template

**Fit for project: medium.**

Useful as documentation reference, but less efficient than starting from the TypeScript Action template.

#### Option 3: Custom repo from scratch

**What it provides:**

- Full control over file structure and tooling
- No inherited template opinions

**Fit for project: low-to-medium.**

Not recommended. The project benefits from a known Action publishing/test structure. Starting from scratch adds avoidable setup decisions.

### Selected Starter: `actions/typescript-action`

**Rationale for Selection:**

Use GitHub's official `actions/typescript-action` template as the project foundation. It already matches the architecture direction and makes the right baseline choices: TypeScript, Action metadata, tests, validation workflow, publishing/versioning pattern, and GitHub Actions Toolkit usage.

Important current-version note: GitHub has announced Node 20 deprecation for Actions runners, with Node 24 becoming the path forward. The architecture should verify the template/runtime at implementation time and prefer `runs.using: node24` when supported by the starter and runner environment.

**Initialization Approach:**

This template is created through GitHub's "Use this template" flow, not a CLI command.

```text
1. Open https://github.com/actions/typescript-action
2. Click "Use this template"
3. Create repository: dev-ticket-preflight-action
4. Clone locally
5. Update action.yml, package metadata, source, tests, README
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**

- TypeScript source
- JavaScript Action packaging
- Node runtime managed through Action metadata
- GitHub Actions Toolkit conventions

**Build Tooling:**

- Bundled distribution output
- Package scripts for build/test
- Release/tag guidance for consumers using `@v0` / `@v1`

**Testing Framework:**

- Existing test structure and CI validation workflow

**Code Organization:**

- Template gives base source/test structure, then project-specific modules should replace default sample logic:
  - `github-context.ts`
  - `config.ts`
  - `prechecks.ts`
  - `llm-client.ts`
  - `report-schema.ts`
  - `report-renderer.ts`
  - `github-comments.ts`
  - `security.ts`

**Development Experience:**

- Familiar Node/TypeScript workflow
- GitHub-native validation
- Easier Marketplace publishing path later

**Note:** Project initialization from `actions/typescript-action` should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**

1. Use a stateless TypeScript GitHub Action, not GitHub App/SaaS.
2. Use GitHub official `actions/typescript-action` template.
3. Use `issues.labeled` as the trigger.
4. Default Ready Label is `ready-for-dev`.
5. Action output is a GitHub Issue comment only.
6. LLM output must be structured JSON and locally validated.
7. Issue content is untrusted input.
8. No repository code reading in MVP.
9. No label/assignee/file/check mutation in MVP.

**Important Decisions (Shape Architecture):**

1. Prefer Node 24 runtime when supported by implementation starter and GitHub runner state.
2. Use least-privilege workflow permissions.
3. Use deterministic prechecks before LLM call.
4. Use append-only comments for prototype.
5. Use title/body only by default.
6. Keep optional config minimal.

**Deferred Decisions (Post-MVP):**

1. GitHub App.
2. Hosted backend/SaaS.
3. Dashboard.
4. Billing.
5. `/preflight` slash command.
6. Update-in-place comment lifecycle.
7. Repo-specific readiness rule config.
8. Issue comment inclusion.
9. Jira/Linear/Slack integrations.

### Data Architecture

**Decision:** No database or persistent backend for MVP.

**Rationale:** GitHub Issue comments are the durable artifact. MVP goal is validation, not analytics or account management.

**Data flow:**

```text
GitHub Issue title/body
  -> deterministic prechecks
  -> LLM structured JSON
  -> local schema validation
  -> Markdown renderer
  -> GitHub Issue comment
```

**Data sources:**

- Included by default: Issue title and body.
- Excluded in MVP: repository files, diffs, linked PRs, issue comments.
- Deferred: optional issue comments with explicit opt-in and cap.

### Authentication & Security

**Decision:** Use GitHub Actions `GITHUB_TOKEN` for GitHub API access and Actions secrets for LLM API key.

**Permissions:**

```yaml
permissions:
  issues: write
  contents: read
```

`contents: read` is only needed if the workflow reads repository config or prompt files. If no repo file is read, architecture should try to remove it.

**Security rules:**

- Treat Issue title/body/comment as untrusted input.
- Never interpolate Issue content into shell commands.
- Do not let LLM output control labels, assignees, files, checks, or workflow state.
- Validate structured output before rendering.
- Do not log full private Issue content by default.
- Do not print secrets or full prompts.

### API & Communication Patterns

**Decision:** Use GitHub REST API via Octokit / GitHub Actions Toolkit.

**Primary integration:**

- Event: `issues.labeled`
- Filter: `github.event.label.name == 'ready-for-dev'`
- Output: create Issue comment via GitHub Issues comments API

**LLM communication:**

- Use OpenAI Structured Outputs or equivalent structured JSON mode.
- Local code owns Markdown rendering.
- JSON schema is product contract for `PreflightReport`.

**Internal report shape:**

```json
{
  "status": "ready | needs_clarification | high_risk",
  "missing_context": [],
  "risk_explanation": "",
  "suggested_questions": [],
  "draft_acceptance_criteria": [],
  "confidence": "low | medium | high",
  "evidence": []
}
```

### Frontend Architecture

**Decision:** No frontend in MVP.

**Rationale:** The user interface is GitHub Issues itself. The Action writes Markdown comments. A paste playground or dashboard is deferred.

### Infrastructure & Deployment

**Decision:** No hosted infrastructure for MVP.

**Deployment model:**

- Public Action repository created from `actions/typescript-action`.
- Versioned release tags: `v0.1.0`, then `v0`.
- Consumer repositories install via workflow YAML.
- LLM API key configured as GitHub Actions secret.

**Runtime note:**

- Prefer current GitHub-supported Node runtime.
- Because GitHub is moving JavaScript Actions toward Node 24, implementation should validate `runs.using: node24` at build time.

### Decision Impact Analysis

**Implementation Sequence:**

1. Initialize from `actions/typescript-action`.
2. Update `action.yml` inputs and runtime.
3. Implement GitHub event parser.
4. Implement deterministic prechecks.
5. Define `PreflightReport` schema.
6. Implement Markdown renderer.
7. Implement LLM structured-output client.
8. Implement GitHub comment adapter.
9. Add security/truncation/redaction utilities.
10. Add tests and sandbox workflow.

**Cross-Component Dependencies:**

- Prechecks reduce LLM cost and shape report status.
- LLM client depends on report schema.
- Renderer depends on validated schema only.
- Comment adapter depends on renderer output only.
- Security utilities affect event parsing, prompt building, logging, and renderer safety.

### Architecture Assumptions

- `ready-label` will be configurable with default `ready-for-dev` because PRD currently lists it as public input.
- Comments are title/body only for MVP; `include-comments` should be removed or deferred unless explicitly desired.
- Prototype uses append-only comments; update-in-place is deferred.
- Failures are logs-only unless user-actionable; no misleading report comments on invalid LLM output.

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**

Key areas where AI agents could otherwise diverge:

1. File/module naming and responsibility boundaries
2. Action input naming
3. GitHub event parsing behavior
4. Precheck result format
5. LLM report schema
6. Markdown report format
7. Error/failure handling
8. Logging and privacy rules
9. Test file placement and fixture naming

### Naming Patterns

**Code Naming Conventions:**

- Files use kebab-case: `github-context.ts`, `report-renderer.ts`.
- Types/interfaces use PascalCase: `PreflightReport`, `MissingContextItem`.
- Functions use camelCase: `parseIssueEvent`, `renderPreflightReport`.
- Constants use UPPER_SNAKE_CASE only for true constants: `DEFAULT_READY_LABEL`.
- Action inputs use kebab-case: `github-token`, `openai-api-key`, `ready-label`.

**Status Naming:**

Internal enum values use lowercase snake_case:

```ts
type PreflightStatus = 'ready' | 'needs_clarification' | 'high_risk'
```

Rendered labels use title case:

```text
Ready
Needs Clarification
High Risk
```

### Structure Patterns

**Project Organization:**

Use the `actions/typescript-action` starter, then organize source modules by responsibility:

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

**Responsibility Rules:**

- `action.ts`: orchestration only.
- `github-context.ts`: parse and normalize GitHub event payload.
- `config.ts`: read Action inputs and defaults.
- `prechecks.ts`: deterministic checks before LLM calls.
- `llm-client.ts`: call LLM provider and return raw structured output.
- `report-schema.ts`: define and validate `PreflightReport`.
- `report-renderer.ts`: convert validated report to Markdown.
- `github-comments.ts`: create GitHub Issue comments only.
- `security.ts`: truncation, redaction, safe logging helpers.

No module except `github-comments.ts` may write to GitHub.

**Test Structure:**

Use central tests consistently:

```text
__tests__/
  github-context.test.ts
  prechecks.test.ts
  report-schema.test.ts
  report-renderer.test.ts
  fixtures/
    issue-labeled.json
    empty-issue.json
    pull-request-labeled.json
    prompt-injection-issue.json
```

### Format Patterns

**PreflightReport Schema:**

All LLM analysis must be normalized to this internal structure before rendering:

```ts
interface PreflightReport {
  status: 'ready' | 'needs_clarification' | 'high_risk'
  missing_context: MissingContextItem[]
  risk_explanation: string
  suggested_questions: ChecklistItem[]
  draft_acceptance_criteria: ChecklistItem[]
  confidence: 'low' | 'medium' | 'high'
  evidence: EvidenceItem[]
}
```

**Markdown Report Format:**

All comments must follow this section order:

```md
## Dev Ticket Preflight: {Status}

### Missing Context
- [ ] ...

### Why This Matters
...

### Suggested Questions
- [ ] ...

### Draft Acceptance Criteria
- [ ] ...
```

Rules:

- Omit `Draft Acceptance Criteria` if there is insufficient context.
- Do not include long educational prose.
- Do not include raw prompt or raw LLM JSON.
- Use Markdown task-list syntax for actionable items.

### Communication Patterns

**GitHub Event Handling:**

- Only handle `issues.labeled`.
- Only proceed when label equals configured Ready Label.
- Skip if payload contains `issue.pull_request`.
- Treat all Issue fields as untrusted data.

**GitHub API Writes:**

- Only allowed GitHub write in MVP: create Issue comment.
- No label mutation.
- No assignee mutation.
- No issue body edits.
- No check run/status mutation.
- No file writes.

### Process Patterns

**Precheck Pattern:**

Prechecks run before LLM calls and can short-circuit obvious cases:

- Missing Issue
- Pull request payload
- Label mismatch
- Empty body
- Body below minimum useful length

Precheck result format:

```ts
interface PrecheckResult {
  shouldContinue: boolean
  reason?: string
  report?: PreflightReport
}
```

**Error Handling Pattern:**

- Missing required Action input: fail Action with `core.setFailed`.
- LLM timeout/error: fail Action with clear logs, do not post misleading report.
- Invalid structured output: fail Action or post only if deterministic fallback is safe.
- GitHub comment API failure: fail Action with clear logs.
- No error path may mutate labels, assignees, files, checks, or issue state.

**Logging Pattern:**

Allowed logs:

- Issue number
- Trigger label
- Whether prechecks ran
- Whether LLM was called
- Report status
- Comment ID after successful post

Forbidden logs by default:

- Full Issue body
- Full prompt
- LLM API key
- Raw private Issue comments
- Raw LLM response if it may include private content

### Enforcement Guidelines

**All AI Agents MUST:**

- Keep GitHub writes isolated to `github-comments.ts`.
- Validate LLM output before rendering.
- Render Markdown only from validated data.
- Treat Issue content as untrusted input.
- Add tests for every new precheck and renderer branch.
- Avoid adding backend, database, dashboard, or GitHub App behavior in MVP.
- Preserve PRD guardrails unless explicitly changed by decision log.

**Pattern Enforcement:**

- Pattern violations should be recorded in architecture or story notes before implementation proceeds.
- New modules must state their single responsibility.
- New GitHub API writes require explicit architecture update.
- New LLM inputs require data-handling documentation update.

### Pattern Examples

**Good Example:**

```ts
const report = validatePreflightReport(rawModelOutput)
const markdown = renderPreflightReport(report)
await createIssueComment({ issueNumber, body: markdown })
```

**Anti-Pattern:**

```ts
await github.rest.issues.addLabels({
  issue_number,
  labels: rawModelOutput.labels_to_apply
})
```

Why bad: lets model output control GitHub mutations, which violates MVP guardrails.

**Good Example:**

```ts
core.info(`Preflight completed for issue #${issueNumber}: ${report.status}`)
```

**Anti-Pattern:**

```ts
core.info(`Prompt sent to LLM: ${prompt}`)
```

Why bad: may leak private Issue content.

## Project Structure & Boundaries

### Complete Project Directory Structure

```text
dev-ticket-preflight-action/
├── README.md
├── SECURITY.md
├── LICENSE
├── action.yml
├── package.json
├── package-lock.json
├── tsconfig.json
├── jest.config.js
├── eslint.config.mjs
├── prettier.config.mjs
├── .gitignore
├── .node-version
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── check-dist.yml
├── dist/
│   └── index.js
├── src/
│   ├── action.ts
│   ├── github-context.ts
│   ├── config.ts
│   ├── prechecks.ts
│   ├── llm-client.ts
│   ├── report-schema.ts
│   ├── report-renderer.ts
│   ├── github-comments.ts
│   └── security.ts
├── __tests__/
│   ├── github-context.test.ts
│   ├── config.test.ts
│   ├── prechecks.test.ts
│   ├── report-schema.test.ts
│   ├── report-renderer.test.ts
│   ├── github-comments.test.ts
│   ├── security.test.ts
│   └── fixtures/
│       ├── issue-labeled.json
│       ├── issue-other-label.json
│       ├── empty-issue.json
│       ├── short-issue.json
│       ├── pull-request-labeled.json
│       ├── prompt-injection-issue.json
│       ├── valid-preflight-report.json
│       └── invalid-preflight-report.json
├── examples/
│   ├── workflow.yml
│   ├── sample-feature-issue.md
│   ├── sample-bug-issue.md
│   └── sample-preflight-report.md
└── docs/
    ├── data-handling.md
    ├── permissions.md
    ├── troubleshooting.md
    └── report-format.md
```

### Architectural Boundaries

**Action Boundary:**

`action.ts` is the only orchestration entry point. It coordinates modules but does not contain parsing, rendering, LLM-specific, or GitHub API logic.

**GitHub Event Boundary:**

`github-context.ts` owns GitHub event parsing and normalization.

Responsibilities:

- Read GitHub Actions event context.
- Validate event shape.
- Extract issue number, label, title, body, pull request marker.
- Treat all issue fields as untrusted data.

**Configuration Boundary:**

`config.ts` owns Action inputs and defaults.

Responsibilities:

- Read `github-token`.
- Read `openai-api-key`.
- Read `ready-label`, default `ready-for-dev`.
- Enforce missing required input behavior.

**Precheck Boundary:**

`prechecks.ts` owns deterministic checks before LLM calls.

Responsibilities:

- Skip PR payloads.
- Skip label mismatch.
- Handle empty/short issue body.
- Produce deterministic fallback reports where safe.

**LLM Boundary:**

`llm-client.ts` owns provider communication only.

Responsibilities:

- Build provider request from bounded input.
- Request structured output.
- Return raw provider result.
- It must not render Markdown.
- It must not write to GitHub.
- It must not decide mutations.

**Schema Boundary:**

`report-schema.ts` owns `PreflightReport` type and validation.

Responsibilities:

- Define status enum.
- Validate model output.
- Reject malformed or unsafe report shapes.
- Normalize structured output before rendering.

**Rendering Boundary:**

`report-renderer.ts` owns Markdown generation.

Responsibilities:

- Render validated reports only.
- Produce canonical report section order.
- Omit empty/unsafe sections.
- Avoid raw prompt/JSON leakage.

**GitHub Comment Boundary:**

`github-comments.ts` is the only module allowed to write to GitHub.

Responsibilities:

- Create Issue comment.
- Return comment ID.
- Never mutate labels, assignees, issue body, files, or checks.

**Security Boundary:**

`security.ts` owns utilities used across modules.

Responsibilities:

- Truncation.
- Redaction.
- Safe log helpers.
- Future prompt-injection guard helpers.

### Requirements to Structure Mapping

**FR-1, FR-2, FR-3: Ready Label Trigger**

- `src/action.ts`
- `src/github-context.ts`
- `src/config.ts`
- `src/prechecks.ts`
- `__tests__/github-context.test.ts`
- `__tests__/prechecks.test.ts`
- Fixtures:
  - `issue-labeled.json`
  - `issue-other-label.json`
  - `pull-request-labeled.json`

**FR-4, FR-5, FR-6: Issue Readiness Analysis**

- `src/prechecks.ts`
- `src/llm-client.ts`
- `src/report-schema.ts`
- `src/security.ts`
- `__tests__/prechecks.test.ts`
- `__tests__/report-schema.test.ts`
- Fixtures:
  - `empty-issue.json`
  - `short-issue.json`
  - `prompt-injection-issue.json`
  - `valid-preflight-report.json`
  - `invalid-preflight-report.json`

**FR-7, FR-8, FR-9, FR-10: Preflight Report Comment**

- `src/report-renderer.ts`
- `src/github-comments.ts`
- `src/report-schema.ts`
- `__tests__/report-renderer.test.ts`
- `__tests__/github-comments.test.ts`
- Docs:
  - `docs/report-format.md`
  - `examples/sample-preflight-report.md`

**FR-11, FR-12: Non-Blocking Workflow Behavior**

- Enforced by architecture boundary.
- Relevant files:
  - `src/github-comments.ts`
  - `src/action.ts`
  - `__tests__/github-comments.test.ts`
- Explicit anti-pattern: no labels, assignees, checks, files, issue state mutation.

**FR-13, FR-14, FR-15: Installation and Configuration**

- `action.yml`
- `README.md`
- `docs/permissions.md`
- `docs/data-handling.md`
- `docs/troubleshooting.md`
- `examples/workflow.yml`
- `src/config.ts`
- `__tests__/config.test.ts`

### Integration Points

**Internal Communication:**

```text
action.ts
  -> config.ts
  -> github-context.ts
  -> prechecks.ts
  -> llm-client.ts
  -> report-schema.ts
  -> report-renderer.ts
  -> github-comments.ts
```

**External Integrations:**

- GitHub Actions runtime
- GitHub Issues event payload
- GitHub REST API for Issue comments
- OpenAI API or equivalent structured-output LLM provider
- GitHub Actions secrets

**Data Flow:**

```text
GitHub Issue title/body
  -> normalized IssueContext
  -> deterministic prechecks
  -> bounded LLM input
  -> raw structured model output
  -> validated PreflightReport
  -> Markdown report
  -> GitHub Issue comment
```

### File Organization Patterns

**Configuration Files:**

- `action.yml`: public Action metadata and inputs.
- `package.json`: scripts and dependencies.
- `tsconfig.json`: TypeScript config.
- `.node-version`: runtime version preference.
- `.github/workflows/ci.yml`: test/build validation.
- `.github/workflows/check-dist.yml`: ensures bundled `dist/index.js` is committed.

**Source Organization:**

- All source files live under `src/`.
- Each source file has one responsibility.
- No generic `utils.ts`; shared helpers must belong to a named concern like `security.ts`.

**Test Organization:**

- Tests live under `__tests__/`.
- Fixtures live under `__tests__/fixtures/`.
- Every source module except `action.ts` should have direct unit tests.
- `action.ts` is tested through orchestration/integration-style tests if needed.

**Documentation Organization:**

- `README.md`: install, quickstart, example report.
- `SECURITY.md`: vulnerability disclosure and safe-use notes.
- `docs/data-handling.md`: what data leaves GitHub.
- `docs/permissions.md`: why each permission is needed.
- `docs/troubleshooting.md`: common setup/failure cases.
- `docs/report-format.md`: canonical comment format.

### Development Workflow Integration

**Build Process Structure:**

- TypeScript source is bundled into `dist/index.js`.
- Consumers run the bundled Action through `action.yml`.
- `dist/index.js` must be committed for the Action release.

**Validation Workflow:**

CI should verify:

- TypeScript compile
- Unit tests
- Lint/format
- Bundled `dist/index.js` is current
- No obvious secret leakage in fixtures/examples

**Deployment Structure:**

- Publish versioned release tags such as `v0.1.0`.
- Maintain a moving `v0` tag for early users.
- Consumers pin to `@v0`, exact semver tag, or commit SHA based on risk tolerance.

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**

Architecture nhất quán với hướng MVP: stateless TypeScript GitHub Action, chạy trên `issues.labeled`, phân tích bounded Issue title/body, validate structured LLM output, rồi post GitHub Issue comment. Các quyết định "không SaaS, không DB, không dashboard, không GitHub App" không xung đột với starter `actions/typescript-action`.

Điểm cần theo dõi: runtime Node 24 phải được xác nhận ở implementation time vì starter/template và GitHub runner support có thể thay đổi.

**Pattern Consistency:**

Implementation patterns hỗ trợ đúng các quyết định kiến trúc: event parsing, config, prechecks, LLM client, schema validation, renderer, GitHub comment writer, security utilities được tách riêng. Naming conventions, input naming, status naming, logging rules và test structure đủ cụ thể để giảm divergence giữa các AI agent.

**Structure Alignment:**

Project structure hỗ trợ toàn bộ boundary đã định nghĩa. `github-comments.ts` là module duy nhất được phép write GitHub, giúp enforce guardrail không mutate labels, assignees, checks, files, issue state. `report-schema.ts` và `report-renderer.ts` tách riêng để model output không trực tiếp điều khiển Markdown hoặc GitHub mutation.

### Requirements Coverage Validation ✅

**Epic/Feature Coverage:**

Chưa có epics/stories chính thức. Architecture được validate theo FR categories trong PRD.

**Functional Requirements Coverage:**

Tất cả 15 FR có support kiến trúc:

- FR-1 đến FR-3: covered bởi `github-context.ts`, `config.ts`, `prechecks.ts`, workflow trigger pattern.
- FR-4 đến FR-6: covered bởi deterministic prechecks, bounded LLM input, `PreflightReport` schema.
- FR-7 đến FR-10: covered bởi renderer/comment modules và canonical report format.
- FR-11 đến FR-12: covered bởi explicit non-blocking guardrails và anti-people-analytics constraints.
- FR-13 đến FR-15: covered bởi `action.yml`, README, docs, config, permissions/data-handling docs.

**Non-Functional Requirements Coverage:**

Security, privacy, reliability, maintainability, observability và cost control đều được address ở architecture level. Prompt-injection risk được nhận diện; issue content được xem là untrusted input; logs bị giới hạn; LLM output phải validate trước khi render.

### Implementation Readiness Validation ✅

**Decision Completeness:**

Critical decisions đã đủ để bắt đầu build MVP. Các deferred decisions được ghi rõ để tránh scope creep: GitHub App, SaaS backend, dashboard, update-in-place comment lifecycle, repo code scan, issue comment inclusion.

**Structure Completeness:**

Directory structure, module boundaries, tests, fixtures, docs, examples, CI và release structure đã đủ cụ thể cho implementation.

**Pattern Completeness:**

Naming, communication, process, error handling, logging, validation và enforcement patterns đã đủ rõ. Các conflict points chính đã được khóa bằng module boundaries và anti-patterns.

### Gap Analysis Results

**Critical Gaps:**

Không có critical gap đang block implementation.

**Important Gaps:**

- Node runtime version cần verify khi implementation bắt đầu.
- Comment lifecycle đang chọn append-only cho prototype; nếu user muốn production polish sớm, cần PRD/architecture update cho update-in-place.
- Failure behavior đã có pattern nhưng cần stories/tests cụ thể cho missing API key, LLM timeout, invalid structured output, GitHub API failure.
- Data handling hiện title/body only; nếu include issue comments thì cần explicit opt-in, cap, docs update.

**Nice-to-Have Gaps:**

- Có thể thêm `docs/prompt-safety.md` sau MVP.
- Có thể thêm sample outputs theo từng status.
- Có thể thêm local dry-run CLI sau validation MVP.

### Validation Issues Addressed

PRD validation report từng nêu các caveat. Architecture đã resolve ở mức MVP assumption:

- `ready-label`: configurable input, default `ready-for-dev`.
- Comment lifecycle: append-only for prototype.
- Failure behavior: fail Action with clear logs, no misleading report comment.
- Data handling: title/body only by default, comments excluded.

Các điểm này cần được phản ánh tiếp trong epics/stories để không quay lại mơ hồ khi implement.

### Architecture Completeness Checklist

**Requirements Analysis**

- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**Architectural Decisions**

- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**Implementation Patterns**

- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**Project Structure**

- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** high

**Key Strengths:**

- Scope phù hợp MVP validation: GitHub Action, không backend.
- Boundaries rõ, dễ giao cho AI agent implement từng module.
- Security/privacy guardrails được đưa vào architecture sớm.
- Requirements mapping rõ từ FR sang files/tests/docs.
- Deferred decisions được tách khỏi MVP.

**Areas for Future Enhancement:**

- Update-in-place comments.
- Repo-specific readiness rules.
- Optional issue comment inclusion.
- GitHub App/SaaS path nếu MVP traction tốt.
- More advanced prompt-injection test suite.

### Implementation Handoff

**AI Agent Guidelines:**

- Follow all architectural decisions exactly as documented.
- Use implementation patterns consistently across all components.
- Respect project structure and boundaries.
- Refer to this document for all architectural questions.
- Do not add backend, database, dashboard, GitHub App behavior, repo code reading, or GitHub label/check mutation without architecture update.

**First Implementation Priority:**

Initialize the Action repository from GitHub official `actions/typescript-action` template, then update `action.yml`, package metadata, source modules, tests, README, and docs according to this architecture.
