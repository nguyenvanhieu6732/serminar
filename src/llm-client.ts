export interface LlmClient {
  analyze(input: string): Promise<unknown>
}
