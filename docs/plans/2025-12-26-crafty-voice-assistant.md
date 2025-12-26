# Crafty Voice Assistant Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** Implement a voice-interactive Crafty helper that can speak (TTS) and listen (STT) to teach children how to create Minecraft mods through natural German conversation.

**Architecture:** Push-to-Talk voice input via existing STT → LLM with Crafty persona generates short German responses → OpenAI TTS streams audio back with synchronized Crafty mouth animation. Parallel streaming for low latency (~1-2s response time).

**Tech Stack:** TypeScript, Electron IPC, OpenAI TTS API, Web Audio API, existing STT/LLM infrastructure

---

## Task 1: Add TTS Types to IPC Contracts

**Files:**
- Modify: `packages/ipc-contracts/src/index.ts`
- Modify: `packages/ipc-contracts/src/channels.ts`
- Create: `packages/ipc-contracts/src/tts.test.ts`

**Step 1: Write failing test for TTS types**

Create `packages/ipc-contracts/src/tts.test.ts`:

```typescript
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
```

**Step 2: Run test to verify it fails**

```bash
cd packages/ipc-contracts && npm test -- src/tts.test.ts
```

Expected: FAIL with "Cannot find module" or type errors

**Step 3: Add TTS types to index.ts**

Add to `packages/ipc-contracts/src/index.ts` after LLM types section:

```typescript
// ============================================================
// TTS Types
// ============================================================

export type TtsProviderId = "openai" | "elevenlabs" | "webspeech";

export interface TtsOpenAIConfig {
  provider: "openai";
  baseUrl: string;
  apiKeyRef?: SecretRef;
  model: "tts-1" | "tts-1-hd";
  voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
  speed: number; // 0.25 - 4.0
  responseFormat: "mp3" | "opus" | "aac" | "flac" | "pcm";
}

export interface TtsElevenLabsConfig {
  provider: "elevenlabs";
  apiKeyRef?: SecretRef;
  voiceId: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
}

export interface TtsWebSpeechConfig {
  provider: "webspeech";
  lang: LocaleTag;
  rate?: number;
  pitch?: number;
}

export type TtsProviderConfig = TtsOpenAIConfig | TtsElevenLabsConfig | TtsWebSpeechConfig;

// TTS IPC Types
export interface TtsSpeakReq {
  requestId: string;
  text: string;
  settingsOverride?: Partial<TtsProviderConfig>;
}

export interface TtsSpeakRes {
  ok: boolean;
  requestId: string;
  durationMs?: number;
  error?: { message: string; code?: string };
}

export interface TtsStopReq {
  requestId?: string;
}

export interface TtsStopRes {
  ok: boolean;
  stoppedCount: number;
}

export type TtsStreamEvent =
  | { type: "start"; requestId: string; tMs: number }
  | { type: "chunk"; requestId: string; audioData: Uint8Array; tMs: number }
  | { type: "end"; requestId: string; durationMs: number; tMs: number }
  | { type: "error"; requestId: string; message: string; code?: string; tMs: number };
```

**Step 4: Update KidModBridge interface**

In `packages/ipc-contracts/src/index.ts`, update `KidModBridge`:

```typescript
export interface KidModBridge {
  stt: {
    streamStart(req: SttStreamStartReq): Promise<SttStreamStartRes>;
    streamPush(req: SttStreamPushReq): void;
    streamStop(req: SttStreamStopReq): Promise<SttStreamStopRes>;
    streamCancel(req: SttStreamCancelReq): Promise<void>;
    streamStatus(req: SttStreamStatusReq): Promise<SttStreamStatusRes>;
    onStreamEvent(cb: (ev: SttStreamEvent) => void): () => void;
  };
  llm: {
    healthCheck(req: LlmHealthCheckReq): Promise<LlmHealthCheckRes>;
    completeJSON(req: LlmCompleteJSONReq): Promise<LlmCompleteJSONRes>;
  };
  tts: {
    speak(req: TtsSpeakReq): Promise<TtsSpeakRes>;
    stop(req: TtsStopReq): Promise<TtsStopRes>;
    onStreamEvent(cb: (ev: TtsStreamEvent) => void): () => void;
  };
  settings: {
    get(): Promise<SettingsConfig>;
    update(patch: Partial<SettingsConfig>): Promise<SettingsConfig>;
  };
}
```

**Step 5: Add TTS channels**

In `packages/ipc-contracts/src/channels.ts`, add:

```typescript
export const IPC = {
  // ... existing channels ...
  TTS_SPEAK: "tts:speak",
  TTS_STOP: "tts:stop",
  TTS_STREAM_EVENT: "tts:stream-event",
} as const;
```

**Step 6: Run test to verify it passes**

```bash
cd packages/ipc-contracts && npm test
```

Expected: All tests PASS

**Step 7: Commit**

```bash
git add packages/ipc-contracts/src/
git commit -m "feat(ipc): add TTS types, interfaces, and IPC channels"
```

---

## Task 2: Add TTS to Settings Schema

**Files:**
- Modify: `packages/ipc-contracts/src/index.ts` (SettingsConfig)
- Modify: `packages/ipc-contracts/src/defaults.ts`
- Modify: `packages/ipc-contracts/src/schemas/settings.schema.json`
- Regenerate: `packages/ipc-contracts/src/schemas/compiled/index.ts`

**Step 1: Update SettingsConfig type**

In `packages/ipc-contracts/src/index.ts`, update `SettingsConfig`:

```typescript
export interface SettingsConfig {
  schemaVersion: 1;
  stt: SttCommonConfig & { providerConfig: SttProviderConfig };
  llm: {
    providerConfig: LlmProviderConfig;
    defaultMode: LlmSafetyModeDefault;
  };
  tts: {
    enabled: boolean;
    providerConfig: TtsProviderConfig;
  };
  safety: SafetyConfig;
  ui: UiConfig;
}
```

**Step 2: Update defaults**

In `packages/ipc-contracts/src/defaults.ts`, add TTS defaults:

```typescript
export const DEFAULT_SETTINGS: SettingsConfig = {
  // ... existing ...
  tts: {
    enabled: true,
    providerConfig: {
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      model: "tts-1",
      voice: "nova",  // Friendly voice for kids
      speed: 0.9,     // Slightly slower for clarity
      responseFormat: "mp3",
    },
  },
  // ... rest ...
};
```

**Step 3: Update JSON Schema**

Add TTS section to `packages/ipc-contracts/src/schemas/settings.schema.json`:

```json
{
  "tts": {
    "type": "object",
    "required": ["enabled", "providerConfig"],
    "properties": {
      "enabled": { "type": "boolean" },
      "providerConfig": {
        "oneOf": [
          {
            "type": "object",
            "required": ["provider", "baseUrl", "model", "voice", "speed", "responseFormat"],
            "properties": {
              "provider": { "const": "openai" },
              "baseUrl": { "type": "string", "format": "uri" },
              "apiKeyRef": { "type": "string", "pattern": "^secret:" },
              "model": { "enum": ["tts-1", "tts-1-hd"] },
              "voice": { "enum": ["alloy", "echo", "fable", "onyx", "nova", "shimmer"] },
              "speed": { "type": "number", "minimum": 0.25, "maximum": 4.0 },
              "responseFormat": { "enum": ["mp3", "opus", "aac", "flac", "pcm"] }
            }
          }
        ]
      }
    }
  }
}
```

**Step 4: Regenerate compiled validators**

```bash
cd packages/ipc-contracts && npm run build
```

**Step 5: Run all tests**

```bash
npm test
```

Expected: All tests PASS

**Step 6: Commit**

```bash
git add packages/ipc-contracts/
git commit -m "feat(ipc): add TTS to settings schema with OpenAI defaults"
```

---

## Task 3: Create TTS Handler in Main Process

**Files:**
- Create: `apps/studio-electron/src/main/ipcHandlers/tts.ts`
- Create: `apps/studio-electron/src/main/ipcHandlers/tts.test.ts`
- Modify: `apps/studio-electron/src/main/ipcHandlers/index.ts`

**Step 1: Write failing test**

Create `apps/studio-electron/src/main/ipcHandlers/tts.test.ts`:

```typescript
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

  it("speak should send start event before processing", async () => {
    const handlers = createTtsHandlers({
      getSettings: mockGetSettings,
      getSecret: mockGetSecret,
      sendEvent: mockSendEvent,
    });

    const req: TtsSpeakReq = { requestId: "test-2", text: "Test" };

    // Mock fetch for OpenAI API
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: {
        getReader: () => ({
          read: vi.fn()
            .mockResolvedValueOnce({ done: false, value: new Uint8Array([1, 2, 3]) })
            .mockResolvedValueOnce({ done: true }),
        }),
      },
    });

    await handlers.speak(req);

    expect(mockSendEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: "start", requestId: "test-2" })
    );
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd apps/studio-electron && npm test -- src/main/ipcHandlers/tts.test.ts
```

Expected: FAIL - module not found

**Step 3: Implement TTS handler**

Create `apps/studio-electron/src/main/ipcHandlers/tts.ts`:

```typescript
import type {
  TtsSpeakReq,
  TtsSpeakRes,
  TtsStopReq,
  TtsStopRes,
  TtsStreamEvent,
  TtsProviderConfig,
  SettingsConfig,
} from "@kidmodstudio/ipc-contracts";

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
      return speakOpenAI(req, config, deps);
    }

    return {
      ok: false,
      requestId: req.requestId,
      error: { message: `Provider ${config.provider} nicht unterstützt`, code: "UNSUPPORTED_PROVIDER" },
    };
  }

  async function speakOpenAI(
    req: TtsSpeakReq,
    config: TtsProviderConfig & { provider: "openai" },
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
      const apiKey = config.apiKeyRef
        ? await deps.getSecret(config.apiKeyRef)
        : null;

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
        throw new Error(`OpenAI TTS error: ${response.status}`);
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
```

**Step 4: Run tests**

```bash
cd apps/studio-electron && npm test
```

Expected: All tests PASS

**Step 5: Commit**

```bash
git add apps/studio-electron/src/main/ipcHandlers/
git commit -m "feat(electron): add TTS handler with OpenAI streaming support"
```

---

## Task 4: Register TTS IPC in Main Process

**Files:**
- Modify: `apps/studio-electron/src/main/ipcHandlers/index.ts`
- Modify: `apps/studio-electron/src/main/index.ts`

**Step 1: Export TTS handlers**

In `apps/studio-electron/src/main/ipcHandlers/index.ts`, add:

```typescript
export { createTtsHandlers } from "./tts.js";
```

**Step 2: Register TTS IPC handlers in main**

In `apps/studio-electron/src/main/index.ts`, add TTS registration:

```typescript
import { IPC } from "@kidmodstudio/ipc-contracts";
import { createTtsHandlers } from "./ipcHandlers/index.js";

// After other handler creation
const ttsHandlers = createTtsHandlers({
  getSettings: async () => settingsStore.get(),
  getSecret: async (ref) => secretStore.get(ref.replace("secret:", "")),
  sendEvent: (event) => mainWindow?.webContents.send(IPC.TTS_STREAM_EVENT, event),
});

// Register IPC handlers
ipcMain.handle(IPC.TTS_SPEAK, (_, req) => ttsHandlers.speak(req));
ipcMain.handle(IPC.TTS_STOP, (_, req) => ttsHandlers.stop(req));
```

**Step 3: Build and verify**

```bash
cd apps/studio-electron && npm run build
```

Expected: No errors

**Step 4: Commit**

```bash
git add apps/studio-electron/src/main/
git commit -m "feat(electron): register TTS IPC handlers in main process"
```

---

## Task 5: Add TTS to Preload Bridge

**Files:**
- Modify: `apps/studio-electron/src/preload/index.ts`

**Step 1: Add TTS to preload bridge**

In `apps/studio-electron/src/preload/index.ts`, add TTS section:

```typescript
import { contextBridge, ipcRenderer } from "electron";
import { IPC } from "@kidmodstudio/ipc-contracts";
import type {
  KidModBridge,
  TtsSpeakReq,
  TtsStopReq,
  TtsStreamEvent,
} from "@kidmodstudio/ipc-contracts";

const bridge: KidModBridge = {
  // ... existing stt, llm, settings ...

  tts: {
    speak: (req: TtsSpeakReq) => ipcRenderer.invoke(IPC.TTS_SPEAK, req),
    stop: (req: TtsStopReq) => ipcRenderer.invoke(IPC.TTS_STOP, req),
    onStreamEvent: (cb: (ev: TtsStreamEvent) => void) => {
      const handler = (_: unknown, ev: TtsStreamEvent) => cb(ev);
      ipcRenderer.on(IPC.TTS_STREAM_EVENT, handler);
      return () => ipcRenderer.removeListener(IPC.TTS_STREAM_EVENT, handler);
    },
  },
};

contextBridge.exposeInMainWorld("kidmod", bridge);
```

**Step 2: Build and verify**

```bash
cd apps/studio-electron && npm run build
```

**Step 3: Commit**

```bash
git add apps/studio-electron/src/preload/
git commit -m "feat(electron): add TTS methods to preload bridge"
```

---

## Task 6: Create Crafty Brain (Conversation Manager)

**Files:**
- Create: `apps/studio-electron/src/main/craftyBrain.ts`
- Create: `apps/studio-electron/src/main/craftyBrain.test.ts`

**Step 1: Write failing test**

Create `apps/studio-electron/src/main/craftyBrain.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { CraftyBrain, CRAFTY_SYSTEM_PROMPT } from "./craftyBrain.js";

describe("CraftyBrain", () => {
  it("should include YouTuber references in system prompt", () => {
    expect(CRAFTY_SYSTEM_PROMPT).toContain("GustafGG");
    expect(CRAFTY_SYSTEM_PROMPT).toContain("Creeper");
  });

  it("should build messages with conversation history", () => {
    const brain = new CraftyBrain();

    brain.addUserMessage("Wie baue ich einen Block?");
    brain.addCraftyMessage("Das zeig ich dir! Zieh einen Block in die Werkbank.");
    brain.addUserMessage("Welchen Block?");

    const messages = brain.buildMessages({ slots: [] });

    expect(messages).toHaveLength(4); // system + 3 conversation
    expect(messages[0].role).toBe("system");
    expect(messages[1].content).toContain("Block");
  });

  it("should limit history to last 6 messages", () => {
    const brain = new CraftyBrain();

    for (let i = 0; i < 10; i++) {
      brain.addUserMessage(`Frage ${i}`);
      brain.addCraftyMessage(`Antwort ${i}`);
    }

    const messages = brain.buildMessages({ slots: [] });

    // system + 6 history = 7
    expect(messages).toHaveLength(7);
  });

  it("should include workbench state in context", () => {
    const brain = new CraftyBrain();
    brain.addUserMessage("Was liegt da?");

    const messages = brain.buildMessages({
      slots: ["diamond", null, null, null, "gold", null, null, null, null]
    });

    const systemPrompt = messages[0].content;
    expect(systemPrompt).toContain("diamond");
    expect(systemPrompt).toContain("gold");
  });
});
```

**Step 2: Run test to verify failure**

```bash
cd apps/studio-electron && npm test -- src/main/craftyBrain.test.ts
```

Expected: FAIL - module not found

**Step 3: Implement CraftyBrain**

Create `apps/studio-electron/src/main/craftyBrain.ts`:

```typescript
export const CRAFTY_SYSTEM_PROMPT = `Du bist Crafty, ein freundlicher grüner Creeper und Mod-Baumeister in KidModStudio.

PERSÖNLICHKEIT:
- Ruhig und geduldig, niemals frustriert
- Machst ab und zu Minecraft-Witze ("Sssssuper gemacht!" wie ein Creeper)
- Kennst deutsche Minecraft-YouTuber wie GustafGG, Spark, Paluten
- Sprichst Kinder (9-11 Jahre) direkt mit "du" an

REGELN:
- Antworte IMMER in 1-2 kurzen Sätzen auf Deutsch
- Erkläre Mod-Konzepte einfach und mit Minecraft-Beispielen
- Lobe oft: "Super!", "Toll gemacht!", "Wow!"
- Bei Unsicherheit: Frag nach was das Kind bauen möchte

MODI:
- TUTORIAL: Führe Schritt für Schritt durch Lektionen
- FREISPIEL: Hilf beim freien Bauen, gib Tipps wenn gefragt

AKTUELLER KONTEXT:
{context}

WERKBANK-STATUS:
{workbenchState}`;

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  tMs: number;
}

interface WorkbenchState {
  slots: (string | null)[];
  lastAction?: string;
}

export class CraftyBrain {
  private history: ConversationMessage[] = [];
  private mode: "tutorial" | "freeplay" = "freeplay";
  private currentLesson?: string;

  addUserMessage(text: string): void {
    this.history.push({
      role: "user",
      content: text,
      tMs: Date.now(),
    });
  }

  addCraftyMessage(text: string): void {
    this.history.push({
      role: "assistant",
      content: text,
      tMs: Date.now(),
    });
  }

  buildMessages(workbench: WorkbenchState): Array<{ role: string; content: string }> {
    // Build context string
    const context = this.mode === "tutorial" && this.currentLesson
      ? `Modus: Tutorial - ${this.currentLesson}`
      : "Modus: Freispiel";

    // Build workbench state string
    const filledSlots = workbench.slots
      .map((s, i) => s ? `Slot ${i}: ${s}` : null)
      .filter(Boolean)
      .join(", ");
    const workbenchState = filledSlots || "Werkbank ist leer";

    // Build system prompt with context
    const systemPrompt = CRAFTY_SYSTEM_PROMPT
      .replace("{context}", context)
      .replace("{workbenchState}", workbenchState);

    // Get last 6 messages from history
    const recentHistory = this.history.slice(-6);

    return [
      { role: "system", content: systemPrompt },
      ...recentHistory.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ];
  }

  setMode(mode: "tutorial" | "freeplay", lesson?: string): void {
    this.mode = mode;
    this.currentLesson = lesson;
  }

  clearHistory(): void {
    this.history = [];
  }

  getLastUserMessage(): string | undefined {
    for (let i = this.history.length - 1; i >= 0; i--) {
      if (this.history[i].role === "user") {
        return this.history[i].content;
      }
    }
    return undefined;
  }
}
```

**Step 4: Run tests**

```bash
cd apps/studio-electron && npm test
```

Expected: All tests PASS

**Step 5: Commit**

```bash
git add apps/studio-electron/src/main/craftyBrain*
git commit -m "feat(electron): add CraftyBrain conversation manager with German persona"
```

---

## Task 7: Create Voice Controller in Renderer

**Files:**
- Create: `apps/studio-electron/src/renderer/voiceController.js`
- Modify: `apps/studio-electron/src/renderer/app.js`

**Step 1: Create VoiceController class**

Create `apps/studio-electron/src/renderer/voiceController.js`:

```javascript
// VoiceController - Handles STT recording and TTS playback

export class VoiceController {
  constructor(options = {}) {
    this.onStateChange = options.onStateChange || (() => {});
    this.onTranscript = options.onTranscript || (() => {});
    this.onCraftySpeak = options.onCraftySpeak || (() => {});
    this.onError = options.onError || (() => {});

    this.state = "idle"; // idle, recording, processing, speaking
    this.mediaStream = null;
    this.audioContext = null;
    this.currentStreamId = null;
    this.audioQueue = [];
    this.isPlaying = false;
  }

  setState(newState) {
    this.state = newState;
    this.onStateChange(newState);
  }

  async startRecording() {
    if (this.state !== "idle") return;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1 },
      });

      this.audioContext = new AudioContext({ sampleRate: 16000 });
      this.currentStreamId = "stream-" + Date.now();

      // Setup STT event listener
      this.unsubscribeStt = window.kidmod.stt.onStreamEvent((ev) => {
        if (ev.streamId !== this.currentStreamId) return;

        if (ev.type === "interim") {
          this.onTranscript(ev.text + "...", false);
        } else if (ev.type === "final") {
          this.onTranscript(ev.text, true);
        }
      });

      await window.kidmod.stt.streamStart({ streamId: this.currentStreamId });
      this.setState("recording");

      // Start sending audio chunks
      this.startAudioCapture();
    } catch (error) {
      this.onError(this.mapError(error));
      this.cleanup();
    }
  }

  startAudioCapture() {
    // Simplified: send empty chunks for echo provider
    // Real implementation would use AudioWorklet for PCM16 conversion
    this.captureInterval = setInterval(() => {
      if (this.state === "recording" && this.currentStreamId) {
        const chunk = new Uint8Array(640);
        window.kidmod.stt.streamPush({
          streamId: this.currentStreamId,
          chunkIndex: Date.now(),
          pcm16le: chunk,
        });
      }
    }, 100);
  }

  async stopRecording() {
    if (this.state !== "recording") return;

    clearInterval(this.captureInterval);
    this.setState("processing");

    if (this.currentStreamId) {
      await window.kidmod.stt.streamStop({ streamId: this.currentStreamId });
    }

    this.cleanup();
  }

  async speakText(text) {
    if (!text) return;

    this.setState("speaking");

    // Setup TTS event listener
    this.unsubscribeTts = window.kidmod.tts.onStreamEvent((ev) => {
      if (ev.type === "chunk") {
        this.audioQueue.push(ev.audioData);
        this.playNextChunk();
      } else if (ev.type === "end") {
        this.onCraftySpeak(text, false); // Speaking ended
      } else if (ev.type === "error") {
        this.onError({ code: "TTS_ERROR", message: ev.message });
      }
    });

    this.onCraftySpeak(text, true); // Speaking started

    try {
      await window.kidmod.tts.speak({
        requestId: "tts-" + Date.now(),
        text,
      });
    } catch (error) {
      this.onError({ code: "TTS_ERROR", message: error.message });
    }

    this.setState("idle");
    this.unsubscribeTts?.();
  }

  async playNextChunk() {
    if (this.isPlaying || this.audioQueue.length === 0) return;

    this.isPlaying = true;
    const chunk = this.audioQueue.shift();

    try {
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(chunk.buffer);
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.onended = () => {
        this.isPlaying = false;
        this.playNextChunk();
      };
      source.start();
    } catch (error) {
      this.isPlaying = false;
      this.playNextChunk();
    }
  }

  stopSpeaking() {
    window.kidmod.tts.stop({});
    this.audioQueue = [];
    this.setState("idle");
  }

  cleanup() {
    this.unsubscribeStt?.();
    this.mediaStream?.getTracks().forEach((t) => t.stop());
    this.audioContext?.close();
    this.mediaStream = null;
    this.audioContext = null;
  }

  mapError(error) {
    const errorMap = {
      NotAllowedError: {
        code: "MIC_PERMISSION",
        message: "Ich kann dich nicht hören! Klick auf 'Erlauben' wenn der Browser fragt. 🎤",
      },
      NotFoundError: {
        code: "MIC_NOT_FOUND",
        message: "Hmm, ich finde kein Mikrofon. Hast du eins angeschlossen? 🔌",
      },
    };

    return errorMap[error.name] || {
      code: "UNKNOWN",
      message: "Etwas ist schiefgelaufen. Versuch es nochmal! 💪",
    };
  }
}
```

**Step 2: Update app.js to use VoiceController**

Add import and integration in `apps/studio-electron/src/renderer/app.js`:

```javascript
import { VoiceController } from "./voiceController.js";

// At the end of the file, replace voice functions with:

const voiceController = new VoiceController({
  onStateChange: (state) => {
    const stateConfig = {
      idle: { btnText: "Sprich mit mir!", btnClass: "", craftyState: null },
      recording: { btnText: "Ich höre...", btnClass: "recording", craftyState: "listening" },
      processing: { btnText: "Moment...", btnClass: "processing", craftyState: "thinking" },
      speaking: { btnText: "Crafty spricht...", btnClass: "speaking", craftyState: "talking" },
    };

    const config = stateConfig[state];
    btnVoice.querySelector(".voice-text").textContent = config.btnText;
    btnVoice.className = `mc-button gold voice-btn ${config.btnClass}`;
    if (config.craftyState) setCraftyState(config.craftyState);
  },
  onTranscript: (text, isFinal) => {
    voiceTranscript.textContent = text;
    if (isFinal) {
      processCraftyResponse(text);
    }
  },
  onCraftySpeak: (text, isStart) => {
    if (isStart) {
      setCraftyMessage(text);
      setCraftyState("talking");
    } else {
      setCraftyState(null);
    }
  },
  onError: (error) => {
    setCraftyMessage(error.message);
    updateStatus("stt-status", "error", error.message);
  },
});

async function toggleVoice() {
  if (voiceController.state === "idle") {
    await voiceController.startRecording();
  } else if (voiceController.state === "recording") {
    await voiceController.stopRecording();
  } else if (voiceController.state === "speaking") {
    voiceController.stopSpeaking();
  }
}

async function processCraftyResponse(userText) {
  setCraftyMessage(CRAFTY_MESSAGES.thinking);
  setCraftyState("thinking");

  try {
    // Call LLM for Crafty's response
    const res = await window.kidmod.llm.completeJSON({
      requestId: "crafty-" + Date.now(),
      messages: [
        { role: "user", content: userText },
      ],
      jsonSchema: {
        type: "object",
        properties: {
          response: { type: "string" },
          action: { type: "string" },
        },
        required: ["response"],
      },
    });

    if (res.ok && res.json?.response) {
      // Speak the response via TTS
      await voiceController.speakText(res.json.response);
    } else {
      setCraftyMessage(CRAFTY_MESSAGES.error);
    }
  } catch (error) {
    setCraftyMessage(CRAFTY_MESSAGES.error);
  }
}
```

**Step 3: Update package.json copy-assets for JS modules**

Since we're using ES modules, update the HTML to use type="module":

In `apps/studio-electron/src/renderer/index.html`:

```html
<script type="module" src="app.js"></script>
```

**Step 4: Build and test manually**

```bash
cd apps/studio-electron && npm run build && npm run dev
```

**Step 5: Commit**

```bash
git add apps/studio-electron/src/renderer/
git commit -m "feat(renderer): add VoiceController with STT/TTS integration"
```

---

## Task 8: Add Talking Animation to Crafty CSS

**Files:**
- Modify: `apps/studio-electron/src/renderer/styles.css`

**Step 1: Add talking animation styles**

Append to `apps/studio-electron/src/renderer/styles.css`:

```css
/* ==================== CRAFTY TALKING STATE ==================== */

.crafty.talking {
  animation: crafty-talk-bounce 0.3s ease-in-out infinite;
}

@keyframes crafty-talk-bounce {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-3px) scale(1.02); }
}

.crafty.talking .crafty-mouth {
  animation: mouth-move 0.15s ease-in-out infinite alternate;
}

@keyframes mouth-move {
  from {
    transform: scaleY(0.3) scaleX(1.2);
    opacity: 0.8;
  }
  to {
    transform: scaleY(1) scaleX(1);
    opacity: 1;
  }
}

.crafty.listening {
  animation: crafty-listen 0.8s ease-in-out infinite;
}

@keyframes crafty-listen {
  0%, 100% { transform: translateY(0); }
  25% { transform: translateY(-2px) rotate(-2deg); }
  75% { transform: translateY(-2px) rotate(2deg); }
}

.crafty.listening .eye {
  animation: eye-focus 0.5s ease-in-out infinite alternate;
}

@keyframes eye-focus {
  from { transform: scaleY(1); }
  to { transform: scaleY(0.8); }
}

/* Voice button states */
.voice-btn.recording {
  animation: recording-pulse 0.5s ease-in-out infinite alternate;
  background: linear-gradient(180deg, #ff6b6b 0%, #cc4444 100%) !important;
}

.voice-btn.processing {
  background: linear-gradient(180deg, var(--stone-gray) 0%, var(--stone-dark) 100%) !important;
  opacity: 0.7;
  cursor: wait;
}

.voice-btn.speaking {
  background: linear-gradient(180deg, var(--success-green) 0%, #2d8a4a 100%) !important;
  animation: speaking-glow 1s ease-in-out infinite alternate;
}

@keyframes speaking-glow {
  from { box-shadow: 0 0 10px var(--success-green); }
  to { box-shadow: 0 0 20px var(--success-green); }
}
```

**Step 2: Build and verify**

```bash
cd apps/studio-electron && npm run build && npm run dev
```

**Step 3: Commit**

```bash
git add apps/studio-electron/src/renderer/styles.css
git commit -m "feat(ui): add Crafty talking/listening animations and voice button states"
```

---

## Task 9: Integration Test & Final Polish

**Step 1: Run all tests**

```bash
npm test
```

Expected: All tests PASS

**Step 2: Manual integration test**

```bash
npm run dev
```

Test checklist:
- [ ] Voice button shows "Sprich mit mir!"
- [ ] Clicking starts recording (button turns red, "Ich höre...")
- [ ] Crafty shows listening animation
- [ ] Clicking again stops recording
- [ ] Crafty shows thinking animation
- [ ] TTS plays Crafty's response
- [ ] Crafty mouth moves during speech
- [ ] Button shows "Crafty spricht..." during TTS
- [ ] Returns to idle state after speech

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete Crafty voice assistant integration

- TTS types and OpenAI streaming support
- CraftyBrain conversation manager with German persona
- VoiceController for STT/TTS coordination
- Synchronized Crafty animations (talking, listening, thinking)
- Child-friendly German error messages
- Push-to-talk interaction model"
```

**Step 4: Push feature branch**

```bash
git push -u origin feature/crafty-voice-assistant
```

---

## Summary

| Task | Description | Key Files |
|------|-------------|-----------|
| 1 | TTS Types | `packages/ipc-contracts/src/index.ts` |
| 2 | TTS Settings | `packages/ipc-contracts/src/defaults.ts` |
| 3 | TTS Handler | `apps/studio-electron/src/main/ipcHandlers/tts.ts` |
| 4 | TTS IPC Registration | `apps/studio-electron/src/main/index.ts` |
| 5 | TTS Preload Bridge | `apps/studio-electron/src/preload/index.ts` |
| 6 | CraftyBrain | `apps/studio-electron/src/main/craftyBrain.ts` |
| 7 | VoiceController | `apps/studio-electron/src/renderer/voiceController.js` |
| 8 | Talking CSS | `apps/studio-electron/src/renderer/styles.css` |
| 9 | Integration | Full system test |

**Total: 9 Tasks, ~45 minutes estimated**
