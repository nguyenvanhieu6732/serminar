---
baseline_commit: bde8568
---

# Story 3.4: Post Report as Append-Only GitHub Issue Comment

Status: done

Story Key: `3-4-post-report-as-append-only-github-issue-comment`

## Story

As a repo maintainer,
I want the Action to post the report directly in the GitHub Issue,
So that users can act on feedback without opening another tool.

## Acceptance Criteria

1. Given a Markdown Preflight Report is generated for an eligible Issue, when the Action posts the report, then a GitHub Issue comment is created on the triggering Issue, and the comment ID is logged after success.
2. Given the comment API call fails, when the Action handles the failure, then it fails with a clear log message, and no fallback mutation is attempted.
3. Given the prototype runs multiple times on the same Issue, when each run succeeds, then comments are append-only, and update-in-place behavior is not required for MVP.

## Tasks / Subtasks

- [x] Implement the GitHub Issue comment adapter in `src/github-comments.ts`. (AC: 1, 2, 3)
  - [x] Keep `github-comments.ts` as the only module that calls a GitHub write API.
  - [x] Accept the GitHub token, `GitHubCommentTarget`, and already-rendered Markdown body.
  - [x] Create an Octokit client with `getOctokit(token)` and call `octokit.rest.issues.createComment`.
  - [x] Pass only `owner`, `repo`, `issue_number`, and `body` to the API.
  - [x] Return the created comment ID.
  - [x] Do not search for, update, edit, or delete existing comments; every successful call is append-only.
  - [x] Let API failures propagate to the orchestration layer without attempting another GitHub mutation.

- [x] Connect report rendering and comment posting in `src/action.ts`. (AC: 1, 2)
  - [x] Render and post deterministic precheck reports instead of returning after logging them.
  - [x] Render and post validated, conservative-status LLM reports after analysis succeeds.
  - [x] Pass the triggering Issue owner, repo, and issue number from `ReadyIssueContext`.
  - [x] Log only the issue number and returned comment ID after successful creation.
  - [x] On comment API failure, log a clear safe reason, call `core.setFailed`, and return.
  - [x] Do not log the rendered Markdown body, Issue body, raw provider output, token, or provider/API error details.
  - [x] Do not post comments for skipped payloads, failed LLM calls, or invalid structured output.

- [x] Add focused adapter tests in `__tests__/github-comments.test.ts`. (AC: 1, 2, 3)
  - [x] Assert the adapter calls `issues.createComment` with the exact target and body.
  - [x] Assert it returns the created comment ID.
  - [x] Assert multiple calls create multiple comments and never call update/delete APIs.
  - [x] Assert API errors reject without a fallback write.

- [x] Extend orchestration tests in `__tests__/action.test.ts`. (AC: 1, 2)
  - [x] Assert an eligible LLM report is rendered, posted once, and logs the comment ID.
  - [x] Assert deterministic empty/short-body reports are rendered and posted without calling the LLM.
  - [x] Assert skipped payloads, provider errors, and invalid reports do not post comments.
  - [x] Assert comment API failure marks the Action failed with a safe clear message and does not retry or mutate anything else.
  - [x] Extend `__tests__/mocks/actions-github.ts` only as needed to expose a mockable `getOctokit`.

- [x] Preserve scope and safety boundaries. (AC: 1, 2, 3)
  - [x] Do not add label, assignee, issue body, issue state, file, check, pull request, or workflow mutations.
  - [x] Do not implement update-in-place comments, bot markers, comment lookup, deduplication, or retries.
  - [x] Do not change renderer, schema, LLM instructions, dependencies, Action inputs, or permissions.
  - [x] Regenerate the committed `dist/index.js` Action bundle after source changes.

- [x] Run the local validation gate.
  - [x] Run `rtk npm test`.
  - [x] Run `rtk npm run build`.
  - [x] Run `rtk npm run all`.

### Review Findings

- [x] [Review][Patch] Tests do not prove that update/delete or fallback GitHub mutations are never attempted [__tests__/github-comments.test.ts:32]
- [x] [Review][Patch] Orchestration tests do not fully prove skipped-payload suppression and conservative-status comment rendering [__tests__/action.test.ts:171]

## Dev Notes

### Scope Boundary

Story 3.4 is the first story that may write to GitHub. It connects the existing report pipeline to one allowed mutation: create an Issue comment.

Do not implement Story 3.5 responsibilities such as semantic filtering of people-scoring or mutation suggestions. Do not implement later documentation or release work.

### Source Context

- FR7 requires the Preflight Report to be posted as a GitHub Issue comment.
- FR11 requires the report to remain advisory and forbids workflow-blocking mutations.
- Architecture allows exactly one GitHub write in MVP: create an Issue comment from `src/github-comments.ts`.
- Prototype comment lifecycle is append-only; update-in-place is explicitly deferred.
- NFR3 requires failed API behavior to avoid misleading or fallback Issue mutations.
- NFR5 permits logging comment ID after success but forbids logging full private Issue content.

### Adapter Contract

Use the existing target type and add a small exported function:

```ts
export interface CreateIssueCommentInput {
  readonly token: string
  readonly target: GitHubCommentTarget
  readonly body: string
}

export async function createIssueComment(
  input: CreateIssueCommentInput
): Promise<number>
```

Implementation shape:

```ts
const octokit = getOctokit(token)
const response = await octokit.rest.issues.createComment({
  owner: target.owner,
  repo: target.repo,
  issue_number: target.issueNumber,
  body
})

return response.data.id
```

Do not catch errors inside the adapter unless required for typing. The orchestration layer owns user-facing safe logs and `core.setFailed`.

### Action Orchestration Contract

Both report-producing paths must post:

1. Deterministic precheck report:
   - `runPrechecks` returns `{ kind: "report" }`
   - Render `precheckResult.report`
   - Create comment
   - Log success with issue number and comment ID
   - Return

2. LLM report:
   - Analyze
   - Validate
   - Apply conservative status policy
   - Render report
   - Create comment
   - Log success with issue number and comment ID
   - Return

Recommended safe success log:

```text
Preflight comment created for issue #42: comment_id=123.
```

Recommended safe failure log and failure message:

```text
GitHub comment creation failed for issue #42: api_error.
GitHub comment creation failed: api_error
```

Do not include the exception message because provider/API errors may contain private details.

### Append-Only Rule

Append-only means every call uses `issues.createComment`. Do not:

- list comments
- search for a bot marker
- update an existing comment
- delete a comment
- retry with another mutation
- change labels or issue state after failure

Workflow-level concurrency guidance from Story 1.5 remains the only duplicate mitigation for MVP.

### Current Code State

`src/github-comments.ts` currently contains only `GitHubCommentTarget`.

`src/action.ts` currently:

- loads `github-token` and `openai-api-key`
- parses the eligible Issue context
- creates deterministic precheck reports or validated conservative LLM reports
- logs report status but returns without rendering or posting
- safely handles provider and validation failures

`src/report-renderer.ts` already owns canonical Markdown generation. Use `renderReport`; do not recreate Markdown in `action.ts` or `github-comments.ts`.

### Previous Story Intelligence

Story 3.3 completed the canonical report renderer and was reviewed with no actionable findings. The repository HEAD `bde8568` contains that renderer behavior. Story 3.4 should treat renderer output as final trusted Markdown.

### Architecture Compliance

- `action.ts`: orchestration only.
- `report-renderer.ts`: Markdown generation only.
- `github-comments.ts`: the only GitHub write boundary.
- Use existing `@actions/github` dependency; no new package is required.
- Use central Jest tests under `__tests__/`.
- Keep logs limited to safe metadata.

### Testing Requirements

Add `__tests__/github-comments.test.ts` for direct adapter behavior and extend `__tests__/action.test.ts` for end-to-end orchestration.

High-value cases:

- Exact `createComment` parameters and returned ID.
- Two adapter calls produce two `createComment` calls.
- Deterministic precheck report posts without LLM.
- LLM report posts after validation and conservative status normalization.
- Invalid/provider failures never post.
- Comment API failure produces safe logs and one failed write attempt.
- No test should assert or log private body content, rendered report body in logs, token values, or raw API error details.

### Project Structure Notes

Expected files:

- Modify: `src/github-comments.ts`
- Modify: `src/action.ts`
- Add: `__tests__/github-comments.test.ts`
- Modify: `__tests__/action.test.ts`
- Modify: `__tests__/mocks/actions-github.ts`
- Modify: `dist/index.js` and `dist/index.js.map` through the existing package command
- Do not modify: `src/report-renderer.ts`, `src/report-schema.ts`, `src/llm-client.ts`, `package.json`, `package-lock.json`, `action.yml`, workflow files, or docs.

### Technical Research

The installed `@actions/github` package exposes `getOctokit(token)`, and the bundled Octokit REST client exposes `rest.issues.createComment`. No external research or dependency update is required.

## References

- `_bmad-output/planning-artifacts/epics.md` - Epic 3 and Story 3.4 acceptance criteria
- `_bmad-output/planning-artifacts/architecture.md` - GitHub Comment Boundary, GitHub API Writes, logging, and append-only decisions
- `_bmad-output/planning-artifacts/prds/prd-serminal-2026-06-03/prd.md` - FR7, FR11, NFR3, NFR5, and append-only MVP scope
- `_bmad-output/planning-artifacts/prds/prd-serminal-2026-06-03/addendum.md` - one-comment output and no-mutation guardrails
- `_bmad-output/implementation-artifacts/1-5-prevent-obvious-duplicate-concurrent-runs.md` - workflow-level concurrency limits
- `_bmad-output/implementation-artifacts/3-3-render-draft-acceptance-criteria-only-when-safe.md` - completed renderer contract
- `src/action.ts` - current orchestration flow
- `src/github-comments.ts` - current write-boundary placeholder
- `src/report-renderer.ts` - canonical Markdown renderer
- `__tests__/action.test.ts` - current orchestration tests
- `__tests__/mocks/actions-github.ts` - current GitHub context mock

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Implementation Plan

- Add a single-purpose Octokit comment adapter that returns the created comment ID.
- Connect deterministic and LLM report paths to the existing renderer and adapter.
- Add adapter and orchestration coverage before implementation, then regenerate the Action bundle.

### Debug Log References

- RED: targeted `github-comments` and `action` tests failed before the adapter and posting path existed.
- GREEN: targeted suites passed with 20 tests after implementation.
- Validation: `rtk npm test` passed with 10 suites and 108 tests; `rtk npm run build`, format, lint, and package generation passed.
- `rtk npm run all` reached `package:check` and reported the expected uncommitted `dist/index.js` diff generated by this story.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Added the only GitHub write adapter using `issues.createComment` and returning comment IDs.
- Posted both deterministic precheck reports and validated conservative LLM reports as append-only Issue comments.
- Added safe success/failure logging without exposing report bodies, tokens, or API error details.
- Confirmed no GitHub mutation API other than `issues.createComment` exists in `src/`.
- Added review coverage proving forbidden update/delete mutations are never called, skipped payloads do not post, and conservative status normalization is reflected in posted Markdown.
- Full tests passed: 10 suites, 109 tests; TypeScript build, format, lint, and package generation passed.

### File List

- `src/github-comments.ts`
- `src/action.ts`
- `__tests__/github-comments.test.ts`
- `__tests__/action.test.ts`
- `__tests__/mocks/actions-github.ts`
- `dist/index.js`
- `dist/index.js.map`
- `_bmad-output/implementation-artifacts/3-4-post-report-as-append-only-github-issue-comment.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Change Log

- 2026-06-04: Story created and marked ready for development.
- 2026-06-04: Implemented append-only GitHub Issue comment posting and marked ready for review.
- 2026-06-04: Addressed code review test findings and marked story done.
