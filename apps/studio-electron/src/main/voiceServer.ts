// Voice Server Manager - spawns @kidmodstudio/voice-server as child process
import { spawn, ChildProcess } from "child_process";
import { join } from "path";
import { fileURLToPath } from "url";
import log from "electron-log";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

let serverProcess: ChildProcess | null = null;
let isShuttingDown = false;

/**
 * Start the voice-server as a child process
 */
export async function startVoiceServer(): Promise<boolean> {
  if (serverProcess) {
    log.info("[VoiceServer] Already running");
    return true;
  }

  // Path to voice-server package
  const serverPath = join(__dirname, "../../../../packages/voice-server");
  const entryPoint = join(serverPath, "dist/index.js");

  log.info(`[VoiceServer] Starting from ${serverPath}`);

  try {
    serverProcess = spawn("node", [entryPoint], {
      cwd: serverPath,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, NODE_ENV: "production" },
    });

    // Log stdout
    serverProcess.stdout?.on("data", (data: Buffer) => {
      const msg = data.toString().trim();
      if (msg) log.info(`[VoiceServer] ${msg}`);
    });

    // Log stderr
    serverProcess.stderr?.on("data", (data: Buffer) => {
      const msg = data.toString().trim();
      if (msg) log.warn(`[VoiceServer] ${msg}`);
    });

    // Handle exit
    serverProcess.on("exit", (code, signal) => {
      log.info(`[VoiceServer] Exited (code=${code}, signal=${signal})`);
      serverProcess = null;

      // Auto-restart if not shutting down
      if (!isShuttingDown && code !== 0) {
        log.info("[VoiceServer] Restarting in 2s...");
        setTimeout(() => startVoiceServer(), 2000);
      }
    });

    serverProcess.on("error", (err) => {
      log.error(`[VoiceServer] Spawn error: ${err.message}`);
      serverProcess = null;
    });

    // Wait a bit for server to start
    await new Promise((resolve) => setTimeout(resolve, 500));

    log.info("[VoiceServer] Started successfully");
    return true;
  } catch (err) {
    log.error(`[VoiceServer] Failed to start: ${err}`);
    return false;
  }
}

/**
 * Stop the voice-server
 */
export function stopVoiceServer(): void {
  isShuttingDown = true;

  if (serverProcess) {
    log.info("[VoiceServer] Stopping...");
    serverProcess.kill("SIGTERM");

    // Force kill after 5 seconds
    setTimeout(() => {
      if (serverProcess) {
        log.warn("[VoiceServer] Force killing...");
        serverProcess.kill("SIGKILL");
        serverProcess = null;
      }
    }, 5000);
  }
}

/**
 * Check if voice-server is running
 */
export function isVoiceServerRunning(): boolean {
  return serverProcess !== null && !serverProcess.killed;
}
