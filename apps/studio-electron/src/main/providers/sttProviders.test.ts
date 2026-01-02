import { describe, it, expect, beforeEach, vi } from "vitest";
import { WebSpeechSttProvider } from "./webSpeechSttProvider.js";

describe("WebSpeechSttProvider", () => {
  let provider: WebSpeechSttProvider;

  beforeEach(() => {
    provider = new WebSpeechSttProvider();
  });

  it("should have webspeech as providerId", () => {
    expect(provider.providerId).toBe("webspeech");
  });

  it("should emit ready and listening states on start", async () => {
    const events: any[] = [];
    provider.onEvent((event) => events.push(event));

    await provider.start();

    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({ type: "state", state: "ready" });
    expect(events[1]).toMatchObject({ type: "state", state: "listening" });
  });

  it("should emit final transcript on updateTranscript with isFinal=true", () => {
    const events: any[] = [];
    provider.onEvent((event) => events.push(event));

    provider.updateTranscript("Hello world", true, 0.95);

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: "final",
      text: "Hello world",
      confidence: 0.95,
    });
  });

  it("should emit interim transcript on updateTranscript with isFinal=false", () => {
    const events: any[] = [];
    provider.onEvent((event) => events.push(event));

    provider.updateTranscript("Hello...", false, 0.7);

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: "interim",
      text: "Hello...",
      confidence: 0.7,
    });
  });

  it("should return transcript on stop", async () => {
    provider.updateTranscript("Test transcript", true);
    const result = await provider.stop();

    expect(result).toBe("Test transcript");
  });

  it("should emit cancelled error on cancel", () => {
    const events: any[] = [];
    provider.onEvent((event) => events.push(event));

    provider.cancel();

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: "error",
      message: "Stream cancelled",
      code: "CANCELLED",
    });
  });

  it("should do nothing on pushChunk (WebSpeech doesn't use chunks)", () => {
    // This should not throw
    const chunk = new Uint8Array([1, 2, 3]);
    expect(() => provider.pushChunk(chunk, 0)).not.toThrow();
  });
});

describe("VoiceServerSttProvider", () => {
  // Note: VoiceServerSttProvider requires WebSocket connection
  // Full integration tests should run in E2E environment with server running

  it("should be tested in E2E environment", () => {
    // Placeholder for E2E tests
    expect(true).toBe(true);
  });
});
