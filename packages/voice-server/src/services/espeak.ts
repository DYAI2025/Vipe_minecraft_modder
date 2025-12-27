import { spawn } from 'child_process';

export interface EspeakConfig {
  voice: string;
  speed: number; // words per minute
  pitch: number; // 0-99
}

const DEFAULT_CONFIG: EspeakConfig = {
  voice: 'de',
  speed: 150,
  pitch: 50
};

export class EspeakService {
  private config: EspeakConfig;
  private available: boolean | null = null;

  constructor(config: Partial<EspeakConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async checkInstalled(): Promise<boolean> {
    if (this.available !== null) return this.available;

    return new Promise((resolve) => {
      const proc = spawn('which', ['espeak']);
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

  async speak(text: string): Promise<void> {
    const installed = await this.checkInstalled();
    if (!installed) {
      throw new Error('espeak not installed');
    }

    return new Promise((resolve, reject) => {
      const proc = spawn('espeak', [
        '-v', this.config.voice,
        '-s', String(this.config.speed),
        '-p', String(this.config.pitch),
        text
      ]);

      proc.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`espeak exited with code ${code}`));
        }
      });

      proc.on('error', reject);
    });
  }

  async synthesizeWav(text: string): Promise<Buffer> {
    const installed = await this.checkInstalled();
    if (!installed) {
      throw new Error('espeak not installed');
    }

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];

      const proc = spawn('espeak', [
        '-v', this.config.voice,
        '-s', String(this.config.speed),
        '-p', String(this.config.pitch),
        '--stdout',
        text
      ]);

      proc.stdout.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve(Buffer.concat(chunks));
        } else {
          reject(new Error(`espeak exited with code ${code}`));
        }
      });

      proc.on('error', reject);
    });
  }
}
