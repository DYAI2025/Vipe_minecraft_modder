import type { SettingsConfig } from "./index.js";

export const DEFAULT_SETTINGS: SettingsConfig = {
  schemaVersion: 1,
  workspace: {
    rootPath: "", // Will be set to user documents/KidModStudio on first run
    autoCreate: true,
  },
  stt: {
    provider: "livekit",
    language: "de-DE",
    sampleRateHz: 16000,
    interimResults: true,
    maxUtteranceMs: 120000,
    endpointingMs: 800,
    providerConfig: {
      provider: "livekit",
      endpointUrl: "https://YOUR_STT_ENDPOINT",
      apiKeyRef: "secret:livekit_api_key",
      model: "default",
    },
  },
  llm: {
    providerConfig: {
      provider: "openai_compatible",
      baseUrl: "http://127.0.0.1:11434/v1",
      apiKeyRef: "secret:llm_api_key",
      model: "llama3.2:latest",
      requestTimeoutMs: 60000,
      temperature: 0.2,
      maxTokens: 2048,
      jsonMode: "strict",
    },
    defaultMode: "actions_only",
  },
  tts: {
    enabled: true,
    providerConfig: {
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      apiKeyRef: "secret:openai_api_key",
      model: "tts-1",
      voice: "nova", // Friendly voice for kids
      speed: 0.9, // Slightly slower for clarity
      responseFormat: "mp3",
    },
  },
  safety: {
    allowPatchMode: true,
    requireHumanReviewForPatches: true,
    patchWhitelistGlobs: [
      "templates/fabric-1.20.1/src/main/java/**",
      "templates/fabric-1.20.1/src/main/resources/**",
      "generated/**",
    ],
    denylistRegexes: [
      "\\bRuntime\\.exec\\b",
      "\\bProcessBuilder\\b",
      "\\bjava\\.net\\b",
      "\\bsocket\\b",
      "\\bFiles\\.write\\b",
      "\\bFileOutputStream\\b",
    ],
    maxPatchFiles: 10,
    maxPatchBytes: 200000,
  },
  ui: {
    kidMode: true,
    showDevDetails: false,
  },
};
