import { ipcMain } from "electron";
import log from "electron-log";
import { IPC, type SettingsConfig } from "@kidmodstudio/ipc-contracts";
import { settingsStore } from "../settingsStore.js";

export function registerSettingsHandlers(): void {
  // settings.get
  ipcMain.handle(IPC.settingsGet, async (): Promise<SettingsConfig> => {
    return settingsStore.get();
  });

  // settings.update
  ipcMain.handle(IPC.settingsUpdate, async (event, patch: Partial<SettingsConfig>): Promise<SettingsConfig> => {
    try {
      return await settingsStore.update(patch);
    } catch (error) {
      log.error("Failed to update settings:", error);
      throw error;
    }
  });
}
