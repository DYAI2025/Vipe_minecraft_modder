import type { LlmProvider, LlmMessage } from "./llmProvider.js";

export class MockLlmProvider implements LlmProvider {
  constructor(
    private baseUrl: string,
    private model: string
  ) {}

  async healthCheck(): Promise<{ ok: boolean; latencyMs: number; message?: string }> {
    const start = Date.now();
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 50));
    return {
      ok: true,
      latencyMs: Date.now() - start,
      message: `Mock connected to ${this.baseUrl}`,
    };
  }

  async complete(messages: LlmMessage[]): Promise<string> {
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Return a mock JSON response
    // In real implementation, this would call the LLM API
    return JSON.stringify({
      action: "create_block",
      blockId: "custom_block",
      properties: {
        hardness: 1.5,
        resistance: 6.0,
      },
    });
  }
}

// Schema-based JSON generator for mock responses
export function generateFromSchema(schema: object): unknown {
  const s = schema as any;

  if (s.const !== undefined) return s.const;
  if (s.enum) return s.enum[0];

  switch (s.type) {
    case "string":
      return s.default ?? "mock_string";
    case "number":
    case "integer":
      return s.default ?? s.minimum ?? 0;
    case "boolean":
      return s.default ?? true;
    case "null":
      return null;
    case "array":
      if (s.items) {
        return [generateFromSchema(s.items)];
      }
      return [];
    case "object":
      const obj: Record<string, unknown> = {};
      if (s.properties) {
        for (const [key, propSchema] of Object.entries(s.properties)) {
          obj[key] = generateFromSchema(propSchema as object);
        }
      }
      return obj;
    default:
      return null;
  }
}
