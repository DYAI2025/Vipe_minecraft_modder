import { ipcMain } from "electron";
import log from "electron-log";
import { settingsStore } from "../settingsStore.js";
import {
  selectWorkspaceDirectory,
  isValidWorkspacePath,
  getExportDirectory,
  getProjectsDirectory,
  ensureWorkspaceExists,
} from "../workspaceManager.js";

export function registerWorkspaceHandlers(): void {
  /**
   * workspace:get
   * Get current workspace configuration
   */
  ipcMain.handle("workspace:get", async () => {
    try {
      const settings = settingsStore.get();
      return {
        ok: true,
        workspace: settings.workspace,
        exportDir: getExportDirectory(settings.workspace.rootPath),
        projectsDir: getProjectsDirectory(settings.workspace.rootPath),
      };
    } catch (error) {
      log.error("Failed to get workspace:", error);
      return {
        ok: false,
        error: {
          message: String(error),
          code: "E_WORKSPACE_GET_FAILED",
        },
      };
    }
  });

  /**
   * workspace:select
   * Show dialog to select new workspace directory
   */
  ipcMain.handle("workspace:select", async () => {
    try {
      const selectedPath = await selectWorkspaceDirectory();

      if (!selectedPath) {
        return {
          ok: false,
          message: "Workspace selection cancelled",
        };
      }

      if (!isValidWorkspacePath(selectedPath)) {
        return {
          ok: false,
          message: "Invalid workspace path (cannot be system directory)",
        };
      }

      // Create workspace if it doesn't exist
      const created = ensureWorkspaceExists(selectedPath, true);

      if (!created) {
        return {
          ok: false,
          message: "Failed to create workspace directory",
        };
      }

      // Update settings
      const settings = settingsStore.get();
      const updated = await settingsStore.update({
        workspace: {
          ...settings.workspace,
          rootPath: selectedPath,
        },
      });

      return {
        ok: true,
        workspace: updated.workspace,
        exportDir: getExportDirectory(updated.workspace.rootPath),
        projectsDir: getProjectsDirectory(updated.workspace.rootPath),
      };
    } catch (error) {
      log.error("Failed to select workspace:", error);
      return {
        ok: false,
        error: {
          message: String(error),
          code: "E_WORKSPACE_SELECT_FAILED",
        },
      };
    }
  });

  /**
   * workspace:validate
   * Validate that a workspace path is valid and accessible
   */
  ipcMain.handle("workspace:validate", async (_event, { path }: { path: string }) => {
    try {
      if (!isValidWorkspacePath(path)) {
        return {
          ok: false,
          message: "Invalid workspace path",
        };
      }

      const exists = ensureWorkspaceExists(path, false);

      return {
        ok: true,
        exists,
        message: exists ? "Workspace is valid and accessible" : "Workspace path is valid but does not exist",
      };
    } catch (error) {
      return {
        ok: false,
        message: String(error),
      };
    }
  });
}
