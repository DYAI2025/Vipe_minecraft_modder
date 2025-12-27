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
            socket.send(JSON.stringify({ status: 'transcribing' }));
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

  // Combined voice chat - full pipeline (audio in, audio out)
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
        // Binary audio data - collect it
        audioChunks.push(raw);
      }
    });

    async function handleChat(text: string) {
      // LLM
      socket.send(JSON.stringify({ status: 'thinking' }));
      let response = '';
      for await (const chunk of ollama.streamChat(text)) {
        response += chunk;
        socket.send(JSON.stringify({ status: 'responding', chunk }));
      }

      // TTS
      socket.send(JSON.stringify({ status: 'speaking', text: response }));
      try {
        for await (const audioChunk of piper.streamSynthesize(response)) {
          socket.send(audioChunk);
        }
        socket.send(JSON.stringify({ done: true, text: response }));
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
