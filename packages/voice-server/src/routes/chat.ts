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
          const startTime = Date.now();

          try {
            for await (const chunk of ollama.streamChat(msg.payload)) {
              // Send streaming chunk
              socket.send(JSON.stringify({
                type: 'assistant',
                content: chunk,
                streaming: true,
                timestamp: startTime
              } as ChatMessage));
            }
            // Send completion marker
            socket.send(JSON.stringify({
              type: 'assistant',
              content: '',
              streaming: false,
              done: true,
              timestamp: startTime
            } as ChatMessage));
          } catch (e) {
            socket.send(JSON.stringify({
              type: 'error',
              content: `Ollama Fehler: ${e instanceof Error ? e.message : 'Unbekannt'}`,
              timestamp: Date.now()
            } as ChatMessage));
          }
        }
      } catch (e) {
        socket.send(JSON.stringify({
          type: 'error',
          content: 'Invalid message format',
          timestamp: Date.now()
        } as ChatMessage));
      }
    });

    socket.on('close', () => {
      console.log('[Chat] Client disconnected');
    });
  });
}
