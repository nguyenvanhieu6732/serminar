export function redactSecret(value: string): string {
  return value.length === 0 ? "" : "***"
}

export interface TruncatedText {
  readonly value: string
  readonly originalLength: number
  readonly truncated: boolean
  readonly reason: "within_limit" | "body_truncated"
}

export function truncateText(value: string, maxChars: number): TruncatedText {
  if (!Number.isSafeInteger(maxChars) || maxChars < 0) {
    throw new RangeError("maxChars must be a non-negative safe integer")
  }

  if (value.length <= maxChars) {
    return {
      value,
      originalLength: value.length,
      truncated: false,
      reason: "within_limit"
    }
  }

  return {
    value: value.slice(0, maxChars),
    originalLength: value.length,
    truncated: true,
    reason: "body_truncated"
  }
}
