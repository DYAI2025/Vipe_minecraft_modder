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

  // Combined voice chat - text input with voice output
  server.get('/voice/chat', { websocket: true }, (socket, req) => {
    console.log('[VoiceChat] Client connected');
    const ollama = new OllamaService();

    socket.on('message', async (raw: Buffer) => {
      try {
        const msg = JSON.parse(raw.toString());

        if (msg.action === 'speak' && msg.text) {
          // Get LLM response
          socket.send(JSON.stringify({ status: 'thinking' }));

          let response = '';
          for await (const chunk of ollama.streamChat(msg.text)) {
            response += chunk;
            socket.send(JSON.stringify({ status: 'responding', chunk }));
          }

          // Synthesize response with TTS
          socket.send(JSON.stringify({ status: 'speaking', text: response }));

          try {
            for await (const audioChunk of piper.streamSynthesize(response)) {
              socket.send(audioChunk);
            }
            socket.send(JSON.stringify({ done: true, text: response }));
          } catch (e) {
            socket.send(JSON.stringify({
              done: true,
              text: response,
              ttsError: true,
              error: e instanceof Error ? e.message : 'TTS failed'
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
