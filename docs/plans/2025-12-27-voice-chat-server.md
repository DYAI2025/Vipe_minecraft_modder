# Voice-Chat Server Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** Build a real-time voice and text chat system for Crafty assistant using WebSocket streaming.

**Architecture:** Standalone Fastify server with WebSocket endpoints, spawning Whisper (STT) and Piper (TTS) as subprocesses, connecting to Ollama via HTTP. Server runs alongside Electron, renderer connects via ws://localhost:3847.

**Tech Stack:** Fastify, @fastify/websocket, child_process (spawn), Ollama HTTP API, Web Audio API

---

## Batch 1: Server Foundation

### Task 1.1: Create Server Package Structure

**Files:**
- Create: `packages/voice-server/package.json`
- Create: `packages/voice-server/tsconfig.json`
- Create: `packages/voice-server/src/index.ts`

**Step 1: Create package.json**

```json
{
  "name": "@kidmodstudio/voice-server",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsx watch src/index.ts",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "fastify": "^4.28.0",
    "@fastify/websocket": "^10.0.0",
    "@fastify/cors": "^9.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.0.0",
    "vitest": "^2.0.0"
  }
}
```

**Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "declaration": true
  },
  "include": ["src/**/*"]
}
```

**Step 3: Create minimal server entry**

```typescript
// packages/voice-server/src/index.ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';

const PORT = 3847;

async function start() {
  const server = Fastify({ logger: true });

  await server.register(cors, { origin: true });
  await server.register(websocket);

  server.get('/status', async () => {
    return { status: 'ok', version: '0.1.0' };
  });

  await server.listen({ port: PORT, host: '127.0.0.1' });
  console.log(`VoiceChat server running on http://127.0.0.1:${PORT}`);
}

start().catch(console.error);
```

**Step 4: Update root package.json workspaces**

Add to `package.json` workspaces array:
```json
"workspaces": [
  "packages/*",
  "apps/*"
]
```

**Step 5: Install and build**

```bash
npm install
cd packages/voice-server && npm run build
```

**Step 6: Commit**

```bash
git add packages/voice-server package.json
git commit -m "feat: add voice-server package foundation"
```

---

### Task 1.2: Add WebSocket Chat Endpoint

**Files:**
- Modify: `packages/voice-server/src/index.ts`
- Create: `packages/voice-server/src/routes/chat.ts`
- Create: `packages/voice-server/src/types.ts`

**Step 1: Create types**

```typescript
// packages/voice-server/src/types.ts
export interface ChatMessage {
  type: 'user' | 'assistant' | 'system' | 'error';
  content: string;
  timestamp: number;
}

export interface WebSocketMessage {
  action: 'chat' | 'voice_start' | 'voice_stop' | 'voice_data';
  payload?: string | ArrayBuffer;
}
```

**Step 2: Create chat route**

```typescript
// packages/voice-server/src/routes/chat.ts
import { FastifyInstance } from 'fastify';
import { WebSocketMessage, ChatMessage } from '../types.js';

export async function chatRoutes(server: FastifyInstance) {
  server.get('/chat', { websocket: true }, (socket, req) => {
    console.log('[Chat] Client connected');

    // Send welcome message
    const welcome: ChatMessage = {
      type: 'assistant',
      content: 'Hallo! Ich bin Crafty! Was bauen wir heute?',
      timestamp: Date.now()
    };
    socket.send(JSON.stringify(welcome));

    socket.on('message', async (raw: Buffer) => {
      try {
        const msg: WebSocketMessage = JSON.parse(raw.toString());

        if (msg.action === 'chat' && typeof msg.payload === 'string') {
          // Echo for now - will connect to Ollama later
          const response: ChatMessage = {
            type: 'assistant',
            content: `Du sagst: "${msg.payload}" - Ollama kommt bald!`,
            timestamp: Date.now()
          };
          socket.send(JSON.stringify(response));
        }
      } catch (e) {
        socket.send(JSON.stringify({
          type: 'error',
          content: 'Invalid message format',
          timestamp: Date.now()
        }));
      }
    });

    socket.on('close', () => {
      console.log('[Chat] Client disconnected');
    });
  });
}
```

**Step 3: Register route in index.ts**

```typescript
// packages/voice-server/src/index.ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { chatRoutes } from './routes/chat.js';

const PORT = 3847;

async function start() {
  const server = Fastify({ logger: true });

  await server.register(cors, { origin: true });
  await server.register(websocket);
  await server.register(chatRoutes);

  server.get('/status', async () => {
    return {
      status: 'ok',
      version: '0.1.0',
      services: {
        ollama: false,
        whisper: false,
        piper: false
      }
    };
  });

  await server.listen({ port: PORT, host: '127.0.0.1' });
  console.log(`VoiceChat server running on http://127.0.0.1:${PORT}`);
}

start().catch(console.error);
```

**Step 4: Build and test manually**

```bash
cd packages/voice-server && npm run build
node dist/index.js &
curl http://127.0.0.1:3847/status
# Expected: {"status":"ok","version":"0.1.0","services":{...}}
```

**Step 5: Commit**

```bash
git add packages/voice-server/src
git commit -m "feat: add WebSocket chat endpoint"
```

---

## Batch 2: Ollama Integration

### Task 2.1: Create Ollama Service

**Files:**
- Create: `packages/voice-server/src/services/ollama.ts`
- Create: `packages/voice-server/src/services/ollama.test.ts`

**Step 1: Create Ollama service**

```typescript
// packages/voice-server/src/services/ollama.ts
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';

export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OllamaStreamChunk {
  message?: { content: string };
  done: boolean;
}

const CRAFTY_SYSTEM_PROMPT = `Du bist Crafty, ein freundlicher Minecraft-Mod-Assistent für Kinder (10-14 Jahre).
- Erkläre einfach und mit Minecraft-Beispielen
- Sei enthusiastisch aber nicht übertrieben
- Hilf beim Mod-Bauen mit konkreten Vorschlägen
- Antworte auf Deutsch
- Halte Antworten kurz (2-3 Sätze) außer bei Erklärungen`;

export class OllamaService {
  private model = 'llama3.2:latest';
  private messages: OllamaMessage[] = [];

  constructor() {
    this.messages = [{ role: 'system', content: CRAFTY_SYSTEM_PROMPT }];
  }

  async checkConnection(): Promise<boolean> {
    try {
      const res = await fetch(`${OLLAMA_URL}/api/tags`);
      return res.ok;
    } catch {
      return false;
    }
  }

  async *streamChat(userMessage: string): AsyncGenerator<string> {
    this.messages.push({ role: 'user', content: userMessage });

    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages: this.messages,
        stream: true
      })
    });

    if (!res.ok || !res.body) {
      throw new Error(`Ollama error: ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(l => l.trim());

      for (const line of lines) {
        try {
          const data: OllamaStreamChunk = JSON.parse(line);
          if (data.message?.content) {
            fullResponse += data.message.content;
            yield data.message.content;
          }
        } catch {}
      }
    }

    this.messages.push({ role: 'assistant', content: fullResponse });

    // Keep only last 20 messages + system prompt
    if (this.messages.length > 21) {
      this.messages = [this.messages[0], ...this.messages.slice(-20)];
    }
  }

  clearHistory() {
    this.messages = [this.messages[0]];
  }
}
```

**Step 2: Create test**

```typescript
// packages/voice-server/src/services/ollama.test.ts
import { describe, it, expect } from 'vitest';
import { OllamaService } from './ollama.js';

describe('OllamaService', () => {
  it('should create instance with system prompt', () => {
    const ollama = new OllamaService();
    expect(ollama).toBeDefined();
  });

  it('should check connection (may fail if Ollama not running)', async () => {
    const ollama = new OllamaService();
    const connected = await ollama.checkConnection();
    // Don't assert true/false - just check it doesn't throw
    expect(typeof connected).toBe('boolean');
  });
});
```

**Step 3: Run tests**

```bash
cd packages/voice-server && npm test
```

**Step 4: Commit**

```bash
git add packages/voice-server/src/services
git commit -m "feat: add Ollama service with streaming"
```

---

### Task 2.2: Connect Chat Route to Ollama

**Files:**
- Modify: `packages/voice-server/src/routes/chat.ts`

**Step 1: Update chat route**

```typescript
// packages/voice-server/src/routes/chat.ts
import { FastifyInstance } from 'fastify';
import { WebSocketMessage, ChatMessage } from '../types.js';
import { OllamaService } from '../services/ollama.js';

export async function chatRoutes(server: FastifyInstance) {
  server.get('/chat', { websocket: true }, (socket, req) => {
    console.log('[Chat] Client connected');
    const ollama = new OllamaService();

    // Send welcome message
    const welcome: ChatMessage = {
      type: 'assistant',
      content: 'Hallo! Ich bin Crafty! Was bauen wir heute?',
      timestamp: Date.now()
    };
    socket.send(JSON.stringify(welcome));

    socket.on('message', async (raw: Buffer) => {
      try {
        const msg: WebSocketMessage = JSON.parse(raw.toString());

        if (msg.action === 'chat' && typeof msg.payload === 'string') {
          // Stream response from Ollama
          let fullContent = '';
          const startTime = Date.now();

          try {
            for await (const chunk of ollama.streamChat(msg.payload)) {
              fullContent += chunk;
              // Send streaming chunk
              socket.send(JSON.stringify({
                type: 'assistant',
                content: chunk,
                streaming: true,
                timestamp: startTime
              }));
            }
            // Send completion marker
            socket.send(JSON.stringify({
              type: 'assistant',
              content: '',
              streaming: false,
              done: true,
              fullContent,
              timestamp: startTime
            }));
          } catch (e) {
            socket.send(JSON.stringify({
              type: 'error',
              content: `Ollama Fehler: ${e instanceof Error ? e.message : 'Unbekannt'}`,
              timestamp: Date.now()
            }));
          }
        }
      } catch (e) {
        socket.send(JSON.stringify({
          type: 'error',
          content: 'Invalid message format',
          timestamp: Date.now()
        }));
      }
    });

    socket.on('close', () => {
      console.log('[Chat] Client disconnected');
    });
  });
}
```

**Step 2: Build and test**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add packages/voice-server/src/routes/chat.ts
git commit -m "feat: connect chat route to Ollama streaming"
```

---

## Batch 3: Piper TTS Service

### Task 3.1: Create Piper Service

**Files:**
- Create: `packages/voice-server/src/services/piper.ts`

**Step 1: Create Piper service**

```typescript
// packages/voice-server/src/services/piper.ts
import { spawn, ChildProcess } from 'child_process';
import { Readable } from 'stream';

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
          for (const p of paths) {
            try {
              const check = spawn('test', ['-x', p]);
              check.on('close', (c) => {
                if (c === 0) {
                  this.piperPath = p;
                  resolve(true);
                }
              });
            } catch {}
          }
          resolve(false);
        }
      });
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
```

**Step 2: Commit**

```bash
git add packages/voice-server/src/services/piper.ts
git commit -m "feat: add Piper TTS service"
```

---

### Task 3.2: Add Voice WebSocket Endpoint

**Files:**
- Create: `packages/voice-server/src/routes/voice.ts`
- Modify: `packages/voice-server/src/index.ts`

**Step 1: Create voice route**

```typescript
// packages/voice-server/src/routes/voice.ts
import { FastifyInstance } from 'fastify';
import { OllamaService } from '../services/ollama.js';
import { PiperService } from '../services/piper.js';

export async function voiceRoutes(server: FastifyInstance) {
  const piper = new PiperService();

  // TTS endpoint - text in, audio out
  server.get('/voice/tts', { websocket: true }, (socket, req) => {
    console.log('[TTS] Client connected');

    socket.on('message', async (raw: Buffer) => {
      try {
        const { text } = JSON.parse(raw.toString());

        if (typeof text !== 'string' || !text.trim()) {
          return;
        }

        console.log('[TTS] Synthesizing:', text.substring(0, 50));

        try {
          // Stream audio chunks
          for await (const chunk of piper.streamSynthesize(text)) {
            socket.send(chunk);
          }
          // Send end marker
          socket.send(JSON.stringify({ done: true }));
        } catch (e) {
          socket.send(JSON.stringify({
            error: e instanceof Error ? e.message : 'TTS failed'
          }));
        }
      } catch (e) {
        socket.send(JSON.stringify({ error: 'Invalid message' }));
      }
    });

    socket.on('close', () => {
      console.log('[TTS] Client disconnected');
    });
  });

  // Combined voice chat - audio in, audio out
  server.get('/voice/chat', { websocket: true }, (socket, req) => {
    console.log('[VoiceChat] Client connected');
    const ollama = new OllamaService();

    // For now, handle text input and respond with TTS
    // STT will be added in next batch
    socket.on('message', async (raw: Buffer) => {
      try {
        const msg = JSON.parse(raw.toString());

        if (msg.action === 'speak' && msg.text) {
          // Get LLM response
          let response = '';
          for await (const chunk of ollama.streamChat(msg.text)) {
            response += chunk;
          }

          // Synthesize response
          try {
            for await (const audioChunk of piper.streamSynthesize(response)) {
              socket.send(audioChunk);
            }
            socket.send(JSON.stringify({
              done: true,
              text: response
            }));
          } catch (e) {
            socket.send(JSON.stringify({
              error: 'TTS failed',
              text: response
            }));
          }
        }
      } catch (e) {
        // Binary audio data - will be handled by STT later
        console.log('[VoiceChat] Received binary data:', raw.length, 'bytes');
      }
    });

    socket.on('close', () => {
      console.log('[VoiceChat] Client disconnected');
    });
  });
}
```

**Step 2: Register in index.ts**

```typescript
// packages/voice-server/src/index.ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { chatRoutes } from './routes/chat.js';
import { voiceRoutes } from './routes/voice.js';
import { OllamaService } from './services/ollama.js';
import { PiperService } from './services/piper.js';

const PORT = 3847;

async function start() {
  const server = Fastify({ logger: true });

  await server.register(cors, { origin: true });
  await server.register(websocket);
  await server.register(chatRoutes);
  await server.register(voiceRoutes);

  // Check services
  const ollama = new OllamaService();
  const piper = new PiperService();

  const ollamaOk = await ollama.checkConnection();
  const piperOk = await piper.checkInstalled();

  server.get('/status', async () => {
    return {
      status: 'ok',
      version: '0.1.0',
      services: {
        ollama: ollamaOk,
        piper: piperOk,
        whisper: false // Coming next batch
      }
    };
  });

  await server.listen({ port: PORT, host: '127.0.0.1' });
  console.log(`VoiceChat server running on http://127.0.0.1:${PORT}`);
  console.log(`Services: Ollama=${ollamaOk}, Piper=${piperOk}`);
}

start().catch(console.error);
```

**Step 3: Commit**

```bash
git add packages/voice-server/src
git commit -m "feat: add TTS voice endpoints"
```

---

## Batch 4: Whisper STT Service

### Task 4.1: Create Whisper Service

**Files:**
- Create: `packages/voice-server/src/services/whisper.ts`

**Step 1: Create Whisper service**

```typescript
// packages/voice-server/src/services/whisper.ts
import { spawn, ChildProcess } from 'child_process';
import { writeFileSync, unlinkSync, mkdtempSync } from 'fs';
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
      // Check for whisper.cpp main binary
      const names = ['whisper', 'whisper-cpp', 'main'];
      let found = false;

      for (const name of names) {
        const proc = spawn('which', [name]);
        proc.on('close', (code) => {
          if (code === 0 && !found) {
            found = true;
            this.whisperPath = name;
            resolve(true);
          }
        });
      }

      setTimeout(() => {
        if (!found) resolve(false);
      }, 1000);
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
          unlinkSync(tmpDir);
        } catch {}

        if (code === 0) {
          // Extract transcription from output
          const lines = output.split('\n').filter(l => l.trim());
          resolve(lines.join(' ').trim());
        } else {
          reject(new Error(`Whisper failed: ${error}`));
        }
      });

      proc.on('error', (e) => {
        try {
          unlinkSync(audioPath);
        } catch {}
        reject(e);
      });
    });
  }
}
```

**Step 2: Commit**

```bash
git add packages/voice-server/src/services/whisper.ts
git commit -m "feat: add Whisper STT service"
```

---

### Task 4.2: Add STT to Voice Route

**Files:**
- Modify: `packages/voice-server/src/routes/voice.ts`
- Modify: `packages/voice-server/src/index.ts`

**Step 1: Update voice route with STT**

```typescript
// packages/voice-server/src/routes/voice.ts
import { FastifyInstance } from 'fastify';
import { OllamaService } from '../services/ollama.js';
import { PiperService } from '../services/piper.js';
import { WhisperService } from '../services/whisper.js';

export async function voiceRoutes(server: FastifyInstance) {
  const piper = new PiperService();
  const whisper = new WhisperService();

  // TTS endpoint - text in, audio out
  server.get('/voice/tts', { websocket: true }, (socket, req) => {
    console.log('[TTS] Client connected');

    socket.on('message', async (raw: Buffer) => {
      try {
        const { text } = JSON.parse(raw.toString());

        if (typeof text !== 'string' || !text.trim()) {
          return;
        }

        console.log('[TTS] Synthesizing:', text.substring(0, 50));

        try {
          for await (const chunk of piper.streamSynthesize(text)) {
            socket.send(chunk);
          }
          socket.send(JSON.stringify({ done: true }));
        } catch (e) {
          socket.send(JSON.stringify({
            error: e instanceof Error ? e.message : 'TTS failed'
          }));
        }
      } catch (e) {
        socket.send(JSON.stringify({ error: 'Invalid message' }));
      }
    });

    socket.on('close', () => {
      console.log('[TTS] Client disconnected');
    });
  });

  // STT endpoint - audio in, text out
  server.get('/voice/stt', { websocket: true }, (socket, req) => {
    console.log('[STT] Client connected');
    let audioChunks: Buffer[] = [];

    socket.on('message', async (raw: Buffer) => {
      // Check if it's a control message
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.action === 'transcribe') {
          // Transcribe collected audio
          const audio = Buffer.concat(audioChunks);
          audioChunks = [];

          if (audio.length === 0) {
            socket.send(JSON.stringify({ error: 'No audio data' }));
            return;
          }

          try {
            const text = await whisper.transcribe(audio);
            socket.send(JSON.stringify({ text, done: true }));
          } catch (e) {
            socket.send(JSON.stringify({
              error: e instanceof Error ? e.message : 'STT failed'
            }));
          }
        } else if (msg.action === 'clear') {
          audioChunks = [];
          socket.send(JSON.stringify({ cleared: true }));
        }
      } catch {
        // Binary audio data - collect it
        audioChunks.push(raw);
        socket.send(JSON.stringify({
          received: raw.length,
          total: audioChunks.reduce((s, c) => s + c.length, 0)
        }));
      }
    });

    socket.on('close', () => {
      console.log('[STT] Client disconnected');
      audioChunks = [];
    });
  });

  // Combined voice chat - full pipeline
  server.get('/voice/chat', { websocket: true }, (socket, req) => {
    console.log('[VoiceChat] Client connected');
    const ollama = new OllamaService();
    let audioChunks: Buffer[] = [];

    socket.on('message', async (raw: Buffer) => {
      try {
        const msg = JSON.parse(raw.toString());

        if (msg.action === 'speak' && msg.text) {
          // Text input - skip STT
          await handleChat(msg.text);
        } else if (msg.action === 'process_audio') {
          // Process collected audio through full pipeline
          const audio = Buffer.concat(audioChunks);
          audioChunks = [];

          if (audio.length === 0) {
            socket.send(JSON.stringify({ error: 'No audio' }));
            return;
          }

          // STT
          socket.send(JSON.stringify({ status: 'transcribing' }));
          let text: string;
          try {
            text = await whisper.transcribe(audio);
            socket.send(JSON.stringify({ status: 'transcribed', text }));
          } catch (e) {
            socket.send(JSON.stringify({ error: 'STT failed' }));
            return;
          }

          await handleChat(text);
        }
      } catch {
        // Binary audio data
        audioChunks.push(raw);
      }
    });

    async function handleChat(text: string) {
      // LLM
      socket.send(JSON.stringify({ status: 'thinking' }));
      let response = '';
      for await (const chunk of ollama.streamChat(text)) {
        response += chunk;
        socket.send(JSON.stringify({
          status: 'responding',
          chunk
        }));
      }

      // TTS
      socket.send(JSON.stringify({ status: 'speaking' }));
      try {
        for await (const audioChunk of piper.streamSynthesize(response)) {
          socket.send(audioChunk);
        }
        socket.send(JSON.stringify({
          done: true,
          text: response
        }));
      } catch {
        socket.send(JSON.stringify({
          done: true,
          text: response,
          ttsError: true
        }));
      }
    }

    socket.on('close', () => {
      console.log('[VoiceChat] Client disconnected');
    });
  });
}
```

**Step 2: Update status endpoint**

```typescript
// In packages/voice-server/src/index.ts - update status
const whisper = new WhisperService();
const whisperOk = await whisper.checkInstalled();

server.get('/status', async () => {
  return {
    status: 'ok',
    version: '0.1.0',
    services: {
      ollama: ollamaOk,
      piper: piperOk,
      whisper: whisperOk
    }
  };
});
```

**Step 3: Commit**

```bash
git add packages/voice-server/src
git commit -m "feat: add Whisper STT to voice pipeline"
```

---

## Batch 5: Chat Panel UI

### Task 5.1: Create Chat Panel Component

**Files:**
- Create: `apps/studio-electron/src/renderer/components/chatPanel.js`
- Modify: `apps/studio-electron/src/renderer/styles.css`

**Step 1: Create chat panel JS**

```javascript
// apps/studio-electron/src/renderer/components/chatPanel.js
class ChatPanel {
  constructor() {
    this.ws = null;
    this.messages = [];
    this.isConnected = false;
    this.currentStreamMessage = null;
  }

  init() {
    this.container = document.getElementById('chat-panel');
    this.messageList = document.getElementById('chat-messages');
    this.input = document.getElementById('chat-input');
    this.sendBtn = document.getElementById('chat-send');
    this.voiceBtn = document.getElementById('chat-voice');

    this.sendBtn.addEventListener('click', () => this.sendMessage());
    this.input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    this.connect();
  }

  connect() {
    this.ws = new WebSocket('ws://127.0.0.1:3847/chat');

    this.ws.onopen = () => {
      console.log('[ChatPanel] Connected');
      this.isConnected = true;
      this.updateStatus('connected');
    };

    this.ws.onclose = () => {
      console.log('[ChatPanel] Disconnected');
      this.isConnected = false;
      this.updateStatus('disconnected');
      // Reconnect after 3s
      setTimeout(() => this.connect(), 3000);
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        this.handleMessage(msg);
      } catch (e) {
        console.error('[ChatPanel] Parse error:', e);
      }
    };

    this.ws.onerror = (e) => {
      console.error('[ChatPanel] WebSocket error:', e);
    };
  }

  handleMessage(msg) {
    if (msg.type === 'assistant') {
      if (msg.streaming) {
        // Streaming chunk
        if (!this.currentStreamMessage) {
          this.currentStreamMessage = this.addMessage('assistant', '');
        }
        this.currentStreamMessage.querySelector('.message-content').textContent += msg.content;
        this.scrollToBottom();
      } else if (msg.done) {
        // Stream complete
        this.currentStreamMessage = null;
      } else {
        // Complete message (welcome, etc.)
        this.addMessage('assistant', msg.content);
      }
    } else if (msg.type === 'error') {
      this.addMessage('error', msg.content);
    }
  }

  addMessage(type, content) {
    const div = document.createElement('div');
    div.className = `chat-message ${type}`;

    const icon = type === 'assistant' ? '🤖' : type === 'error' ? '⚠️' : '👤';
    const name = type === 'assistant' ? 'Crafty' : type === 'error' ? 'Fehler' : 'Du';

    div.innerHTML = `
      <div class="message-header">
        <span class="message-icon">${icon}</span>
        <span class="message-name">${name}</span>
        <span class="message-time">${this.formatTime(new Date())}</span>
      </div>
      <div class="message-content">${content}</div>
    `;

    this.messageList.appendChild(div);
    this.scrollToBottom();
    return div;
  }

  sendMessage() {
    const text = this.input.value.trim();
    if (!text || !this.isConnected) return;

    this.addMessage('user', text);
    this.input.value = '';

    this.ws.send(JSON.stringify({
      action: 'chat',
      payload: text
    }));
  }

  scrollToBottom() {
    this.messageList.scrollTop = this.messageList.scrollHeight;
  }

  formatTime(date) {
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  }

  updateStatus(status) {
    const indicator = document.getElementById('chat-status');
    if (indicator) {
      indicator.className = `chat-status ${status}`;
      indicator.title = status === 'connected' ? 'Verbunden' : 'Nicht verbunden';
    }
  }
}

window.chatPanel = new ChatPanel();
```

**Step 2: Add CSS**

Add to `apps/studio-electron/src/renderer/styles.css`:

```css
/* Chat Panel */
.chat-panel {
  display: flex;
  flex-direction: column;
  background: var(--bg-dark);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  height: 100%;
  min-width: 280px;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--bg-darker);
  border-bottom: 2px solid var(--border-color);
}

.chat-header h3 {
  margin: 0;
  font-size: 14px;
}

.chat-status {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #666;
}

.chat-status.connected {
  background: #4ade80;
}

.chat-status.disconnected {
  background: #ef4444;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat-message {
  max-width: 90%;
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--bg-lighter);
}

.chat-message.assistant {
  align-self: flex-start;
  background: var(--primary-color);
  color: white;
}

.chat-message.user {
  align-self: flex-end;
  background: var(--bg-lighter);
}

.chat-message.error {
  align-self: center;
  background: #ef4444;
  color: white;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  opacity: 0.8;
  margin-bottom: 4px;
}

.message-content {
  font-size: 13px;
  line-height: 1.4;
}

.chat-input-area {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-top: 2px solid var(--border-color);
}

.chat-input-area input {
  flex: 1;
  padding: 8px 12px;
  border: 2px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-lighter);
  color: var(--text-color);
  font-size: 13px;
}

.chat-input-area button {
  padding: 8px 12px;
  min-width: 40px;
}
```

**Step 3: Commit**

```bash
git add apps/studio-electron/src/renderer/components apps/studio-electron/src/renderer/styles.css
git commit -m "feat: add chat panel component and styles"
```

---

### Task 5.2: Integrate Chat Panel into Layout

**Files:**
- Modify: `apps/studio-electron/src/renderer/index.html`
- Modify: `apps/studio-electron/src/renderer/app.js`

**Step 1: Update index.html**

Replace the helper-panel section with chat panel:

```html
<!-- Right: Chat Panel (replaces Crafty helper) -->
<aside class="helper-panel chat-panel" id="chat-panel">
  <div class="chat-header">
    <h3>💬 Chat mit Crafty</h3>
    <div class="chat-status" id="chat-status" title="Nicht verbunden"></div>
  </div>

  <div class="chat-messages" id="chat-messages">
    <!-- Messages inserted by JS -->
  </div>

  <div class="chat-input-area">
    <input type="text" id="chat-input" placeholder="Nachricht eingeben...">
    <button class="mc-button" id="chat-send" title="Senden">➤</button>
    <button class="mc-button" id="chat-voice" title="Sprechen">🎤</button>
  </div>
</aside>
```

Add script before app.js:
```html
<script src="components/chatPanel.js"></script>
```

**Step 2: Update app.js**

Add to init():
```javascript
// Initialize chat panel
if (window.chatPanel) {
  window.chatPanel.init();
}
```

**Step 3: Update copy-assets script**

In `apps/studio-electron/package.json`:
```json
"copy-assets": "mkdir -p dist/renderer/components && cp src/renderer/*.html src/renderer/*.css src/renderer/*.js dist/renderer/ && cp -r src/renderer/components dist/renderer/"
```

**Step 4: Commit**

```bash
git add apps/studio-electron/src/renderer apps/studio-electron/package.json
git commit -m "feat: integrate chat panel into UI"
```

---

## Batch 6: Server Integration with Electron

### Task 6.1: Auto-start Server from Electron

**Files:**
- Create: `apps/studio-electron/src/main/voiceServer.ts`
- Modify: `apps/studio-electron/src/main/index.ts`

**Step 1: Create server manager**

```typescript
// apps/studio-electron/src/main/voiceServer.ts
import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';
import { app } from 'electron';
import log from 'electron-log';

let serverProcess: ChildProcess | null = null;

export async function startVoiceServer(): Promise<boolean> {
  if (serverProcess) {
    log.info('[VoiceServer] Already running');
    return true;
  }

  const serverPath = join(app.getAppPath(), '..', '..', 'packages', 'voice-server', 'dist', 'index.js');

  return new Promise((resolve) => {
    log.info('[VoiceServer] Starting...', serverPath);

    serverProcess = spawn('node', [serverPath], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'production' }
    });

    serverProcess.stdout?.on('data', (data: Buffer) => {
      log.info('[VoiceServer]', data.toString().trim());
    });

    serverProcess.stderr?.on('data', (data: Buffer) => {
      log.error('[VoiceServer]', data.toString().trim());
    });

    serverProcess.on('error', (err) => {
      log.error('[VoiceServer] Failed to start:', err);
      serverProcess = null;
      resolve(false);
    });

    serverProcess.on('exit', (code) => {
      log.info('[VoiceServer] Exited with code:', code);
      serverProcess = null;
    });

    // Wait for server to be ready
    setTimeout(async () => {
      try {
        const res = await fetch('http://127.0.0.1:3847/status');
        if (res.ok) {
          log.info('[VoiceServer] Ready');
          resolve(true);
        } else {
          resolve(false);
        }
      } catch {
        resolve(false);
      }
    }, 2000);
  });
}

export function stopVoiceServer() {
  if (serverProcess) {
    log.info('[VoiceServer] Stopping...');
    serverProcess.kill();
    serverProcess = null;
  }
}
```

**Step 2: Update main/index.ts**

```typescript
// Add imports
import { startVoiceServer, stopVoiceServer } from './voiceServer.js';

// In app.whenReady():
await startVoiceServer();

// In app.on('before-quit'):
app.on('before-quit', () => {
  stopVoiceServer();
});
```

**Step 3: Commit**

```bash
git add apps/studio-electron/src/main
git commit -m "feat: auto-start voice server from Electron"
```

---

### Task 6.2: Add CSP for WebSocket

**Files:**
- Modify: `apps/studio-electron/src/renderer/index.html`

**Step 1: Update CSP**

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' ws://127.0.0.1:3847 http://127.0.0.1:* http://localhost:* https://api.openai.com https://api.anthropic.com https://api.elevenlabs.io">
```

**Step 2: Commit**

```bash
git add apps/studio-electron/src/renderer/index.html
git commit -m "fix: add WebSocket to CSP"
```

---

## Batch 7: Testing & Documentation

### Task 7.1: Add Integration Test

**Files:**
- Create: `packages/voice-server/src/integration.test.ts`

**Step 1: Create integration test**

```typescript
// packages/voice-server/src/integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import WebSocket from 'ws';

const SERVER_URL = 'ws://127.0.0.1:3847';

describe('Voice Server Integration', () => {
  it('should return status', async () => {
    const res = await fetch('http://127.0.0.1:3847/status');
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.status).toBe('ok');
  });

  it('should accept chat WebSocket connection', async () => {
    return new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(`${SERVER_URL}/chat`);

      ws.on('open', () => {
        ws.close();
        resolve();
      });

      ws.on('error', reject);

      setTimeout(() => reject(new Error('Timeout')), 5000);
    });
  });

  it('should receive welcome message', async () => {
    return new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(`${SERVER_URL}/chat`);

      ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        expect(msg.type).toBe('assistant');
        expect(msg.content).toContain('Crafty');
        ws.close();
        resolve();
      });

      ws.on('error', reject);

      setTimeout(() => reject(new Error('Timeout')), 5000);
    });
  });
});
```

**Step 2: Add ws dependency**

```bash
cd packages/voice-server && npm install --save-dev ws @types/ws
```

**Step 3: Commit**

```bash
git add packages/voice-server
git commit -m "test: add voice server integration tests"
```

---

### Task 7.2: Build and Run Full Test

**Step 1: Build all packages**

```bash
npm run build
```

**Step 2: Start voice server**

```bash
cd packages/voice-server && node dist/index.js &
```

**Step 3: Run tests**

```bash
npm test
```

**Step 4: Start Electron app**

```bash
cd apps/studio-electron && npm run dev
```

**Step 5: Manual verification**

1. Check chat panel shows "Verbunden" (green dot)
2. Type message, verify Ollama response streams in
3. Check server logs for connection events

**Step 6: Final commit**

```bash
git add -A
git commit -m "feat: complete voice-chat server implementation"
```

---

## Summary

| Batch | Tasks | Description |
|-------|-------|-------------|
| 1 | 1.1-1.2 | Server foundation + WebSocket chat |
| 2 | 2.1-2.2 | Ollama integration with streaming |
| 3 | 3.1-3.2 | Piper TTS service + endpoints |
| 4 | 4.1-4.2 | Whisper STT service + full pipeline |
| 5 | 5.1-5.2 | Chat panel UI component |
| 6 | 6.1-6.2 | Electron integration + CSP |
| 7 | 7.1-7.2 | Integration tests + final build |
