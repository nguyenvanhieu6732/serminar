---
title: "Dev Ticket Preflight for GitHub Issues"
status: "draft"
created: "2026-06-03"
updated: "2026-06-03"
---

# Product Brief: Dev Ticket Preflight for GitHub Issues

## Executive Summary

Dev Ticket Preflight is a lightweight GitHub Issues assistant that checks whether an issue is clear enough before development starts. When a solo founder, indie hacker, or small startup marks an issue with `ready-for-dev`, the product analyzes the issue and posts a preflight report as a GitHub comment: readiness status, missing context, risk explanation, suggested questions, and a checklist the team can tick off.

The product exists for teams that manage work directly in GitHub Issues but do not have a dedicated PM, BA, QA lead, or mature refinement ritual. Their tickets often move from idea to implementation too quickly. The result is familiar: devs guess, scope drifts, edge cases appear late, and the team spends time reworking features that looked simple when written.

The first version should not block workflow or become a management dashboard. It should behave like a helpful pre-flight checklist: before the ticket “takes off” into development, it asks whether the essentials are clear enough for someone to build and test the work.

## The Problem

Small technical teams often use GitHub Issues as both planning tool and execution surface. That keeps workflow simple, but it also means requirements are often written quickly, informally, and without review. A ticket like “add export report feature” may omit user roles, file formats, error behavior, data range, permissions, and acceptance criteria.

For solo founders and indie hackers, the problem is not bureaucracy. They want to move fast, but vague issues make AI coding tools, contractors, collaborators, or even their future selves build the wrong thing. For small startups, the pain becomes sharper when different roles read the same issue differently: founder thinks outcome, developer thinks implementation, QA thinks testability.

Today they cope by asking clarifying questions in comments, writing ad hoc checklists, or relying on memory. That works until context is lost, a contributor joins late, or an AI/dev agent starts implementing from an underspecified issue.

## The Solution

Dev Ticket Preflight runs when a GitHub Issue receives the `ready-for-dev` label. It reads the issue title/body and comments a concise readiness report.

The report includes:

- **Preflight Status:** `Ready`, `Needs Clarification`, or `High Risk`
- **Missing Context:** acceptance criteria, actor, edge cases, permissions, error behavior, dependencies, design/reference, or non-functional expectations
- **Why This Matters:** a short explanation of likely rework or misunderstanding
- **Suggested Questions:** the few questions that would most improve readiness
- **Checklist:** actionable items the team can tick after updating the issue
- **Draft Acceptance Criteria:** generated only when enough context exists; otherwise the tool asks clarifying questions first

The MVP should be intentionally non-blocking. It comments and helps; it does not remove labels, fail checks, assign blame, or prevent work from starting.

## Who This Serves First

Primary users:

- Solo founders using GitHub Issues to organize product work
- Indie hackers building with AI coding assistants, contractors, or collaborators
- Small startups that do not yet have formal product/QA process

The first buyer/user is likely the same person: a technical founder or dev-oriented product lead who feels the cost of vague issues directly.

Secondary users later:

- Small software agencies
- Dev leads in early-stage startups
- PM/BA-light teams that live in GitHub rather than Jira

## What Makes This Different

GitHub already has AI-assisted issue triage that can analyze issues and suggest whether they need more information. Adjacent products also generate requirements, acceptance criteria, or test cases for tools like Jira and Azure DevOps. Dev Ticket Preflight should not compete as a generic “AI writes requirements” product.

Its wedge is narrower:

- It focuses on the moment before development starts, not initial backlog triage.
- It uses the team’s own readiness signal: the `ready-for-dev` label.
- It produces a checklist comment, not a separate document or dashboard.
- It evaluates ticket clarity, not people or team performance.
- It is GitHub-native first, aimed at lightweight teams that do not want Jira-scale process.

[ASSUMPTION] The strongest differentiation is workflow timing and low friction, not model quality. The model only has to be good enough to identify obvious gaps and ask useful questions.

## MVP Scope

In scope for MVP:

- GitHub App or GitHub Action setup for one repository
- Trigger on issue label `ready-for-dev`
- Analyze issue title/body and existing comments [ASSUMPTION: comments are useful context but should be optional in v1]
- Post one preflight comment per run
- Include checklist output in Markdown
- Support common issue types: feature, bug, UI change, API change, integration
- Allow manual rerun by reapplying label or using a command such as `/preflight` [ASSUMPTION]

Out of scope for MVP:

- Jira, Linear, Slack, or Teams integration
- Hard gating or required status checks
- Manager analytics, team scoring, or individual skill profiling
- Automatic label changes
- Full PRD/spec generation
- Persistent dashboard
- Codebase-aware implementation planning

## Success Criteria

Feasibility signals:

- A user can install/configure the tool in under 10 minutes.
- On 10 real GitHub Issues, at least 6 reports identify a gap the user agrees is useful.
- The report is short enough that users read it in the issue, not in a separate artifact.
- Users update at least 30% of flagged issues after receiving the checklist. [ASSUMPTION]
- Users prefer non-blocking comments over enforced workflow gates in the first version. [ASSUMPTION]

Business/product signals:

- Solo founders or indie hackers say they would use it before handing issues to an AI coding agent, contractor, or teammate.
- Small teams can explain the value in one sentence: “It catches vague tickets before we build.”
- Users ask for GitHub-native features before asking for Jira/Linear support.

## Key Risks

- **Too obvious:** The tool may only say things a competent PM would already know. Mitigation: optimize for teams without that PM layer and keep the output immediately actionable.
- **Too noisy:** If every issue gets warnings, users ignore it. Mitigation: run only on `ready-for-dev` and keep severity levels conservative.
- **Too generic:** Acceptance criteria generation is crowded. Mitigation: position around preflight readiness and missing-context detection, not content generation.
- **AI trust:** Users may not trust generated AC. Mitigation: frame AC as draft and prioritize questions when context is missing.
- **GitHub platform constraints:** GitHub App/Action permissions and UX may limit smooth installation. Mitigation: start with a GitHub Action proof of concept, then decide if an App is needed.

## Near-Term Experiments

1. **Manual smoke test:** Take 20 real GitHub Issues from personal/startup projects and manually produce preflight reports. Measure whether owners find them useful.
2. **Prompt-only prototype:** Build a GitHub Action that runs on `ready-for-dev` and comments a Markdown checklist.
3. **Report format test:** Compare three report formats: checklist-first, risk-first, and draft-AC-first.
4. **Trigger test:** Validate whether `ready-for-dev` is a natural label for target users or whether `/preflight` is less disruptive.
5. **Willingness test:** Ask target users whether they would install this in a real repo or only paste issues into ChatGPT.

## Open Questions

- Should the first implementation be a GitHub Action or GitHub App?
- Should the tool read only the issue body, or also comments and linked PRs?
- What issue templates should be supported first?
- Should repositories define their own preflight checklist rules?
- How much customization is needed before this becomes useful across different product types?

## Vision

If the MVP works, Dev Ticket Preflight can become a lightweight “definition of ready” layer for small GitHub-native teams. Over time, it could support custom readiness rules, repository-specific context, issue templates, AI coding agent handoff checks, and integrations with Jira/Linear for teams that outgrow GitHub-only planning.

The long-term product should stay anchored in the original principle: help the work become clearer before execution begins. Do not turn it into a people analytics system or a heavy project management platform.

## Sources And Market Signals

- GitHub Docs: AI issue triage can be triggered by labels and can suggest whether issues need more information.
- GitHub REST API: GitHub supports issue comments, labels, assignees, and issue management endpoints needed for this workflow.
- Finitive and similar products show market activity around AI-generated acceptance criteria, test cases, and requirements analysis.
