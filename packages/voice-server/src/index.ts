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
