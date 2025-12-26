import type {
  TtsSpeakReq,
  TtsSpeakRes,
  TtsStopReq,
  TtsStopRes,
  TtsStreamEvent,
  TtsProviderConfig,
  TtsOpenAIConfig,
  SettingsConfig,
} from "@kidmodstudio/ipc-contracts";
import log from "electron-log";

interface TtsHandlerDeps {
  getSettings: () => Promise<Pick<SettingsConfig, "tts">>;
  getSecret: (ref: string) => Promise<string | null>;
  sendEvent: (event: TtsStreamEvent) => void;
}

interface ActiveStream {
  requestId: string;
  abortController: AbortController;
  startTime: number;
}

export function createTtsHandlers(deps: TtsHandlerDeps) {
  const activeStreams = new Map<string, ActiveStream>();

  async function speak(req: TtsSpeakReq): Promise<TtsSpeakRes> {
    const { tts } = await deps.getSettings();

    if (!tts.enabled) {
      return {
        ok: false,
        requestId: req.requestId,
        error: { message: "TTS ist deaktiviert", code: "TTS_DISABLED" },
      };
    }

    const config = req.settingsOverride
      ? { ...tts.providerConfig, ...req.settingsOverride }
      : tts.providerConfig;

    if (config.provider === "openai") {
      return speakOpenAI(req, config as TtsOpenAIConfig, deps);
    }

    return {
      ok: false,
      requestId: req.requestId,
      error: { message: `Provider ${config.provider} nicht unterstützt`, code: "UNSUPPORTED_PROVIDER" },
    };
  }

  async function speakOpenAI(
    req: TtsSpeakReq,
    config: TtsOpenAIConfig,
    deps: TtsHandlerDeps
  ): Promise<TtsSpeakRes> {
    const startTime = Date.now();
    const abortController = new AbortController();

    activeStreams.set(req.requestId, {
      requestId: req.requestId,
      abortController,
      startTime,
    });

    deps.sendEvent({ type: "start", requestId: req.requestId, tMs: startTime });

    try {
      log.info("[TTS] OpenAI config:", JSON.stringify(config, null, 2));

      const apiKey = config.apiKeyRef
        ? await deps.getSecret(config.apiKeyRef)
        : null;

      log.info("[TTS] API Key found:", apiKey ? "yes (length: " + apiKey.length + ")" : "no");
      log.info("[TTS] Calling:", `${config.baseUrl}/audio/speech`);

      const response = await fetch(`${config.baseUrl}/audio/speech`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
        },
        body: JSON.stringify({
          model: config.model,
          input: req.text,
          voice: config.voice,
          speed: config.speed,
          response_format: config.responseFormat,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        log.error("[TTS] OpenAI error response:", response.status, errorText);
        throw new Error(`OpenAI TTS error: ${response.status} - ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        deps.sendEvent({
          type: "chunk",
          requestId: req.requestId,
          audioData: value,
          tMs: Date.now(),
        });
      }

      const durationMs = Date.now() - startTime;
      deps.sendEvent({
        type: "end",
        requestId: req.requestId,
        durationMs,
        tMs: Date.now(),
      });

      activeStreams.delete(req.requestId);

      return { ok: true, requestId: req.requestId, durationMs };
    } catch (error) {
      activeStreams.delete(req.requestId);
      log.error("[TTS] Error:", error);

      const message = error instanceof Error ? error.message : "Unknown error";
      deps.sendEvent({
        type: "error",
        requestId: req.requestId,
        message,
        tMs: Date.now(),
      });

      return {
        ok: false,
        requestId: req.requestId,
        error: { message, code: "TTS_ERROR" },
      };
    }
  }

  function stop(req: TtsStopReq): TtsStopRes {
    if (req.requestId) {
      const stream = activeStreams.get(req.requestId);
      if (stream) {
        stream.abortController.abort();
        activeStreams.delete(req.requestId);
        return { ok: true, stoppedCount: 1 };
      }
      return { ok: true, stoppedCount: 0 };
    }

    // Stop all
    const count = activeStreams.size;
    for (const stream of activeStreams.values()) {
      stream.abortController.abort();
    }
    activeStreams.clear();
    return { ok: true, stoppedCount: count };
  }

  return { speak, stop };
}
