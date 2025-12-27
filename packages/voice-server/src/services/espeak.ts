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
  private espeakCommand: string = 'espeak';

  constructor(config: Partial<EspeakConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async checkInstalled(): Promise<boolean> {
    if (this.available !== null) return this.available;

    return new Promise((resolve) => {
      // Check for espeak and espeak-ng (commonly used on macOS via Homebrew)
      const commands = ['espeak', 'espeak-ng'];
      const paths = [
        '/opt/homebrew/bin/espeak',     // macOS Apple Silicon
        '/opt/homebrew/bin/espeak-ng',
        '/usr/local/bin/espeak',        // macOS Intel
        '/usr/local/bin/espeak-ng',
      ];

      let found = false;
      let checked = 0;
      const totalChecks = commands.length + paths.length;

      // Check via 'which'
      for (const cmd of commands) {
        const proc = spawn('which', [cmd]);
        proc.on('close', (code) => {
          checked++;
          if (code === 0 && !found) {
            found = true;
            this.espeakCommand = cmd;
            this.available = true;
            resolve(true);
          }
          if (checked === totalChecks && !found) {
            this.available = false;
            resolve(false);
          }
        });
      }

      // Check Homebrew paths directly
      for (const path of paths) {
        const proc = spawn('test', ['-x', path]);
        proc.on('close', (code) => {
          checked++;
          if (code === 0 && !found) {
            found = true;
            this.espeakCommand = path;
            this.available = true;
            resolve(true);
          }
          if (checked === totalChecks && !found) {
            this.available = false;
            resolve(false);
          }
        });
      }

      setTimeout(() => {
        if (!found) {
          this.available = false;
          resolve(false);
        }
      }, 1000);
    });
  }

  async speak(text: string): Promise<void> {
    const installed = await this.checkInstalled();
    if (!installed) {
      throw new Error('espeak not installed. Install: brew install espeak (macOS) or apt install espeak (Linux)');
    }

    return new Promise((resolve, reject) => {
      const proc = spawn(this.espeakCommand, [
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
      throw new Error('espeak not installed. Install: brew install espeak (macOS) or apt install espeak (Linux)');
    }

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];

      const proc = spawn(this.espeakCommand, [
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
