import { ipcMain, type WebContents } from "electron";
import log from "electron-log";
import {
  IPC,
  ErrorCodes,
  type SttStreamStartReq,
  type SttStreamStartRes,
  type SttStreamPushReq,
  type SttStreamStopReq,
  type SttStreamStopRes,
  type SttStreamCancelReq,
  type SttStreamStatusReq,
  type SttStreamStatusRes,
  type SttStreamState,
  type SttStreamEvent,
} from "@kidmodstudio/ipc-contracts";
import type { SttProvider } from "../providers/sttProvider.js";
import { createSttProvider } from "../providers/sttProviderFactory.js";
import { settingsStore } from "../settingsStore.js";

interface StreamSession {
  id: string;
  provider: SttProvider;
  state: SttStreamState;
  startedAt: number;
  webContents: WebContents;
}

const activeSessions = new Map<string, StreamSession>();

const MAX_CHUNK_SIZE = 65536; // 64KB

function validateStreamId(streamId: unknown): streamId is string {
  return typeof streamId === "string" && streamId.length > 0 && streamId.length <= 64;
}

function sendEvent(session: StreamSession, event: Omit<SttStreamEvent, "streamId">): void {
  const fullEvent: SttStreamEvent = { ...event, streamId: session.id } as SttStreamEvent;
  if (!session.webContents.isDestroyed()) {
    session.webContents.send(IPC.sttStreamEvent, fullEvent);
  }
}

export function registerSttHandlers(): void {
  // stt.streamStart
  ipcMain.handle(IPC.sttStreamStart, async (event, req: SttStreamStartReq): Promise<SttStreamStartRes> => {
    if (!validateStreamId(req.streamId)) {
      return {
        ok: false,
        streamId: req.streamId ?? "",
        provider: "livekit",
        startedAtMs: Date.now(),
        message: "Invalid streamId",
      };
    }

    if (activeSessions.has(req.streamId)) {
      return {
        ok: false,
        streamId: req.streamId,
        provider: "livekit",
        startedAtMs: Date.now(),
        message: ErrorCodes.STREAM_ALREADY_EXISTS,
      };
    }

    // Create provider based on settings
    const settings = settingsStore.get();
    const provider = createSttProvider(settings);
    log.info(`[STT] Using provider: ${provider.providerId}`);
    const session: StreamSession = {
      id: req.streamId,
      provider,
      state: "idle",
      startedAt: Date.now(),
      webContents: event.sender,
    };

    // Wire up events
    provider.onEvent((ev) => sendEvent(session, ev));

    activeSessions.set(req.streamId, session);

    try {
      await provider.start();
      session.state = "streaming";
      log.info(`STT stream started: ${req.streamId}`);

      return {
        ok: true,
        streamId: req.streamId,
        provider: provider.providerId,
        startedAtMs: session.startedAt,
      };
    } catch (error) {
      activeSessions.delete(req.streamId);
      return {
        ok: false,
        streamId: req.streamId,
        provider: provider.providerId,
        startedAtMs: session.startedAt,
        message: String(error),
      };
    }
  });

  // stt.streamPush (fire-and-forget)
  ipcMain.on(IPC.sttStreamPush, (event, req: SttStreamPushReq) => {
    if (!validateStreamId(req.streamId)) {
      log.warn("Invalid streamId in streamPush");
      return;
    }

    const session = activeSessions.get(req.streamId);
    if (!session) {
      log.warn(`Stream not found: ${req.streamId}`);
      return;
    }

    if (req.pcm16le.byteLength > MAX_CHUNK_SIZE) {
      log.warn(`Chunk too large: ${req.pcm16le.byteLength} > ${MAX_CHUNK_SIZE}`);
      return;
    }

    session.provider.pushChunk(req.pcm16le, req.chunkIndex);
  });

  // stt.streamStop
  ipcMain.handle(IPC.sttStreamStop, async (event, req: SttStreamStopReq): Promise<SttStreamStopRes> => {
    if (!validateStreamId(req.streamId)) {
      return { ok: false, streamId: req.streamId ?? "", message: "Invalid streamId" };
    }

    const session = activeSessions.get(req.streamId);
    if (!session) {
      return { ok: false, streamId: req.streamId, message: ErrorCodes.STREAM_NOT_FOUND };
    }

    try {
      session.state = "stopping";
      await session.provider.stop();
      activeSessions.delete(req.streamId);
      log.info(`STT stream stopped: ${req.streamId}`);
      return { ok: true, streamId: req.streamId };
    } catch (error) {
      return { ok: false, streamId: req.streamId, message: String(error) };
    }
  });

  // stt.streamCancel
  ipcMain.handle(IPC.sttStreamCancel, async (event, req: SttStreamCancelReq): Promise<void> => {
    if (!validateStreamId(req.streamId)) return;

    const session = activeSessions.get(req.streamId);
    if (!session) return;

    session.provider.cancel();
    activeSessions.delete(req.streamId);
    log.info(`STT stream cancelled: ${req.streamId}`);
  });

  // stt.streamStatus
  ipcMain.handle(IPC.sttStreamStatus, async (event, req: SttStreamStatusReq): Promise<SttStreamStatusRes> => {
    if (!validateStreamId(req.streamId)) {
      return {
        ok: false,
        streamId: req.streamId ?? "",
        state: "error",
        provider: "livekit",
        lastError: "Invalid streamId",
      };
    }

    const session = activeSessions.get(req.streamId);
    if (!session) {
      return {
        ok: false,
        streamId: req.streamId,
        state: "error",
        provider: "livekit",
        lastError: ErrorCodes.STREAM_NOT_FOUND,
      };
    }

    return {
      ok: true,
      streamId: req.streamId,
      state: session.state,
      provider: session.provider.providerId,
    };
  });
}
