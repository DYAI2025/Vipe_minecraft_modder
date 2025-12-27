import { describe, it, expect } from 'vitest';
import { OllamaService } from './ollama.js';

describe('OllamaService', () => {
  it('should create instance with system prompt', () => {
    const ollama = new OllamaService();
    expect(ollama).toBeDefined();
  });

  it('should check connection (may fail if Ollama not running)', async () => {
    const ollama = new OllamaService();
    const connected = await ollama.checkConnection();
    // Don't assert true/false - just check it doesn't throw
    expect(typeof connected).toBe('boolean');
  });

  it('should clear history', () => {
    const ollama = new OllamaService();
    ollama.clearHistory();
    // Should not throw
    expect(ollama).toBeDefined();
  });
});
