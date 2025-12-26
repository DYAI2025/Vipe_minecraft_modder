import { ipcMain } from "electron";
import Ajv, { type ErrorObject } from "ajv";
import addFormats from "ajv-formats";
import log from "electron-log";
import {
  IPC,
  ErrorCodes,
  type LlmHealthCheckReq,
  type LlmHealthCheckRes,
  type LlmCompleteJSONReq,
  type LlmCompleteJSONRes,
} from "@kidmodstudio/ipc-contracts";
import { settingsStore } from "../settingsStore.js";
import { secretStore } from "../secretStore.js";
import { OpenAICompatibleProvider } from "../providers/openaiCompatibleProvider.js";
import type { LlmProvider } from "../providers/llmProvider.js";

const ajv = new Ajv.default({ allErrors: true });
addFormats.default(ajv);

async function getProvider(): Promise<LlmProvider> {
  const config = settingsStore.get().llm.providerConfig;

  // Get API key if configured
  let apiKey: string | undefined;
  if (config.apiKeyRef) {
    const secret = await secretStore.get(config.apiKeyRef);
    if (secret) {
      apiKey = secret;
    }
  }

  return new OpenAICompatibleProvider({
    baseUrl: config.baseUrl,
    model: config.model,
    apiKey,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    timeoutMs: config.requestTimeoutMs,
  });
}

export function registerLlmHandlers(): void {
  // llm.healthCheck
  ipcMain.handle(IPC.llmHealthCheck, async (event, req: LlmHealthCheckReq): Promise<LlmHealthCheckRes> => {
    const config = settingsStore.get().llm.providerConfig;

    try {
      const provider = await getProvider();
      const result = await provider.healthCheck();
      return {
        ok: result.ok,
        baseUrl: config.baseUrl,
        model: config.model,
        latencyMs: result.latencyMs,
        message: result.message,
      };
    } catch (error) {
      log.error("LLM health check failed:", error);
      return {
        ok: false,
        baseUrl: config.baseUrl,
        model: config.model,
        message: String(error),
      };
    }
  });

  // llm.completeJSON
  ipcMain.handle(IPC.llmCompleteJSON, async (event, req: LlmCompleteJSONReq): Promise<LlmCompleteJSONRes> => {
    const startTime = Date.now();
    const config = settingsStore.get();

    try {
      const provider = await getProvider();

      // Build messages with JSON instruction
      const schemaStr = JSON.stringify(req.jsonSchema, null, 2);
      const jsonInstruction = `Respond with valid JSON only. Your response must match this schema:\n${schemaStr}\n\nRespond with ONLY the JSON object, no markdown, no explanation.`;

      const messages = req.messages
        ? [
            // Inject JSON instruction into system message
            {
              role: "system" as const,
              content: req.messages[0]?.role === "system"
                ? `${req.messages[0].content}\n\n${jsonInstruction}`
                : jsonInstruction,
            },
            ...req.messages.filter((m) => m.role !== "system" || req.messages![0]?.role !== "system"),
          ]
        : [
            { role: "system" as const, content: jsonInstruction },
            { role: "user" as const, content: "Generate a response." },
          ];

      log.debug(`[LLM] Calling provider with ${messages.length} messages`);
      const rawText = await provider.complete(messages);

      // Extract JSON from response (handle markdown code blocks)
      let jsonText = rawText.trim();
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.slice(7);
      } else if (jsonText.startsWith("```")) {
        jsonText = jsonText.slice(3);
      }
      if (jsonText.endsWith("```")) {
        jsonText = jsonText.slice(0, -3);
      }
      jsonText = jsonText.trim();

      // Parse JSON
      let parsed: unknown;
      try {
        parsed = JSON.parse(jsonText);
      } catch (parseError) {
        log.error("JSON parse failed:", parseError, "Raw:", rawText);
        return {
          ok: false,
          requestId: req.requestId,
          model: config.llm.providerConfig.model,
          latencyMs: Date.now() - startTime,
          rawText: config.ui.showDevDetails ? rawText : undefined,
          error: {
            message: "Failed to parse LLM response as JSON",
            code: ErrorCodes.JSON_PARSE_FAILED,
          },
        };
      }

      // Validate against schema
      const validate = ajv.compile(req.jsonSchema);
      const valid = validate(parsed);

      if (!valid) {
        const errors = validate.errors?.map((e) => `${e.instancePath} ${e.message}`).join("; ");
        log.error("Schema validation failed:", errors);
        return {
          ok: false,
          requestId: req.requestId,
          model: config.llm.providerConfig.model,
          latencyMs: Date.now() - startTime,
          rawText: config.ui.showDevDetails ? rawText : undefined,
          error: {
            message: `Schema validation failed: ${errors}`,
            code: ErrorCodes.SCHEMA_VALIDATION_FAILED,
          },
        };
      }

      const response: LlmCompleteJSONRes = {
        ok: true,
        requestId: req.requestId,
        model: config.llm.providerConfig.model,
        latencyMs: Date.now() - startTime,
        json: parsed,
      };

      // Only include rawText if showDevDetails is true
      if (config.ui.showDevDetails) {
        response.rawText = rawText;
      }

      return response;
    } catch (error) {
      log.error("LLM completion failed:", error);
      return {
        ok: false,
        requestId: req.requestId,
        model: config.llm.providerConfig.model,
        latencyMs: Date.now() - startTime,
        error: {
          message: error instanceof Error ? error.message : String(error),
          code: ErrorCodes.PROVIDER_ERROR,
        },
      };
    }
  });
}
