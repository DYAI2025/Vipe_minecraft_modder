import { describe, it, expect } from 'vitest';
import { MacOSSayService } from './macos-say.js';
import { platform } from 'os';

describe('MacOSSayService', () => {
  it('should create instance with default config', () => {
    const service = new MacOSSayService();
    expect(service).toBeDefined();
  });

  it('should create instance with custom config', () => {
    const service = new MacOSSayService({ voice: 'Markus', rate: 200 });
    expect(service).toBeDefined();
  });

  it('should check if say is installed (platform dependent)', async () => {
    const service = new MacOSSayService();
    const installed = await service.checkInstalled();

    if (platform() === 'darwin') {
      // On macOS, say should always be available
      expect(installed).toBe(true);
    } else {
      // On other platforms, should return false
      expect(installed).toBe(false);
    }
  });

  it('should return empty voices list on non-macOS', () => {
    const voices = MacOSSayService.getAvailableVoices();
    if (platform() !== 'darwin') {
      expect(voices).toEqual([]);
    } else {
      expect(Array.isArray(voices)).toBe(true);
    }
  });

  it('should return empty German voices list on non-macOS', () => {
    const voices = MacOSSayService.getGermanVoices();
    if (platform() !== 'darwin') {
      expect(voices).toEqual([]);
    } else {
      expect(Array.isArray(voices)).toBe(true);
    }
  });
});
