import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTtsHandlers } from "./tts.js";
import type { TtsSpeakReq } from "@kidmodstudio/ipc-contracts";

describe("TTS Handlers", () => {
  const mockSettings = {
    tts: {
      enabled: true,
      providerConfig: {
        provider: "openai" as const,
        baseUrl: "https://api.openai.com/v1",
        model: "tts-1" as const,
        voice: "nova" as const,
        speed: 1.0,
        responseFormat: "mp3" as const,
      },
    },
  };

  const mockGetSettings = vi.fn(() => Promise.resolve(mockSettings));
  const mockGetSecret = vi.fn(() => Promise.resolve("test-api-key"));
  const mockSendEvent = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create handlers object with speak and stop methods", () => {
    const handlers = createTtsHandlers({
      getSettings: mockGetSettings,
      getSecret: mockGetSecret,
      sendEvent: mockSendEvent,
    });

    expect(handlers.speak).toBeDefined();
    expect(handlers.stop).toBeDefined();
  });

  it("speak should return error when TTS is disabled", async () => {
    mockGetSettings.mockResolvedValueOnce({
      tts: { enabled: false, providerConfig: mockSettings.tts.providerConfig },
    });

    const handlers = createTtsHandlers({
      getSettings: mockGetSettings,
      getSecret: mockGetSecret,
      sendEvent: mockSendEvent,
    });

    const req: TtsSpeakReq = { requestId: "test-1", text: "Hallo!" };
    const res = await handlers.speak(req);

    expect(res.ok).toBe(false);
    expect(res.error?.code).toBe("TTS_DISABLED");
  });

  it("stop should return ok with stoppedCount", () => {
    const handlers = createTtsHandlers({
      getSettings: mockGetSettings,
      getSecret: mockGetSecret,
      sendEvent: mockSendEvent,
    });

    const res = handlers.stop({});
    expect(res.ok).toBe(true);
    expect(res.stoppedCount).toBe(0);
  });
});
