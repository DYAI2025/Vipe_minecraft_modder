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
