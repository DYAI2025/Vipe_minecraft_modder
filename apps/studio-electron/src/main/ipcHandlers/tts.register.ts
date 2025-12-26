import { ipcMain, BrowserWindow } from "electron";
import log from "electron-log";
import { IPC, type TtsSpeakReq, type TtsStopReq, type TtsStreamEvent, type SecretRef } from "@kidmodstudio/ipc-contracts";
import { settingsStore } from "../settingsStore.js";
import { secretStore } from "../secretStore.js";
import { createTtsHandlers } from "./tts.js";

export function registerTtsHandlers(): void {
  const handlers = createTtsHandlers({
    getSettings: async () => {
      const settings = settingsStore.get();
      return { tts: settings.tts };
    },
    getSecret: async (ref: string) => {
      return secretStore.get(ref as SecretRef);
    },
    sendEvent: (event: TtsStreamEvent) => {
      const windows = BrowserWindow.getAllWindows();
      for (const win of windows) {
        win.webContents.send(IPC.ttsStreamEvent, event);
      }
    },
  });

  ipcMain.handle(IPC.ttsSpeak, async (_event: unknown, req: TtsSpeakReq) => {
    log.debug("[TTS] speak request:", req.requestId, req.text.slice(0, 50));
    return handlers.speak(req);
  });

  ipcMain.handle(IPC.ttsStop, async (_event: unknown, req: TtsStopReq) => {
    log.debug("[TTS] stop request:", req.requestId ?? "all");
    return handlers.stop(req);
  });

  log.info("[TTS] IPC handlers registered");
}
