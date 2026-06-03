---
baseline_commit: NO_VCS
---

# Story 1.1: Set Up Initial Project from Starter Template

Status: done

<!-- Note: Validation is optional. Run validate-create-story before dev-story if you want a separate quality gate. -->

## Story

As a repo maintainer,
I want the project set up from the official TypeScript GitHub Action starter template,
so that I can add Dev Ticket Preflight to a repository through a normal GitHub Actions workflow.

## Acceptance Criteria

1. Given the project repository is created from or aligned with `actions/typescript-action`, when the maintainer installs dependencies and performs initial configuration, then the repository has the starter project structure, package metadata, TypeScript configuration, test setup, and Action metadata needed for implementation.
2. Given the starter setup is complete, when the maintainer runs the project validation commands, then TypeScript compile, unit test command, and bundle output are available, and `action.yml` exposes a runnable JavaScript Action entrypoint.
3. Given the Action is packaged for GitHub Actions usage, when a consumer references the Action in a workflow, then the Action can run through the bundled `dist/index.js` entrypoint, and the repository includes CI coverage for build/test validation.

## Tasks / Subtasks

- [x] Initialize or align the repository with the official `actions/typescript-action` template. (AC: 1)
  - [x] Create the baseline TypeScript GitHub Action files if they are absent: `action.yml`, `package.json`, `package-lock.json`, `tsconfig.json`, Jest config, lint/format config, `src/`, `__tests__/`, `dist/`, and `.github/workflows/`.
  - [x] Remove or replace template sample behavior and metadata so the package clearly represents Dev Ticket Preflight, not the starter sample.
  - [x] Add or preserve `.node-version` and use the current GitHub-supported JavaScript Action runtime after verification.
- [x] Configure Action metadata and package scripts for a runnable JavaScript Action. (AC: 1, 2, 3)
  - [x] Set `action.yml` to run the bundled entrypoint at `dist/index.js`.
  - [x] Keep public Action inputs minimal for this foundation story; deeper input behavior belongs to Story 1.2.
  - [x] Ensure package scripts exist for install, build/compile, unit tests, lint/format validation, and bundling.
- [x] Establish the architecture-directed source and test layout. (AC: 1, 2)
  - [x] Create the planned `src/` module placeholders or initial starter modules without implementing later-story behavior.
  - [x] Create the central `__tests__/` structure and fixtures folder expected by later stories.
  - [x] Keep `action.ts` as orchestration-only if created in this story.
- [x] Add CI coverage for the starter baseline. (AC: 2, 3)
  - [x] Add or update `.github/workflows/ci.yml` to run dependency install, compile/build, tests, lint/format, and bundle checks.
  - [x] Add or preserve a dist freshness check if provided by the starter, because `dist/index.js` must be committed for Action releases.
  - [x] Avoid adding workflow permissions beyond what the starter validation needs.
- [x] Verify the starter baseline locally. (AC: 2, 3)
  - [x] Run dependency install.
  - [x] Run compile/build.
  - [x] Run unit tests.
  - [x] Run bundle generation and verify `dist/index.js` is produced or refreshed.
  - [x] Record exact commands and any environment/runtime caveats in the Dev Agent Record.

## Dev Notes

### Scope Boundary

This story is foundation setup only. Do not implement Ready Label parsing, OpenAI calls, schema validation, report rendering, GitHub comment posting, duplicate prevention, data-handling docs, or release examples beyond minimal starter placeholders. Those are covered by later stories.

The output of this story should be a runnable TypeScript GitHub Action skeleton that later stories can extend without reorganizing the repository.

### Source Context

- Epic 1 objective: make the Action installable and triggerable in a repository, with configuration/secrets and duplicate guidance added across Stories 1.2-1.5. [Source: `_bmad-output/planning-artifacts/epics.md#Epic 1: Installable Ready-Label Action`]
- Story 1.1 requires setup from or alignment with `actions/typescript-action`, package metadata, TypeScript config, test setup, Action metadata, runnable bundled entrypoint, and CI validation. [Source: `_bmad-output/planning-artifacts/epics.md#Story 1.1: Set Up Initial Project from Starter Template`]
- The architecture makes project initialization from `actions/typescript-action` the first implementation priority. [Source: `_bmad-output/planning-artifacts/architecture.md#Starter Template Evaluation`]
- PRD scope requires a TypeScript GitHub Action, `issues.labeled` trigger support later, deterministic prechecks later, structured LLM output later, local schema validation later, Markdown rendering later, and one GitHub Issue comment later. [Source: `_bmad-output/planning-artifacts/prds/prd-serminal-2026-06-03/prd.md#9.1 In Scope`]

### Architecture Compliance

Follow these setup decisions exactly:

- Use a stateless TypeScript GitHub Action, not a GitHub App, hosted SaaS, backend, database, or dashboard. [Source: `_bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions`]
- Use GitHub's official `actions/typescript-action` template as the project foundation. The official template provides TypeScript compilation support, tests, validation workflow, publishing, and versioning guidance. [Source: `_bmad-output/planning-artifacts/architecture.md#Selected Starter: actions/typescript-action`; external: `https://github.com/actions/typescript-action`]
- Package source into a JavaScript Action entrypoint under `dist/index.js`; consumers run the bundled Action through `action.yml`. [Source: `_bmad-output/planning-artifacts/architecture.md#Development Workflow Integration`]
- Keep `dist/index.js` committed for releases. [Source: `_bmad-output/planning-artifacts/architecture.md#Development Workflow Integration`]
- No module except future `github-comments.ts` may write to GitHub. This story should not add any GitHub write behavior beyond template validation workflows. [Source: `_bmad-output/planning-artifacts/architecture.md#Architectural Boundaries`]

### Latest Runtime Notes

- GitHub's `actions/typescript-action` README currently states that a reasonably modern Node.js version, 20.x or later, should work and that the template includes a `.node-version` file. [External source: `https://github.com/actions/typescript-action`]
- GitHub's September 19, 2025 changelog, updated May 19, 2026, says Node 20 is being deprecated for Actions and GitHub plans to migrate actions to Node 24, with runner support for Node 20 and Node 24. It also documents `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true` for testing Node 24 behavior. [External source: `https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/`]
- GitHub Action metadata docs include Node.js v24 examples for JavaScript actions. [External source: `https://docs.github.com/en/enterprise-cloud@latest/actions/creating-actions/metadata-syntax-for-github-actions`]

Implementation requirement: before finalizing `action.yml`, verify the starter's current `runs.using` support and prefer `node24` if supported by the current GitHub runner/tooling. If the starter still defaults to `node20`, document the reason for any temporary use of `node20` and add a clear follow-up note.

### Project Structure Requirements

Target structure from architecture:

```text
README.md
SECURITY.md
LICENSE
action.yml
package.json
package-lock.json
tsconfig.json
jest.config.js
eslint.config.mjs
prettier.config.mjs
.gitignore
.node-version
.github/
  workflows/
    ci.yml
    check-dist.yml
dist/
  index.js
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
__tests__/
  fixtures/
examples/
docs/
```

For Story 1.1, it is acceptable to create only starter-safe placeholders for later modules, but do not choose a different layout. Avoid generic `utils.ts`; shared helpers must belong to a named concern such as `security.ts`. [Source: `_bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries`]

### Naming and Metadata Requirements

- Files use kebab-case for source modules such as `github-context.ts` and `report-renderer.ts`.
- Types/interfaces use PascalCase.
- Functions use camelCase.
- Action inputs use kebab-case. Deeper input implementation belongs to Story 1.2, but do not introduce conflicting names in this story.
- Internal status values later use lowercase snake_case; rendered labels later use title case. Do not create incompatible starter constants now. [Source: `_bmad-output/planning-artifacts/architecture.md#Naming Patterns`]

### Testing Requirements

The starter must support tests from the first story. At minimum, keep one passing starter test or add a minimal smoke test that proves the Action entrypoint can be imported/executed without performing GitHub mutations.

Do not fake verification. The Dev Agent Record must list the commands run and whether they passed. If dependency installation is blocked by network or environment, record the blocker and the exact command attempted.

Future stories will add tests for event parsing, config, prechecks, report schema, renderer, comments, and security. This story should make that test expansion straightforward. [Source: `_bmad-output/planning-artifacts/architecture.md#Test Structure`]

### Security and Guardrails

Even though this story is setup-only, preserve the MVP guardrails:

- Do not add backend, database, dashboard, hosted service, GitHub App, repository code scan, Jira/Linear/Slack integration, workflow gate, people analytics, or required check behavior.
- Do not add code paths that mutate labels, assignees, issue body, issue state, repository files, workflow checks, or PRs.
- Do not interpolate Issue content into shell commands in any test, fixture, or workflow.
- Do not log secrets or private Issue body content.
- Keep dependencies narrow and consistent with the starter plus GitHub Actions Toolkit. [Source: `_bmad-output/planning-artifacts/prds/prd-serminal-2026-06-03/addendum.md#Technical Decisions Preserved for Architecture`; `_bmad-output/planning-artifacts/architecture.md#Security Boundary`]

### Dependencies and Hand-Off to Later Stories

- Story 1.2 will implement `github-token`, `openai-api-key`, and `ready-label` input behavior.
- Story 1.3 will implement `issues.labeled` Ready Label event recognition.
- Story 1.4 will skip pull requests and unsupported payloads.
- Story 1.5 will add duplicate/concurrency guidance.

Keep this story's implementation small enough that those stories can build on it without deleting large sample logic.

### No Previous Story Intelligence

This is the first implementation story. There are no previous story files or git commits in this workspace to reuse. The workspace currently contains planning artifacts only, so the developer should expect to bootstrap the actual Action repository structure.

## Project Structure Notes

- `D:\serminal` is not currently a git repository. If the implementation should become a git repository, initialize or clone the Action repository as part of this story only if that is consistent with the user's workspace intent.
- Existing BMad artifacts live under `_bmad-output/`; implementation code should live at the project root unless the user has already provided a separate Action repository folder.
- Do not edit planning artifacts to make implementation easier. The source of truth for story execution is this story plus the referenced PRD, architecture, and epics.

## References

- `_bmad-output/planning-artifacts/epics.md#Story 1.1: Set Up Initial Project from Starter Template`
- `_bmad-output/planning-artifacts/architecture.md#Starter Template Evaluation`
- `_bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries`
- `_bmad-output/planning-artifacts/prds/prd-serminal-2026-06-03/prd.md#9.1 In Scope`
- `_bmad-output/planning-artifacts/prds/prd-serminal-2026-06-03/addendum.md#Technical Decisions Preserved for Architecture`
- `https://github.com/actions/typescript-action`
- `https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/`
- `https://docs.github.com/en/enterprise-cloud@latest/actions/creating-actions/metadata-syntax-for-github-actions`

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm install` - passed; generated `package-lock.json`; local engine warning because Node is `v22.17.0` while project requires Node `>=24`.
- `npm test` - first run failed as intended in red phase because Jest did not map NodeNext `.js` imports to TypeScript sources.
- `npm test` - passed after Jest `moduleNameMapper` and TypeScript `isolatedModules` updates.
- `npm run build` - passed.
- `npm run lint` - first run failed because `jest.config.js` is CommonJS; passed after excluding that config file from ESLint's source lint set.
- `npm audit --json` - initially found `undici` advisories through GitHub Actions Toolkit dependencies; passed with 0 vulnerabilities after upgrading `@actions/github` and adding an `undici` override.
- `npm run package` - passed; generated `dist/index.js`.
- `npm run package:check` - passed; verified `dist/index.js` exists and will use `git diff` when a `.git` directory is available.
- `npm run format:check` - first run failed because Prettier scanned BMad artifacts and installed skills; passed after adding `.prettierignore`.
- `npm run all` - passed.
- `git rev-parse HEAD` - failed because the workspace was not a git repository; baseline recorded as `NO_VCS`.
- `git init` - attempted, but the managed Windows sandbox returned `windows sandbox: spawn setup refresh`; repository initialization was not completed in this environment.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Created the TypeScript GitHub Action starter baseline at the project root with package metadata, Node 24 action metadata, TypeScript, Jest, ESLint, Prettier, NCC bundling, CI workflows, and committed-style `dist/` output.
- Added architecture-directed placeholder modules for later stories without implementing Ready Label parsing, OpenAI calls, schema validation, report rendering behavior beyond a placeholder, GitHub comment posting, duplicate prevention, or other deferred MVP behavior.
- Added a smoke test proving the starter action can execute without GitHub mutations.
- Verified GitHub metadata support for `runs.using: node24` from current GitHub metadata docs; `.node-version` and `engines.node` are set to Node 24. Local validation ran on Node 22.17.0 and produced npm engine warnings only.
- Dependency audit passes with 0 vulnerabilities after updating the starter dependency set.

### Change Log

- 2026-06-03: Bootstrapped Dev Ticket Preflight TypeScript GitHub Action starter and validation workflow.

### File List

- `.github/workflows/check-dist.yml`
- `.github/workflows/ci.yml`
- `.gitignore`
- `.node-version`
- `.prettierignore`
- `LICENSE`
- `README.md`
- `SECURITY.md`
- `__tests__/action.test.ts`
- `__tests__/fixtures/.gitkeep`
- `action.yml`
- `dist/index.js`
- `dist/index.js.map`
- `dist/licenses.txt`
- `dist/sourcemap-register.js`
- `docs/.gitkeep`
- `eslint.config.mjs`
- `examples/.gitkeep`
- `jest.config.js`
- `package-lock.json`
- `package.json`
- `prettier.config.mjs`
- `scripts/check-dist.mjs`
- `src/action.ts`
- `src/config.ts`
- `src/github-comments.ts`
- `src/github-context.ts`
- `src/index.ts`
- `src/llm-client.ts`
- `src/prechecks.ts`
- `src/report-renderer.ts`
- `src/report-schema.ts`
- `src/security.ts`
- `tsconfig.json`
