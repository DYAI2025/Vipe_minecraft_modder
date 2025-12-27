import { spawn } from 'child_process';
import { writeFileSync, unlinkSync, mkdtempSync, rmdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

export interface WhisperConfig {
  model: string;
  language: string;
  threads: number;
}

const DEFAULT_CONFIG: WhisperConfig = {
  model: 'small',
  language: 'de',
  threads: 4
};

export class WhisperService {
  private config: WhisperConfig;
  private whisperPath: string | null = null;

  constructor(config: Partial<WhisperConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async checkInstalled(): Promise<boolean> {
    return new Promise((resolve) => {
      // Check for whisper.cpp binary - first try 'which' for common names
      const names = ['whisper', 'whisper-cpp', 'main'];
      // Also check macOS Homebrew paths
      const homebrewPaths = [
        '/opt/homebrew/bin/whisper',      // macOS Apple Silicon
        '/opt/homebrew/bin/whisper-cpp',
        '/usr/local/bin/whisper',         // macOS Intel
        '/usr/local/bin/whisper-cpp',
      ];

      let found = false;
      let checked = 0;
      const totalChecks = names.length + homebrewPaths.length;

      // Check via 'which' first
      for (const name of names) {
        const proc = spawn('which', [name]);
        proc.on('close', (code) => {
          checked++;
          if (code === 0 && !found) {
            found = true;
            this.whisperPath = name;
            resolve(true);
          }
          if (checked === totalChecks && !found) {
            resolve(false);
          }
        });
      }

      // Check Homebrew paths directly
      for (const path of homebrewPaths) {
        const proc = spawn('test', ['-x', path]);
        proc.on('close', (code) => {
          checked++;
          if (code === 0 && !found) {
            found = true;
            this.whisperPath = path;
            resolve(true);
          }
          if (checked === totalChecks && !found) {
            resolve(false);
          }
        });
      }

      // Timeout fallback
      setTimeout(() => {
        if (!found) resolve(false);
      }, 2000);
    });
  }

  async transcribe(audioBuffer: Buffer): Promise<string> {
    if (!this.whisperPath) {
      const installed = await this.checkInstalled();
      if (!installed) {
        throw new Error('Whisper not installed. Install whisper.cpp');
      }
    }

    // Write audio to temp file
    const tmpDir = mkdtempSync(join(tmpdir(), 'whisper-'));
    const audioPath = join(tmpDir, 'audio.wav');
    writeFileSync(audioPath, audioBuffer);

    return new Promise((resolve, reject) => {
      const args = [
        '-m', `models/ggml-${this.config.model}.bin`,
        '-l', this.config.language,
        '-t', String(this.config.threads),
        '-f', audioPath,
        '--no-timestamps',
        '-otxt'
      ];

      const proc = spawn(this.whisperPath!, args);
      let output = '';
      let error = '';

      proc.stdout.on('data', (data: Buffer) => {
        output += data.toString();
      });

      proc.stderr.on('data', (data: Buffer) => {
        error += data.toString();
      });

      proc.on('close', (code) => {
        // Cleanup
        try {
          unlinkSync(audioPath);
          rmdirSync(tmpDir);
        } catch {
          // Ignore cleanup errors
        }

        if (code === 0) {
          // Extract transcription from output
          const lines = output.split('\n').filter(l => l.trim());
          resolve(lines.join(' ').trim());
        } else {
          reject(new Error(`Whisper failed: ${error || 'Unknown error'}`));
        }
      });

      proc.on('error', (e) => {
        try {
          unlinkSync(audioPath);
          rmdirSync(tmpDir);
        } catch {
          // Ignore cleanup errors
        }
        reject(e);
      });
    });
  }
}
