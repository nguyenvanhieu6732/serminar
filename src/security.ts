export function redactSecret(value: string): string {
  return value.length === 0 ? "" : "***"
}
