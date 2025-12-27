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

  // Check services on startup
  const ollama = new OllamaService();
  const piper = new PiperService();

  const ollamaOk = await ollama.checkConnection();
  const piperOk = await piper.checkInstalled();

  server.get('/status', async () => {
    // Re-check services on each status request
    const currentOllamaOk = await ollama.checkConnection();
    const currentPiperOk = await piper.checkInstalled();
    return {
      status: 'ok',
      version: '0.1.0',
      services: {
        ollama: currentOllamaOk,
        piper: currentPiperOk,
        whisper: false
      }
    };
  });

  await server.listen({ port: PORT, host: '127.0.0.1' });
  console.log(`VoiceChat server running on http://127.0.0.1:${PORT}`);
  console.log(`Services: Ollama=${ollamaOk}, Piper=${piperOk}`);
}

start().catch(console.error);
