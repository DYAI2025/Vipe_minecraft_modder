import { spawn } from 'child_process';

export interface PiperConfig {
  voice: string;
  speed: number;
}

const DEFAULT_CONFIG: PiperConfig = {
  voice: 'de_DE-thorsten-high',
  speed: 0.9
};

export class PiperService {
  private config: PiperConfig;
  private piperPath: string | null = null;

  constructor(config: Partial<PiperConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async checkInstalled(): Promise<boolean> {
    return new Promise((resolve) => {
      const proc = spawn('which', ['piper']);
      proc.on('close', (code) => {
        if (code === 0) {
          this.piperPath = 'piper';
          resolve(true);
        } else {
          // Check common locations
          const paths = [
            '/usr/local/bin/piper',
            '/usr/bin/piper',
            `${process.env.HOME}/.local/bin/piper`
          ];

          let found = false;
          let checked = 0;

          for (const p of paths) {
            const check = spawn('test', ['-x', p]);
            check.on('close', (c) => {
              checked++;
              if (c === 0 && !found) {
                found = true;
                this.piperPath = p;
                resolve(true);
              }
              if (checked === paths.length && !found) {
                resolve(false);
              }
            });
          }
        }
      });

      // Timeout fallback
      setTimeout(() => resolve(false), 2000);
    });
  }

  async synthesize(text: string): Promise<Buffer> {
    if (!this.piperPath) {
      const installed = await this.checkInstalled();
      if (!installed) {
        throw new Error('Piper not installed. Install: pip install piper-tts');
      }
    }

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];

      // piper reads from stdin, outputs WAV to stdout
      const proc = spawn(this.piperPath!, [
        '--model', this.config.voice,
        '--output-raw',
        '--length-scale', String(1 / this.config.speed)
      ]);

      proc.stdin.write(text);
      proc.stdin.end();

      proc.stdout.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      proc.stderr.on('data', (data: Buffer) => {
        console.error('[Piper]', data.toString());
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve(Buffer.concat(chunks));
        } else {
          reject(new Error(`Piper exited with code ${code}`));
        }
      });

      proc.on('error', reject);
    });
  }

  async *streamSynthesize(text: string): AsyncGenerator<Buffer> {
    if (!this.piperPath) {
      const installed = await this.checkInstalled();
      if (!installed) {
        throw new Error('Piper not installed');
      }
    }

    const proc = spawn(this.piperPath!, [
      '--model', this.config.voice,
      '--output-raw',
      '--length-scale', String(1 / this.config.speed)
    ]);

    proc.stdin.write(text);
    proc.stdin.end();

    for await (const chunk of proc.stdout) {
      yield chunk as Buffer;
    }
  }
}
