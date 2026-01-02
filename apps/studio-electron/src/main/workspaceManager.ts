import { app, dialog } from "electron";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";
import log from "electron-log";
import type { SettingsConfig } from "@kidmodstudio/ipc-contracts";

/**
 * Get the default workspace path for the current OS
 * Returns: <Documents>/KidModStudio/workspace
 */
export function getDefaultWorkspacePath(): string {
  const documentsPath = app.getPath("documents");
  return join(documentsPath, "KidModStudio", "workspace");
}

/**
 * Get the default template path
 * In development: relative to project root
 * In production: bundled in app resources
 */
export function getDefaultTemplatePath(): string {
  if (app.isPackaged) {
    // Production: template is bundled in resources
    return join(process.resourcesPath, "templates", "fabric");
  } else {
    // Development: relative to project root
    return join(process.cwd(), "kidmodstudio_exporter_kit", "template");
  }
}

/**
 * Ensure workspace directory exists, creating it if autoCreate is true
 * @returns true if workspace is ready, false if it doesn't exist and autoCreate is false
 */
export function ensureWorkspaceExists(
  workspacePath: string,
  autoCreate: boolean
): boolean {
  if (existsSync(workspacePath)) {
    log.info(`Workspace exists: ${workspacePath}`);
    return true;
  }

  if (!autoCreate) {
    log.warn(`Workspace does not exist and autoCreate is false: ${workspacePath}`);
    return false;
  }

  try {
    mkdirSync(workspacePath, { recursive: true });
    log.info(`Created workspace: ${workspacePath}`);
    return true;
  } catch (error) {
    log.error(`Failed to create workspace: ${workspacePath}`, error);
    return false;
  }
}

/**
 * Show dialog to select workspace directory
 * @returns selected path or null if cancelled
 */
export async function selectWorkspaceDirectory(): Promise<string | null> {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory", "createDirectory"],
    title: "Wähle deinen KidModStudio Workspace",
    message: "Hier werden deine Minecraft Mods gespeichert",
    defaultPath: getDefaultWorkspacePath(),
    buttonLabel: "Wählen",
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
}

/**
 * Initialize workspace configuration
 * - If workspace.rootPath is empty, set it to default and save
 * - Ensure workspace directory exists
 * - Return updated settings
 */
export async function initializeWorkspace(
  settings: SettingsConfig,
  saveSettings: (updated: SettingsConfig) => Promise<SettingsConfig>
): Promise<SettingsConfig> {
  let updatedSettings = settings;
  let workspaceChanged = false;

  // Initialize empty workspace path with default
  if (!settings.workspace.rootPath) {
    const defaultPath = getDefaultWorkspacePath();
    log.info(`Initializing workspace with default path: ${defaultPath}`);

    updatedSettings = {
      ...settings,
      workspace: {
        ...settings.workspace,
        rootPath: defaultPath,
      },
    };
    workspaceChanged = true;
  }

  // Ensure workspace exists
  const workspaceReady = ensureWorkspaceExists(
    updatedSettings.workspace.rootPath,
    updatedSettings.workspace.autoCreate
  );

  if (!workspaceReady) {
    log.warn("Workspace not ready, prompting user to select directory");
    const selectedPath = await selectWorkspaceDirectory();

    if (selectedPath) {
      updatedSettings = {
        ...updatedSettings,
        workspace: {
          ...updatedSettings.workspace,
          rootPath: selectedPath,
        },
      };
      workspaceChanged = true;

      // Ensure selected directory exists
      ensureWorkspaceExists(selectedPath, true);
    } else {
      log.error("User cancelled workspace selection, using default anyway");
      // Fallback: create default workspace
      ensureWorkspaceExists(updatedSettings.workspace.rootPath, true);
    }
  }

  // Save if workspace was changed
  if (workspaceChanged) {
    log.info("Saving updated workspace configuration");
    updatedSettings = await saveSettings(updatedSettings);
  }

  log.info(`Workspace initialized: ${updatedSettings.workspace.rootPath}`);
  return updatedSettings;
}

/**
 * Get the export directory within workspace
 */
export function getExportDirectory(workspacePath: string): string {
  return join(workspacePath, "export");
}

/**
 * Get the projects directory within workspace
 */
export function getProjectsDirectory(workspacePath: string): string {
  return join(workspacePath, "projects");
}

/**
 * Validate that a path is a valid workspace
 * - Must be absolute
 * - Must not be root directory
 * - Must not be system directory
 */
export function isValidWorkspacePath(path: string): boolean {
  // Must be absolute
  if (!path || path.length === 0) {
    return false;
  }

  // Must not be root
  if (path === "/" || path === "C:\\" || path === "\\") {
    return false;
  }

  // Must not be system directories
  const systemPaths = [
    "/System",
    "/Library",
    "/bin",
    "/sbin",
    "/usr",
    "/var",
    "C:\\Windows",
    "C:\\Program Files",
    "C:\\Program Files (x86)",
  ];

  for (const sysPath of systemPaths) {
    if (path.startsWith(sysPath)) {
      return false;
    }
  }

  return true;
}
