# Dev Ticket Preflight

Dev Ticket Preflight is a TypeScript GitHub Action that will analyze ready-labeled
GitHub Issues before implementation starts.

This repository currently contains the starter foundation for the Action. Later
stories will add issue event parsing, deterministic prechecks, LLM analysis,
report rendering, and GitHub Issue comments.

## Workflow Setup

Copy `examples/workflow.yml` into `.github/workflows/dev-ticket-preflight.yml`
and replace `your-org/dev-ticket-preflight@v0` with the Action reference for
your repository or release.

The workflow listens for `issues.labeled`, checks for the `ready-for-dev` label,
and skips pull requests because the MVP only evaluates GitHub Issues. The
example passes `github-token`, `openai-api-key`, and `ready-label` through
GitHub Actions inputs. Configure `OPENAI_API_KEY` as a repository secret; do not
hardcode API keys in workflow files.

The example requests `issues: write` because later MVP stories post the
Preflight Report as an Issue comment. The current routing-only implementation
does not yet create comments or perform any GitHub writes.

## Duplicate prevention

The example workflow uses a `concurrency.group` keyed by workflow, repository,
and issue number:

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.repository }}-issue-${{ github.event.issue.number }}
  cancel-in-progress: true
```

This reduces obvious duplicate runs for the same Issue in the same workflow.
With `cancel-in-progress: true`, a newer run in the same concurrency group
cancels an older overlapping run.

This is best-effort duplicate prevention, not a durable exactly-once guarantee.
Duplicate comments may still happen through manual reruns, separate workflows
with different concurrency groups, changed workflow examples, future append-only
comment behavior, or races outside GitHub Actions concurrency.

The Action remains advisory and non-blocking. It does not remove labels, does
not assign users, does not edit issues, does not close or reopen issues, does
not write repository files, and does not create required checks.

## Development

```bash
npm ci
npm run all
```

The committed Action entrypoint is `dist/index.js`, generated from `src/index.ts`.
