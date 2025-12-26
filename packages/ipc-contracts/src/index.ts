// ============================================================
// Locale & Secret Types
// ============================================================

export type LocaleTag = "de-DE" | "en-US";

export type SecretRef = `secret:${string}`;

// ============================================================
// STT Types
// ============================================================

export type SttProviderId = "livekit" | "webspeech" | "manual_text";

export interface SttCommonConfig {
  provider: SttProviderId;
  language: LocaleTag;
  sampleRateHz: 16000 | 48000;
  interimResults: boolean;
  maxUtteranceMs: number;
  endpointingMs: number;
}

export interface SttLiveKitConfig {
  provider: "livekit";
  endpointUrl: string;
  apiKeyRef?: SecretRef;
  model?: string;
  insecureSkipVerifyTLS?: boolean;
}

export interface SttWebSpeechConfig {
  provider: "webspeech";
}

export interface SttManualTextConfig {
  provider: "manual_text";
}

export type SttProviderConfig = SttLiveKitConfig | SttWebSpeechConfig | SttManualTextConfig;

// ============================================================
// LLM Types
// ============================================================

export type LlmProviderId = "openai_compatible";

export type LlmSafetyModeDefault = "actions_only" | "patch_fix";

export interface LlmOpenAICompatibleConfig {
  provider: "openai_compatible";
  baseUrl: string;
  apiKeyRef?: SecretRef;
  model: string;
  requestTimeoutMs: number;
  temperature: number;
  maxTokens: number;
  jsonMode: "strict" | "best_effort";
}

export type LlmProviderConfig = LlmOpenAICompatibleConfig;

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

// ============================================================
// Safety & UI Config
// ============================================================

export interface SafetyConfig {
  allowPatchMode: boolean;
  requireHumanReviewForPatches: true; // MUST be true
  patchWhitelistGlobs: string[];
  denylistRegexes: string[];
  maxPatchFiles: number;
  maxPatchBytes: number;
}

export interface UiConfig {
  kidMode: boolean;
  showDevDetails: boolean;
}

// ============================================================
// Settings Config (Main)
// ============================================================

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

// ============================================================
// STT Streaming IPC Types
// ============================================================

export type SttStreamId = string;

export interface SttStreamStartReq {
  streamId: SttStreamId;
  settingsOverride?: Partial<SettingsConfig["stt"]>;
}

export interface SttStreamStartRes {
  ok: boolean;
  streamId: SttStreamId;
  provider: SttProviderId;
  startedAtMs: number;
  message?: string;
}

export interface SttStreamPushReq {
  streamId: SttStreamId;
  chunkIndex: number;
  pcm16le: Uint8Array;
}

export interface SttStreamStopReq {
  streamId: SttStreamId;
}

export interface SttStreamStopRes {
  ok: boolean;
  streamId: SttStreamId;
  message?: string;
}

export interface SttStreamCancelReq {
  streamId: SttStreamId;
  reason?: string;
}

export interface SttStreamStatusReq {
  streamId: SttStreamId;
}

export type SttStreamState = "idle" | "streaming" | "stopping" | "error";

export interface SttStreamStatusRes {
  ok: boolean;
  streamId: SttStreamId;
  state: SttStreamState;
  provider: SttProviderId;
  lastError?: string;
}

export type SttStreamEvent =
  | {
      streamId: SttStreamId;
      type: "interim";
      text: string;
      confidence?: number;
      tMs: number;
    }
  | {
      streamId: SttStreamId;
      type: "final";
      text: string;
      confidence?: number;
      tMs: number;
    }
  | {
      streamId: SttStreamId;
      type: "state";
      state: "ready" | "listening" | "processing" | "done";
      tMs: number;
    }
  | {
      streamId: SttStreamId;
      type: "error";
      message: string;
      code?: string;
      tMs: number;
    };

// ============================================================
// LLM IPC Types
// ============================================================

export interface LlmHealthCheckReq {
  settingsOverride?: Partial<SettingsConfig["llm"]>;
}

export interface LlmHealthCheckRes {
  ok: boolean;
  baseUrl: string;
  model: string;
  latencyMs?: number;
  message?: string;
}

export interface LlmCompleteJSONReq {
  requestId: string;
  patternId?: string;
  messages?: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  jsonSchema: object;
  variables?: Record<string, unknown>;
  settingsOverride?: Partial<SettingsConfig["llm"]>;
  maxResponseBytes?: number;
}

export interface LlmCompleteJSONRes {
  ok: boolean;
  requestId: string;
  model?: string;
  latencyMs?: number;
  json?: unknown;
  rawText?: string;
  error?: { message: string; code?: string };
}

// ============================================================
// Preload Bridge Interface
// ============================================================

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

// ============================================================
// Error Codes
// ============================================================

export const ErrorCodes = {
  INVALID_PAYLOAD: "INVALID_PAYLOAD",
  STREAM_NOT_FOUND: "STREAM_NOT_FOUND",
  STREAM_ALREADY_EXISTS: "STREAM_ALREADY_EXISTS",
  PROVIDER_ERROR: "PROVIDER_ERROR",
  JSON_PARSE_FAILED: "JSON_PARSE_FAILED",
  SCHEMA_VALIDATION_FAILED: "SCHEMA_VALIDATION_FAILED",
  SECRET_NOT_FOUND: "SECRET_NOT_FOUND",
  SETTINGS_VALIDATION_FAILED: "SETTINGS_VALIDATION_FAILED",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

// Re-exports
export { IPC, type IpcChannel } from "./channels.js";
export { DEFAULT_SETTINGS } from "./defaults.js";
export { isValidSettings, validateSettingsWithErrors, validateSettings } from "./schemas/compiled/index.js";
