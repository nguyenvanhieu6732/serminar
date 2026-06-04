import { getOctokit } from "@actions/github"

export interface GitHubCommentTarget {
  readonly owner: string
  readonly repo: string
  readonly issueNumber: number
}

export interface CreateIssueCommentInput {
  readonly token: string
  readonly target: GitHubCommentTarget
  readonly body: string
}

export async function createIssueComment({
  token,
  target,
  body
}: CreateIssueCommentInput): Promise<number> {
  const octokit = getOctokit(token)
  const response = await octokit.rest.issues.createComment({
    owner: target.owner,
    repo: target.repo,
    issue_number: target.issueNumber,
    body
  })

  return response.data.id
}
