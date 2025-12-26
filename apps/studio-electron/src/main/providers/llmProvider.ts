export interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LlmProvider {
  healthCheck(): Promise<{ ok: boolean; latencyMs: number; message?: string }>;
  complete(messages: LlmMessage[]): Promise<string>;
}
