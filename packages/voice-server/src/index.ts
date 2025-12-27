import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { chatRoutes } from './routes/chat.js';
import { OllamaService } from './services/ollama.js';

const PORT = 3847;

async function start() {
  const server = Fastify({ logger: true });

  await server.register(cors, { origin: true });
  await server.register(websocket);
  await server.register(chatRoutes);

  // Check services on startup
  const ollama = new OllamaService();
  const ollamaOk = await ollama.checkConnection();

  server.get('/status', async () => {
    // Re-check Ollama on each status request
    const currentOllamaOk = await ollama.checkConnection();
    return {
      status: 'ok',
      version: '0.1.0',
      services: {
        ollama: currentOllamaOk,
        whisper: false,
        piper: false
      }
    };
  });

  await server.listen({ port: PORT, host: '127.0.0.1' });
  console.log(`VoiceChat server running on http://127.0.0.1:${PORT}`);
  console.log(`Services: Ollama=${ollamaOk}`);
}

start().catch(console.error);
