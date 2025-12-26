export const IPC = {
  // STT
  sttStreamStart: "stt.streamStart",
  sttStreamPush: "stt.streamPush",
  sttStreamStop: "stt.streamStop",
  sttStreamCancel: "stt.streamCancel",
  sttStreamStatus: "stt.streamStatus",
  sttStreamEvent: "stt.streamEvent",

  // LLM
  llmHealthCheck: "llm.healthCheck",
  llmCompleteJSON: "llm.completeJSON",

  // TTS
  ttsSpeak: "tts.speak",
  ttsStop: "tts.stop",
  ttsStreamEvent: "tts.streamEvent",

  // Settings
  settingsGet: "settings.get",
  settingsUpdate: "settings.update",

  // Secrets
  secretSet: "secret.set",
  secretDelete: "secret.delete",
} as const;

export type IpcChannel = (typeof IPC)[keyof typeof IPC];
