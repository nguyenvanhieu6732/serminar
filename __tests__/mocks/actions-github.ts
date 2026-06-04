export const context: {
  eventName: string
  payload: unknown
} = {
  eventName: "",
  payload: {}
}

export const mockCreateComment = jest.fn()
export const mockUpdateComment = jest.fn()
export const mockDeleteComment = jest.fn()
export const mockAddLabels = jest.fn()
export const mockRemoveLabel = jest.fn()
export const mockAddAssignees = jest.fn()
export const mockRemoveAssignees = jest.fn()
export const mockUpdateIssue = jest.fn()
export const mockCreateCheck = jest.fn()
export const mockCreateOrUpdateFileContents = jest.fn()
export const mockUpdatePullRequest = jest.fn()

export const mockForbiddenGitHubMutations = [
  mockUpdateComment,
  mockDeleteComment,
  mockAddLabels,
  mockRemoveLabel,
  mockAddAssignees,
  mockRemoveAssignees,
  mockUpdateIssue,
  mockCreateCheck,
  mockCreateOrUpdateFileContents,
  mockUpdatePullRequest
]

export const getOctokit = jest.fn(() => ({
  rest: {
    issues: {
      createComment: mockCreateComment,
      updateComment: mockUpdateComment,
      deleteComment: mockDeleteComment,
      addLabels: mockAddLabels,
      removeLabel: mockRemoveLabel,
      addAssignees: mockAddAssignees,
      removeAssignees: mockRemoveAssignees,
      update: mockUpdateIssue
    },
    checks: {
      create: mockCreateCheck
    },
    repos: {
      createOrUpdateFileContents: mockCreateOrUpdateFileContents
    },
    pulls: {
      update: mockUpdatePullRequest
    }
  }
}))
