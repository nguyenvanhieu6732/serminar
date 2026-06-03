---
title: "Dev Ticket Preflight PRD Addendum"
created: "2026-06-03"
updated: "2026-06-03"
---

# PRD Addendum: Dev Ticket Preflight GitHub Action MVP

## Source Inputs

- Product brief: `_bmad-output/planning-artifacts/briefs/brief-serminal-2026-06-03/brief.md`
- Market research: `_bmad-output/planning-artifacts/research/market-dev-ticket-preflight-for-github-issues-research-2026-06-03.md`
- Technical research: `_bmad-output/planning-artifacts/research/technical-dev-ticket-preflight-github-action-mvp-research-2026-06-03.md`

## Technical Decisions Preserved for Architecture

- Start with a stateless TypeScript GitHub Action.
- Do not start with GitHub App, hosted SaaS, or database.
- Trigger on `issues.labeled` and filter `github.event.label.name == 'ready-for-dev'`.
- Use least-privilege permissions: `issues: write`; add `contents: read` only if repository config/prompt files are read.
- Treat Issue content as untrusted input.
- Never interpolate Issue title/body/comment into shell commands.
- Use deterministic prechecks before LLM calls.
- Ask the LLM for structured JSON, not final Markdown.
- Validate the structured report locally.
- Render Markdown from trusted local code.
- Post one GitHub Issue comment.
- Do not mutate labels, assignees, issue state, repository files, or workflow checks in MVP.

## Suggested Implementation Structure

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

## Research-Backed Rationale

Market research recommended **Go for validation MVP, not full SaaS**. The highest-value validation question is whether users update real Issues after receiving a preflight checklist.

Technical research recommended **GitHub Action-first** because it validates the workflow without webhooks, billing, database, hosted infrastructure, or GitHub App complexity.

## Deferred Technical Options

- GitHub App for multi-repo install, billing, centralized config, or richer UX.
- `/preflight` slash command via `issue_comment.created`.
- Update-in-place comment lifecycle using an HTML marker.
- Repository-specific readiness rules via `.github/dev-ticket-preflight.yml`.
- Optional inclusion of last N Issue comments.
- GitHub Models or alternative LLM provider.
- BYOK/self-hosted mode for private-repo trust.
