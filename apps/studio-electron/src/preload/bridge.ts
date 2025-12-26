import { contextBridge, ipcRenderer } from "electron";
import {
  IPC,
  type SttStreamStartReq,
  type SttStreamPushReq,
  type SttStreamStopReq,
  type SttStreamCancelReq,
  type SttStreamStatusReq,
  type SttStreamEvent,
  type LlmHealthCheckReq,
  type LlmCompleteJSONReq,
  type SettingsConfig,
  type TtsSpeakReq,
  type TtsStopReq,
  type TtsStreamEvent,
} from "@kidmodstudio/ipc-contracts";

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
};

contextBridge.exposeInMainWorld("kidmod", bridge);
