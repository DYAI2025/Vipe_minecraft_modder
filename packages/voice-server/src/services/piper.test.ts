import { describe, it, expect } from 'vitest';
import { PiperService } from './piper.js';

describe('PiperService', () => {
  it('should create instance with default config', () => {
    const piper = new PiperService();
    expect(piper).toBeDefined();
  });

  it('should create instance with custom config', () => {
    const piper = new PiperService({ voice: 'custom-voice', speed: 1.2 });
    expect(piper).toBeDefined();
  });

  it('should check if piper is installed (may be false)', async () => {
    const piper = new PiperService();
    const installed = await piper.checkInstalled();
    expect(typeof installed).toBe('boolean');
  });
});
