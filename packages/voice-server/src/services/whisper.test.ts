import { describe, it, expect } from 'vitest';
import { WhisperService } from './whisper.js';

describe('WhisperService', () => {
  it('should create instance with default config', () => {
    const whisper = new WhisperService();
    expect(whisper).toBeDefined();
  });

  it('should create instance with custom config', () => {
    const whisper = new WhisperService({ model: 'base', language: 'en', threads: 2 });
    expect(whisper).toBeDefined();
  });

  it('should check if whisper is installed (may be false)', async () => {
    const whisper = new WhisperService();
    const installed = await whisper.checkInstalled();
    expect(typeof installed).toBe('boolean');
  });
});
