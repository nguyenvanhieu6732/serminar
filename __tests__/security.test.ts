import { truncateText } from "../src/security.js"

describe("truncateText", () => {
  it("rejects invalid bounds before slicing", () => {
    expect(() => truncateText("hello", -1)).toThrow(
      "maxChars must be a non-negative safe integer"
    )
    expect(() => truncateText("hello", 1.5)).toThrow(
      "maxChars must be a non-negative safe integer"
    )
  })
})
