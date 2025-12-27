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
        } catch {
          // Skip malformed JSON lines
        }
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
