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
import { MockLlmProvider, generateFromSchema } from "../providers/mockLlmProvider.js";
import type { LlmProvider } from "../providers/llmProvider.js";

const ajv = new Ajv.default({ allErrors: true });
addFormats.default(ajv);

function getProvider(): LlmProvider {
  const config = settingsStore.get().llm.providerConfig;
  // For now, always use mock provider
  return new MockLlmProvider(config.baseUrl, config.model);
}

export function registerLlmHandlers(): void {
  // llm.healthCheck
  ipcMain.handle(IPC.llmHealthCheck, async (event, req: LlmHealthCheckReq): Promise<LlmHealthCheckRes> => {
    const config = settingsStore.get().llm.providerConfig;
    const provider = getProvider();

    try {
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
    const provider = getProvider();

    try {
      // Build messages
      const messages = req.messages ?? [
        { role: "system" as const, content: "You are a helpful assistant. Respond with valid JSON only." },
        { role: "user" as const, content: "Generate a response matching the provided schema." },
      ];

      // For mock: generate from schema instead of calling LLM
      // In production, this would call provider.complete(messages)
      const rawText = JSON.stringify(generateFromSchema(req.jsonSchema));

      // Parse JSON
      let parsed: unknown;
      try {
        parsed = JSON.parse(rawText);
      } catch (parseError) {
        log.error("JSON parse failed:", parseError);
        return {
          ok: false,
          requestId: req.requestId,
          model: config.llm.providerConfig.model,
          latencyMs: Date.now() - startTime,
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
          message: String(error),
          code: ErrorCodes.PROVIDER_ERROR,
        },
      };
    }
  });
}
