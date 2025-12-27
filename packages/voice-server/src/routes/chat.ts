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
