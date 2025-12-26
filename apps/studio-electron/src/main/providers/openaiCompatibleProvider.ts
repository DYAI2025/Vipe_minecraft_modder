import log from "electron-log";
import type { LlmProvider, LlmMessage } from "./llmProvider.js";

interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface OpenAICompatibleConfig {
  baseUrl: string;
  model: string;
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

export class OpenAICompatibleProvider implements LlmProvider {
  private config: OpenAICompatibleConfig;

  constructor(config: OpenAICompatibleConfig) {
    this.config = {
      temperature: 0.7,
      maxTokens: 2048,
      timeoutMs: 60000,
      ...config,
    };
  }

  async healthCheck(): Promise<{ ok: boolean; latencyMs: number; message?: string }> {
    const start = Date.now();

    try {
      // Try to list models as a health check
      const response = await fetch(`${this.config.baseUrl}/models`, {
        method: "GET",
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(5000),
      });

      const latencyMs = Date.now() - start;

      if (response.ok) {
        return {
          ok: true,
          latencyMs,
          message: `Connected to ${this.config.baseUrl}`,
        };
      }

      // Some providers don't support /models, try a minimal completion
      const completionResponse = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: this.config.model,
          messages: [{ role: "user", content: "Hi" }],
          max_tokens: 5,
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (completionResponse.ok) {
        return {
          ok: true,
          latencyMs: Date.now() - start,
          message: `Connected to ${this.config.baseUrl} (model: ${this.config.model})`,
        };
      }

      return {
        ok: false,
        latencyMs: Date.now() - start,
        message: `Health check failed: ${completionResponse.status} ${completionResponse.statusText}`,
      };
    } catch (error) {
      return {
        ok: false,
        latencyMs: Date.now() - start,
        message: `Connection failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  async complete(messages: LlmMessage[]): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      log.debug(`[LLM] Sending request to ${this.config.baseUrl}/chat/completions`);
      log.debug(`[LLM] Model: ${this.config.model}, Messages: ${messages.length}`);

      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: this.config.model,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        log.error(`[LLM] API error: ${response.status} - ${errorText}`);
        throw new Error(`LLM API error: ${response.status} - ${errorText}`);
      }

      const data: OpenAIResponse = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new Error("No response choices from LLM");
      }

      const content = data.choices[0].message.content;
      log.debug(`[LLM] Response received: ${content.slice(0, 100)}...`);

      return content;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`LLM request timed out after ${this.config.timeoutMs}ms`);
      }

      throw error;
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.config.apiKey) {
      headers["Authorization"] = `Bearer ${this.config.apiKey}`;
    }

    return headers;
  }
}
