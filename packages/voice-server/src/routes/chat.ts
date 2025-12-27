import { FastifyInstance } from 'fastify';
import { WebSocketMessage, ChatMessage } from '../types.js';
import { OllamaService } from '../services/ollama.js';
import { EspeakService } from '../services/espeak.js';

export async function chatRoutes(server: FastifyInstance) {
  const espeak = new EspeakService({ voice: 'de', speed: 140 });
  let espeakAvailable = false;

  // Check espeak availability
  espeak.checkInstalled().then(available => {
    espeakAvailable = available;
    console.log('[Chat] espeak TTS:', available ? 'available' : 'not available');
  });

  server.get('/chat', { websocket: true }, (socket, req) => {
    console.log('[Chat] Client connected');
    const ollama = new OllamaService();

    // Send and speak welcome message
    const welcomeText = 'Hallo! Ich bin Crafty! Was bauen wir heute?';
    const welcome: ChatMessage = {
      type: 'assistant',
      content: welcomeText,
      timestamp: Date.now()
    };
    socket.send(JSON.stringify(welcome));

    // Speak welcome
    if (espeakAvailable) {
      espeak.speak(welcomeText).catch(e => console.error('[Chat] TTS error:', e));
    }

    socket.on('message', async (raw: Buffer) => {
      try {
        const msg: WebSocketMessage = JSON.parse(raw.toString());

        if (msg.action === 'chat' && typeof msg.payload === 'string') {
          // Stream response from Ollama
          const startTime = Date.now();
          let fullResponse = '';

          try {
            for await (const chunk of ollama.streamChat(msg.payload)) {
              fullResponse += chunk;
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

            // Speak the complete response
            if (espeakAvailable && fullResponse.trim()) {
              console.log('[Chat] Speaking response:', fullResponse.substring(0, 50) + '...');
              espeak.speak(fullResponse).catch(e => console.error('[Chat] TTS error:', e));
            }
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
