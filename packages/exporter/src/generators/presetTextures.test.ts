import { describe, it, expect } from 'vitest';
import {
  PRESET_TEXTURES,
  getPresetTextureIds,
  getPresetTexture,
  getPresetTextureBuffer,
  isValidPreset,
} from './presetTextures.js';

describe('PresetTextures', () => {
  describe('PRESET_TEXTURES', () => {
    it('should contain all expected texture presets', () => {
      const expectedPresets = [
        'stone',
        'dirt',
        'grass',
        'wood',
        'rock',
        'sand',
        'brick',
        'coal',
        'iron',
        'gold',
        'diamond',
        'emerald',
        'obsidian',
        'glass',
        'snow',
        'ice',
      ];

      expectedPresets.forEach((id) => {
        expect(PRESET_TEXTURES[id]).toBeDefined();
        expect(PRESET_TEXTURES[id].id).toBe(id);
        expect(PRESET_TEXTURES[id].name).toBeTruthy();
        expect(PRESET_TEXTURES[id].description).toBeTruthy();
        expect(PRESET_TEXTURES[id].dataUri).toMatch(/^data:image\/png;base64,/);
      });
    });

    it('should have 16 preset textures', () => {
      expect(Object.keys(PRESET_TEXTURES)).toHaveLength(16);
    });
  });

  describe('getPresetTextureIds()', () => {
    it('should return all preset IDs', () => {
      const ids = getPresetTextureIds();
      expect(ids).toContain('stone');
      expect(ids).toContain('diamond');
      expect(ids).toContain('ice');
      expect(ids.length).toBe(16);
    });
  });

  describe('getPresetTexture()', () => {
    it('should return preset texture by ID', () => {
      const stone = getPresetTexture('stone');
      expect(stone).toBeDefined();
      expect(stone?.id).toBe('stone');
      expect(stone?.name).toBe('Stein');
    });

    it('should return undefined for unknown ID', () => {
      const unknown = getPresetTexture('unknown_texture');
      expect(unknown).toBeUndefined();
    });
  });

  describe('getPresetTextureBuffer()', () => {
    it('should return valid PNG buffer for known preset', () => {
      const buffer = getPresetTextureBuffer('stone');
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);

      // Check PNG magic number (first 8 bytes)
      expect(buffer[0]).toBe(0x89);
      expect(buffer[1]).toBe(0x50); // 'P'
      expect(buffer[2]).toBe(0x4e); // 'N'
      expect(buffer[3]).toBe(0x47); // 'G'
    });

    it('should throw error for unknown preset', () => {
      expect(() => getPresetTextureBuffer('unknown')).toThrow(
        /E_UNKNOWN_PRESET/
      );
    });

    it('should return consistent buffer for same preset', () => {
      const buffer1 = getPresetTextureBuffer('diamond');
      const buffer2 = getPresetTextureBuffer('diamond');
      expect(buffer1.equals(buffer2)).toBe(true);
    });
  });

  describe('isValidPreset()', () => {
    it('should return true for valid presets', () => {
      expect(isValidPreset('stone')).toBe(true);
      expect(isValidPreset('diamond')).toBe(true);
      expect(isValidPreset('ice')).toBe(true);
    });

    it('should return false for invalid presets', () => {
      expect(isValidPreset('unknown')).toBe(false);
      expect(isValidPreset('')).toBe(false);
      expect(isValidPreset('Stone')).toBe(false); // case-sensitive
    });
  });

  describe('DataURI format', () => {
    it('should have valid Base64 encoded data', () => {
      Object.values(PRESET_TEXTURES).forEach((preset) => {
        const matches = preset.dataUri.match(/^data:image\/png;base64,(.+)$/);
        expect(matches).toBeTruthy();

        if (matches) {
          const base64 = matches[1];
          // Check that it's valid Base64
          expect(base64).toMatch(/^[A-Za-z0-9+/=]+$/);

          // Should be decodable
          const buffer = Buffer.from(base64, 'base64');
          expect(buffer.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('Texture metadata', () => {
    it('should have German names', () => {
      // Spot check a few
      expect(getPresetTexture('stone')?.name).toBe('Stein');
      expect(getPresetTexture('dirt')?.name).toBe('Erde');
      expect(getPresetTexture('glass')?.name).toBe('Glas');
      expect(getPresetTexture('snow')?.name).toBe('Schnee');
    });

    it('should have descriptive descriptions', () => {
      Object.values(PRESET_TEXTURES).forEach((preset) => {
        expect(preset.description.length).toBeGreaterThan(5);
      });
    });
  });
});
