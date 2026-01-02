import { contextBridge, ipcRenderer } from "electron";

// IPC channel constants (inlined to avoid ESM/CJS issues)
const IPC = {
  sttStreamStart: "stt.streamStart",
  sttStreamPush: "stt.streamPush",
  sttStreamStop: "stt.streamStop",
  sttStreamCancel: "stt.streamCancel",
  sttStreamStatus: "stt.streamStatus",
  sttStreamEvent: "stt.streamEvent",
  llmHealthCheck: "llm.healthCheck",
  llmCompleteJSON: "llm.completeJSON",
  ttsSpeak: "tts.speak",
  ttsStop: "tts.stop",
  ttsStreamEvent: "tts.streamEvent",
  settingsGet: "settings.get",
  settingsUpdate: "settings.update",
  secretSet: "secret.set",
  secretDelete: "secret.delete",
  projectSave: "project:save",
  projectLoad: "project:load",
  exporterRun: "exporter:run",
} as const;

// Types (simplified for preload)
type SttStreamStartReq = { streamId: string; config?: unknown };
type SttStreamPushReq = { streamId: string; pcm16le: Uint8Array };
type SttStreamStopReq = { streamId: string };
type SttStreamCancelReq = { streamId: string };
type SttStreamStatusReq = { streamId: string };
type SttStreamEvent = { streamId: string; type: string;[key: string]: unknown };
type LlmHealthCheckReq = Record<string, unknown>;
type LlmCompleteJSONReq = { requestId: string;[key: string]: unknown };
type SettingsConfig = Record<string, unknown>;
type TtsSpeakReq = { requestId: string; text: string;[key: string]: unknown };
type TtsStopReq = Record<string, unknown>;
type TtsStreamEvent = { type: string;[key: string]: unknown };

const MAX_STREAM_ID_LENGTH = 64;
const MAX_CHUNK_SIZE = 65536; // 64KB

function validateStreamId(streamId: unknown): void {
  if (typeof streamId !== "string" || streamId.length === 0 || streamId.length > MAX_STREAM_ID_LENGTH) {
    throw new Error(`Invalid streamId: must be string of 1-${MAX_STREAM_ID_LENGTH} chars`);
  }
}

function validateChunk(chunk: Uint8Array): void {
  if (!(chunk instanceof Uint8Array)) {
    throw new Error("Invalid chunk: must be Uint8Array");
  }
  if (chunk.byteLength > MAX_CHUNK_SIZE) {
    throw new Error(`Chunk too large: ${chunk.byteLength} > ${MAX_CHUNK_SIZE}`);
  }
}

const bridge = {
  stt: {
    streamStart: async (req: SttStreamStartReq) => {
      validateStreamId(req.streamId);
      return ipcRenderer.invoke(IPC.sttStreamStart, req);
    },

    streamPush: (req: SttStreamPushReq) => {
      validateStreamId(req.streamId);
      validateChunk(req.pcm16le);
      ipcRenderer.send(IPC.sttStreamPush, req);
    },

    streamStop: async (req: SttStreamStopReq) => {
      validateStreamId(req.streamId);
      return ipcRenderer.invoke(IPC.sttStreamStop, req);
    },

    streamCancel: async (req: SttStreamCancelReq) => {
      validateStreamId(req.streamId);
      return ipcRenderer.invoke(IPC.sttStreamCancel, req);
    },

    streamStatus: async (req: SttStreamStatusReq) => {
      validateStreamId(req.streamId);
      return ipcRenderer.invoke(IPC.sttStreamStatus, req);
    },

    onStreamEvent: (cb: (ev: SttStreamEvent) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, data: SttStreamEvent) => cb(data);
      ipcRenderer.on(IPC.sttStreamEvent, handler);
      return () => {
        ipcRenderer.removeListener(IPC.sttStreamEvent, handler);
      };
    },
  },

  llm: {
    healthCheck: async (req: LlmHealthCheckReq) => {
      return ipcRenderer.invoke(IPC.llmHealthCheck, req);
    },

    completeJSON: async (req: LlmCompleteJSONReq) => {
      if (typeof req.requestId !== "string" || req.requestId.length === 0) {
        throw new Error("Invalid requestId");
      }
      return ipcRenderer.invoke(IPC.llmCompleteJSON, req);
    },
  },

  tts: {
    speak: async (req: TtsSpeakReq) => {
      if (typeof req.requestId !== "string" || req.requestId.length === 0) {
        throw new Error("Invalid requestId");
      }
      if (typeof req.text !== "string" || req.text.length === 0) {
        throw new Error("Invalid text: must be non-empty string");
      }
      return ipcRenderer.invoke(IPC.ttsSpeak, req);
    },

    stop: async (req: TtsStopReq) => {
      return ipcRenderer.invoke(IPC.ttsStop, req);
    },

    onStreamEvent: (cb: (ev: TtsStreamEvent) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, data: TtsStreamEvent) => cb(data);
      ipcRenderer.on(IPC.ttsStreamEvent, handler);
      return () => {
        ipcRenderer.removeListener(IPC.ttsStreamEvent, handler);
      };
    },
  },

  settings: {
    get: async () => {
      return ipcRenderer.invoke(IPC.settingsGet);
    },

    update: async (patch: Partial<SettingsConfig>) => {
      return ipcRenderer.invoke(IPC.settingsUpdate, patch);
    },
  },

  secrets: {
    set: async (key: string, value: string) => {
      if (typeof key !== "string" || key.length === 0) {
        throw new Error("Invalid key");
      }
      if (typeof value !== "string") {
        throw new Error("Invalid value");
      }
      return ipcRenderer.invoke(IPC.secretSet, key, value);
    },

    delete: async (key: string) => {
      if (typeof key !== "string" || key.length === 0) {
        throw new Error("Invalid key");
      }
      return ipcRenderer.invoke(IPC.secretDelete, key);
    },
  },
  project: {
    save: async (req: { workspaceDir: string; project: unknown }) => {
      return ipcRenderer.invoke(IPC.projectSave, req);
    },
    load: async (req: { workspaceDir: string }) => {
      return ipcRenderer.invoke(IPC.projectLoad, req);
    },
  },
  exporter: {
    run: async (req: { workspaceDir: string; project: unknown }) => {
      return ipcRenderer.invoke(IPC.exporterRun, req);
    },
  },
};

contextBridge.exposeInMainWorld("kidmod", bridge);
