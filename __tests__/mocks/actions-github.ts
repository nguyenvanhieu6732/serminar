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

export const getOctokit = jest.fn(() => ({
  rest: {
    issues: {
      createComment: mockCreateComment,
      updateComment: mockUpdateComment,
      deleteComment: mockDeleteComment
    }
  }
}))
