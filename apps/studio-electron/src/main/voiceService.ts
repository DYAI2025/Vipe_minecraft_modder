import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';
import { fileURLToPath } from 'url';
import log from 'electron-log';
import fs from 'fs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

let serverProcess: ChildProcess | null = null;
let isShuttingDown = false;

/**
 * Manages the Python Voice Server as a KidModStudio "Skill" (Jarvis Kernel).
 */
export async function startVoiceService(): Promise<boolean> {
    if (serverProcess) {
        log.info('[VoiceService] Already running');
        return true;
    }

    isShuttingDown = false;
    // Path to the python package
    const serverRoot = join(__dirname, '../../../../packages/voice-server-py');
    const scriptPath = join(serverRoot, 'src/main.py');

    log.info(`[VoiceService] Starting Python server: ${scriptPath}`);

    if (!fs.existsSync(scriptPath)) {
        log.error(`[VoiceService] Script not found at ${scriptPath}`);
        return false;
    }

    try {
        // Attempt to use venv if it exists, otherwise system python3
        const venvPython = join(serverRoot, 'venv/bin/python3');
        const pythonCmd = fs.existsSync(venvPython) ? venvPython : 'python3';

        serverProcess = spawn(pythonCmd, [scriptPath], {
            cwd: serverRoot,
            stdio: ['ignore', 'pipe', 'pipe'],
            env: { ...process.env, PYTHONUNBUFFERED: '1' },
        });

        serverProcess.stdout?.on('data', (data: Buffer) => {
            const msg = data.toString().trim();
            if (msg) log.info(`[VoiceService] ${msg}`);
        });

        serverProcess.stderr?.on('data', (data: Buffer) => {
            const msg = data.toString().trim();
            if (msg) log.warn(`[VoiceService] ${msg}`);
        });

        serverProcess.on('exit', (code, signal) => {
            log.info(`[VoiceService] Exited with code=${code}, signal=${signal}`);
            serverProcess = null;

            if (!isShuttingDown && code !== 0) {
                log.info('[VoiceService] Unexpected exit, restarting in 3s...');
                setTimeout(() => startVoiceService(), 3000);
            }
        });

        serverProcess.on('error', (err) => {
            log.error(`[VoiceService] Spawn error: ${err.message}`);
            serverProcess = null;
        });

        return true;
    } catch (err) {
        log.error(`[VoiceService] Failed to start: ${err}`);
        return false;
    }
}

export function stopVoiceService(): void {
    isShuttingDown = true;
    if (serverProcess) {
        log.info('[VoiceService] Stopping Python server...');
        serverProcess.kill('SIGTERM');

        // Fallback SIGKILL
        const t = setTimeout(() => {
            if (serverProcess) {
                log.warn('[VoiceService] Force killing...');
                serverProcess.kill('SIGKILL');
                serverProcess = null;
            }
        }, 5000);
        t.unref();
    }
}

export function isVoiceServiceRunning(): boolean {
    return serverProcess !== null && !serverProcess.killed;
}
