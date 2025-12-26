import { describe, it, expect } from "vitest";
import type {
  TtsProviderId,
  TtsOpenAIConfig,
  TtsSpeakReq,
  TtsSpeakRes,
  TtsStreamEvent,
} from "./index.js";

describe("TTS Types", () => {
  it("should allow valid TtsProviderId values", () => {
    const providers: TtsProviderId[] = ["openai", "elevenlabs", "webspeech"];
    expect(providers).toHaveLength(3);
  });

  it("should create valid TtsOpenAIConfig", () => {
    const config: TtsOpenAIConfig = {
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      apiKeyRef: "secret:openai_key",
      model: "tts-1",
      voice: "nova",
      speed: 1.0,
      responseFormat: "mp3",
    };
    expect(config.provider).toBe("openai");
    expect(config.voice).toBe("nova");
  });

  it("should create valid TtsSpeakReq", () => {
    const req: TtsSpeakReq = {
      requestId: "tts-123",
      text: "Hallo, ich bin Crafty!",
    };
    expect(req.text).toContain("Crafty");
  });

  it("should create valid TtsSpeakRes", () => {
    const res: TtsSpeakRes = {
      ok: true,
      requestId: "tts-123",
      durationMs: 1500,
    };
    expect(res.ok).toBe(true);
  });

  it("should create valid TtsStreamEvent variants", () => {
    const startEvent: TtsStreamEvent = {
      type: "start",
      requestId: "tts-123",
      tMs: Date.now(),
    };
    const chunkEvent: TtsStreamEvent = {
      type: "chunk",
      requestId: "tts-123",
      audioData: new Uint8Array(1024),
      tMs: Date.now(),
    };
    const endEvent: TtsStreamEvent = {
      type: "end",
      requestId: "tts-123",
      durationMs: 1500,
      tMs: Date.now(),
    };
    expect(startEvent.type).toBe("start");
    expect(chunkEvent.type).toBe("chunk");
    expect(endEvent.type).toBe("end");
  });
});
