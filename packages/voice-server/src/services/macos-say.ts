import { spawn, execSync } from 'child_process';
import { platform } from 'os';

export interface MacOSSayConfig {
  voice: string;
  rate: number; // words per minute
}

const DEFAULT_CONFIG: MacOSSayConfig = {
  voice: 'Anna', // German voice
  rate: 180
};

/**
 * macOS native TTS using the `say` command
 * Provides a fallback TTS option for macOS systems
 */
export class MacOSSayService {
  private config: MacOSSayConfig;
  private available: boolean | null = null;

  constructor(config: Partial<MacOSSayConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Check if running on macOS and say command is available
   */
  async checkInstalled(): Promise<boolean> {
    if (this.available !== null) return this.available;

    // Only available on macOS (darwin)
    if (platform() !== 'darwin') {
      this.available = false;
      return false;
    }

    return new Promise((resolve) => {
      const proc = spawn('which', ['say']);
      proc.on('close', (code) => {
        this.available = code === 0;
        resolve(this.available);
      });
      setTimeout(() => {
        this.available = false;
        resolve(false);
      }, 1000);
    });
  }

  /**
   * Get list of available voices on macOS
   */
  static getAvailableVoices(): string[] {
    if (platform() !== 'darwin') return [];

    try {
      const output = execSync('say -v "?"', { encoding: 'utf-8' });
      return output.split('\n')
        .filter(line => line.trim())
        .map(line => line.split(/\s+/)[0]);
    } catch {
      return [];
    }
  }

  /**
   * Get German voices available on macOS
   */
  static getGermanVoices(): string[] {
    if (platform() !== 'darwin') return [];

    try {
      const output = execSync('say -v "?"', { encoding: 'utf-8' });
      return output.split('\n')
        .filter(line => line.includes('de_') || line.includes('de-'))
        .map(line => line.split(/\s+/)[0]);
    } catch {
      return [];
    }
  }

  /**
   * Speak text directly through speakers
   */
  async speak(text: string): Promise<void> {
    const installed = await this.checkInstalled();
    if (!installed) {
      throw new Error('macOS say command not available (not on macOS or say not found)');
    }

    return new Promise((resolve, reject) => {
      const proc = spawn('say', [
        '-v', this.config.voice,
        '-r', String(this.config.rate),
        text
      ]);

      proc.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`say exited with code ${code}`));
        }
      });

      proc.on('error', reject);
    });
  }

  /**
   * Synthesize text to AIFF audio buffer
   */
  async synthesizeAiff(text: string): Promise<Buffer> {
    const installed = await this.checkInstalled();
    if (!installed) {
      throw new Error('macOS say command not available');
    }

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];

      // -o - outputs to stdout
      const proc = spawn('say', [
        '-v', this.config.voice,
        '-r', String(this.config.rate),
        '-o', '-', // output to stdout
        text
      ]);

      proc.stdout.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve(Buffer.concat(chunks));
        } else {
          reject(new Error(`say exited with code ${code}`));
        }
      });

      proc.on('error', reject);
    });
  }
}
