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

  // Settings
  settingsGet: "settings.get",
  settingsUpdate: "settings.update",
} as const;

export type IpcChannel = (typeof IPC)[keyof typeof IPC];
