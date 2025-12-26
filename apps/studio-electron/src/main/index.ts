import { app, BrowserWindow } from "electron";
import { join } from "path";
import { fileURLToPath } from "url";
import log from "electron-log";
import { settingsStore } from "./settingsStore.js";
import { registerSttHandlers } from "./ipcHandlers/stt.js";
import { registerLlmHandlers } from "./ipcHandlers/llm.js";
import { registerSettingsHandlers } from "./ipcHandlers/settings.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

log.initialize();
log.info("KidModStudio starting...");

let mainWindow: BrowserWindow | null = null;

async function createWindow(): Promise<void> {
  // Load settings before creating window
  await settingsStore.load();
  log.info("Settings loaded");

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, "../preload/bridge.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Register IPC handlers
  registerSttHandlers();
  registerLlmHandlers();
  registerSettingsHandlers();
  log.info("IPC handlers registered");

  // Load renderer
  const rendererPath = join(__dirname, "../renderer/index.html");
  await mainWindow.loadFile(rendererPath);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  log.info("Main window created");
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
