import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { dataUriToBuffer, generateBlockTextures } from './assets.js';

describe('Asset Generator - Textures', () => {
  const testOutputDir = path.join(__dirname, '__test_output__');
  const modId = 'test_mod';

  beforeEach(async () => {
    // Clean up test directory
    await fs.remove(testOutputDir);
    await fs.ensureDir(testOutputDir);
  });

  afterEach(async () => {
    // Clean up after tests
    await fs.remove(testOutputDir);
  });

  describe('dataUriToBuffer()', () => {
    it('should convert valid PNG DataURI to Buffer', () => {
      // Simple 1x1 red PNG
      const dataUri =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

      const buffer = dataUriToBuffer(dataUri);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);

      // Check PNG signature
      expect(buffer[0]).toBe(0x89);
      expect(buffer[1]).toBe(0x50); // 'P'
      expect(buffer[2]).toBe(0x4e); // 'N'
      expect(buffer[3]).toBe(0x47); // 'G'
    });

    it('should throw error for invalid DataURI format', () => {
      expect(() => dataUriToBuffer('invalid')).toThrow(/E_INVALID_IMAGE/);
      expect(() => dataUriToBuffer('data:image/jpeg;base64,abc')).toThrow(
        /E_INVALID_IMAGE/
      );
      expect(() => dataUriToBuffer('')).toThrow(/E_INVALID_IMAGE/);
    });

    it('should handle various PNG DataURIs', () => {
      const validDataUris = [
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mP8z8DwHwMaYBwVSAcAFCAC/vPziPYAAAAASUVORK5CYII=',
      ];

      validDataUris.forEach((uri) => {
        const buffer = dataUriToBuffer(uri);
        expect(buffer).toBeInstanceOf(Buffer);
        expect(buffer[0]).toBe(0x89); // PNG signature
      });
    });
  });

  describe('generateBlockTextures()', () => {
    it('should generate texture from DataURI', async () => {
      const blocks = {
        custom_block: {
          id: 'custom_block',
          name: 'Custom Block',
          texture: {
            source: 'dataUri',
            value:
              'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
          },
        },
      };

      await generateBlockTextures(testOutputDir, modId, blocks);

      const texturePath = path.join(
        testOutputDir,
        'src/main/resources/assets',
        modId,
        'textures/block',
        'custom_block.png'
      );

      expect(await fs.pathExists(texturePath)).toBe(true);

      const buffer = await fs.readFile(texturePath);
      expect(buffer[0]).toBe(0x89); // PNG signature
    });

    it('should generate texture from preset', async () => {
      const blocks = {
        stone_block: {
          id: 'stone_block',
          name: 'Stone Block',
          texture: {
            source: 'preset',
            value: 'stone',
          },
        },
      };

      await generateBlockTextures(testOutputDir, modId, blocks);

      const texturePath = path.join(
        testOutputDir,
        'src/main/resources/assets',
        modId,
        'textures/block',
        'stone_block.png'
      );

      expect(await fs.pathExists(texturePath)).toBe(true);

      const buffer = await fs.readFile(texturePath);
      expect(buffer[0]).toBe(0x89); // PNG signature
    });

    it('should handle multiple blocks with different texture sources', async () => {
      const blocks = {
        custom_block: {
          id: 'custom_block',
          texture: {
            source: 'dataUri',
            value:
              'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
          },
        },
        stone_block: {
          id: 'stone_block',
          texture: {
            source: 'preset',
            value: 'stone',
          },
        },
        diamond_block: {
          id: 'diamond_block',
          texture: {
            source: 'preset',
            value: 'diamond',
          },
        },
      };

      await generateBlockTextures(testOutputDir, modId, blocks);

      const customPath = path.join(
        testOutputDir,
        'src/main/resources/assets',
        modId,
        'textures/block',
        'custom_block.png'
      );
      const stonePath = path.join(
        testOutputDir,
        'src/main/resources/assets',
        modId,
        'textures/block',
        'stone_block.png'
      );
      const diamondPath = path.join(
        testOutputDir,
        'src/main/resources/assets',
        modId,
        'textures/block',
        'diamond_block.png'
      );

      expect(await fs.pathExists(customPath)).toBe(true);
      expect(await fs.pathExists(stonePath)).toBe(true);
      expect(await fs.pathExists(diamondPath)).toBe(true);
    });

    it('should skip blocks with invalid preset and warn', async () => {
      const blocks = {
        invalid_block: {
          id: 'invalid_block',
          texture: {
            source: 'preset',
            value: 'unknown_preset',
          },
        },
      };

      // Should not throw, but log warning
      await generateBlockTextures(testOutputDir, modId, blocks);

      const texturePath = path.join(
        testOutputDir,
        'src/main/resources/assets',
        modId,
        'textures/block',
        'invalid_block.png'
      );

      // File should NOT be created
      expect(await fs.pathExists(texturePath)).toBe(false);
    });

    it('should skip blocks with no texture and warn', async () => {
      const blocks = {
        no_texture_block: {
          id: 'no_texture_block',
          name: 'No Texture',
          // No texture property
        },
      };

      await generateBlockTextures(testOutputDir, modId, blocks);

      const texturePath = path.join(
        testOutputDir,
        'src/main/resources/assets',
        modId,
        'textures/block',
        'no_texture_block.png'
      );

      expect(await fs.pathExists(texturePath)).toBe(false);
    });

    it('should create directory structure if it does not exist', async () => {
      const blocks = {
        test_block: {
          id: 'test_block',
          texture: {
            source: 'preset',
            value: 'rock',
          },
        },
      };

      await generateBlockTextures(testOutputDir, modId, blocks);

      const textureDir = path.join(
        testOutputDir,
        'src/main/resources/assets',
        modId,
        'textures/block'
      );

      expect(await fs.pathExists(textureDir)).toBe(true);
      const stats = await fs.stat(textureDir);
      expect(stats.isDirectory()).toBe(true);
    });
  });

  describe('Integration: Full texture workflow', () => {
    it('should handle complete mod export with textures', async () => {
      const blocks = {
        my_stone: {
          id: 'my_stone',
          name: 'My Stone',
          texture: { source: 'preset', value: 'stone' },
        },
        my_custom: {
          id: 'my_custom',
          name: 'My Custom',
          texture: {
            source: 'dataUri',
            value:
              'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
          },
        },
      };

      await generateBlockTextures(testOutputDir, 'kid_mod', blocks);

      // Verify both files exist
      const stonePath = path.join(
        testOutputDir,
        'src/main/resources/assets/kid_mod/textures/block/my_stone.png'
      );
      const customPath = path.join(
        testOutputDir,
        'src/main/resources/assets/kid_mod/textures/block/my_custom.png'
      );

      expect(await fs.pathExists(stonePath)).toBe(true);
      expect(await fs.pathExists(customPath)).toBe(true);

      // Verify both are valid PNGs
      const stoneBuffer = await fs.readFile(stonePath);
      const customBuffer = await fs.readFile(customPath);

      expect(stoneBuffer[0]).toBe(0x89);
      expect(customBuffer[0]).toBe(0x89);
    });
  });
});
