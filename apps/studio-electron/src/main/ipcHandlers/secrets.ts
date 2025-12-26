import { ipcMain } from "electron";
import log from "electron-log";
import { IPC, type SecretRef } from "@kidmodstudio/ipc-contracts";
import { secretStore } from "../secretStore.js";

export function registerSecretsHandlers(): void {
  ipcMain.handle(IPC.secretSet, async (_event, key: string, value: string) => {
    try {
      const ref = `secret:${key}` as SecretRef;
      await secretStore.set(ref, value);
      log.debug("[Secrets] Key stored:", key);
      return { ok: true };
    } catch (error) {
      log.error("[Secrets] Failed to store key:", error);
      return { ok: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  });

  ipcMain.handle(IPC.secretDelete, async (_event, key: string) => {
    try {
      const ref = `secret:${key}` as SecretRef;
      await secretStore.delete(ref);
      log.debug("[Secrets] Key deleted:", key);
      return { ok: true };
    } catch (error) {
      log.error("[Secrets] Failed to delete key:", error);
      return { ok: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  });

  log.info("[Secrets] IPC handlers registered");
}
