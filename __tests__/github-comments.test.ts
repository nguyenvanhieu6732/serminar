import {
  getOctokit,
  mockCreateComment,
  mockDeleteComment,
  mockUpdateComment
} from "./mocks/actions-github.js"
import { createIssueComment } from "../src/github-comments.js"

describe("createIssueComment", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateComment.mockResolvedValue({ data: { id: 123 } })
  })

  it("creates an issue comment with the exact target and body", async () => {
    await expect(
      createIssueComment({
        token: "github-token",
        target: {
          owner: "octo",
          repo: "repo",
          issueNumber: 42
        },
        body: "## Dev Ticket Preflight"
      })
    ).resolves.toBe(123)

    expect(getOctokit).toHaveBeenCalledWith("github-token")
    expect(mockCreateComment).toHaveBeenCalledWith({
      owner: "octo",
      repo: "repo",
      issue_number: 42,
      body: "## Dev Ticket Preflight"
    })
  })

  it("creates a new comment for every call", async () => {
    const input = {
      token: "github-token",
      target: {
        owner: "octo",
        repo: "repo",
        issueNumber: 42
      },
      body: "report"
    }

    await createIssueComment(input)
    await createIssueComment(input)

    expect(mockCreateComment).toHaveBeenCalledTimes(2)
    expect(mockUpdateComment).not.toHaveBeenCalled()
    expect(mockDeleteComment).not.toHaveBeenCalled()
  })

  it("propagates API failures without a fallback write", async () => {
    mockCreateComment.mockRejectedValue(new Error("private API detail"))

    await expect(
      createIssueComment({
        token: "github-token",
        target: {
          owner: "octo",
          repo: "repo",
          issueNumber: 42
        },
        body: "report"
      })
    ).rejects.toThrow("private API detail")

    expect(mockCreateComment).toHaveBeenCalledTimes(1)
    expect(mockUpdateComment).not.toHaveBeenCalled()
    expect(mockDeleteComment).not.toHaveBeenCalled()
  })
})
