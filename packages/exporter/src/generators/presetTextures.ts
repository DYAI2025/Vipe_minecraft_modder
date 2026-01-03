/**
 * Preset texture library for KidModStudio
 *
 * Contains Base64-encoded 16x16 PNG textures for common block types.
 * These textures are embedded in the application and can be used without upload.
 */

export interface PresetTexture {
  id: string;
  name: string;
  description: string;
  dataUri: string;
}

/**
 * Simple 16x16 solid color PNG textures (Base64 encoded)
 * Generated using minimal PNG format for embedding
 */
export const PRESET_TEXTURES: Record<string, PresetTexture> = {
  stone: {
    id: 'stone',
    name: 'Stein',
    description: 'Grauer Stein',
    // 16x16 gray stone texture
    dataUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAP0lEQVR4nGNgYGD4z0AEYBxVQBgY1UAfGNXw/z8DEQpGNdAHRjX8/89AhIJRDfSBUQ1kgFEN9IFRDWSAoaEBAHOzBPP3pSLLAAAAAElFTkSuQmCC'
  },

  dirt: {
    id: 'dirt',
    name: 'Erde',
    description: 'Braune Erde',
    // 16x16 brown dirt texture
    dataUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAQklEQVR4nGNgYGD4z0AEYBpVQBgY1UAfGNXAnwbCwKgG+sCoBv40EAZGNdAHRjXwp4EwMKqBPjCqgT8NhIFRDQwMAF1sBPTvDQnlAAAAAElFTkSuQmCC'
  },

  grass: {
    id: 'grass',
    name: 'Gras',
    description: 'Grünes Gras',
    // 16x16 green grass texture
    dataUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAQUlEQVR4nGNgoAZgpIoBhIBRBYSBUQX0gVEN/GkgDIxqoA+MauBPA2FgVAN9YFQD/zQQBkY10AdGNfBPA2FgVAMDAwC3rASALDqm7gAAAABJRU5ErkJggg=='
  },

  wood: {
    id: 'wood',
    name: 'Holz',
    description: 'Braunes Holz',
    // 16x16 brown wood texture
    dataUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAARElEQVR4nGNgYGD4z0AEYBpVQBgY1UAfGNXAnwbCwKgG+sCoBv40EAZGNdAHRjXwp4EwMKqBPjCqgT8NhIFRDQwMAACzBAT08JELwgAAAABJRU5ErkJggg=='
  },

  rock: {
    id: 'rock',
    name: 'Fels',
    description: 'Dunkler Fels',
    // 16x16 dark gray rock texture
    dataUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAP0lEQVR4nGNgYGD4z0AEYBxVQBgY1UAfGNXw/z8DEQpGNdAHRjX8/89AhIJRDfSBUQ1kgFEN9IFRDWSAoaEBAGa/BPMJpSLLAAAAAElFTkSuQmCC'
  },

  sand: {
    id: 'sand',
    name: 'Sand',
    description: 'Gelber Sand',
    // 16x16 yellow sand texture
    dataUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAQklEQVR4nGNgIBMwjiqgD4xq+P+fgQgFoxroA6Ma/v9nIELBqAb6wKgGMsCoBvrAqAYywKgG+sCoBjLAqAb6wNDQAABu/wTzL6UizAAAAABJRU5ErkJggg=='
  },

  brick: {
    id: 'brick',
    name: 'Ziegel',
    description: 'Roter Ziegel',
    // 16x16 red brick texture
    dataUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAARUlEQVR4nGNgYGD4z0AEYBpVQBgY1UAfGNXAnwbCwKgG+sCoBv40EAZGNdAHRjXwp4EwMKqBPjCqgT8NhIFRDQwMAACz9AUFm6UizAAAAABJRU5ErkJggg=='
  },

  coal: {
    id: 'coal',
    name: 'Kohle',
    description: 'Schwarze Kohle',
    // 16x16 black coal texture
    dataUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAO0lEQVR4nGNgYGD4z0AEYBxVQBgY1UAfGNXw/z8DEQpGNdAHRjX8/89AhIJRDfSBUQ1kgFEN9IFRDQwAAPG/BPNJpSLLAAAAAElFTkSuQmCC'
  },

  iron: {
    id: 'iron',
    name: 'Eisen',
    description: 'Graues Eisen',
    // 16x16 light gray iron texture
    dataUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAQElEQVR4nGNgYGD4z0AEYBxVQBgY1UAfGNXw/z8DEQpGNdAHRjX8/89AhIJRDfSBUQ1kgFEN9IFRDWSAoaEBAHe/BPPvpSLLAAAAAElFTkSuQmCC'
  },

  gold: {
    id: 'gold',
    name: 'Gold',
    description: 'Goldenes Erz',
    // 16x16 yellow gold texture
    dataUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAARklEQVR4nGNgYGD4z0AEYBpVQBgY1UAfGNXAnwbCwKgG+sCoBv40EAZGNdAHRjXwp4EwMKqBPjCqgT8NhIFRDQwMAACz+AUFnaUizAAAAABJRU5ErkJggg=='
  },

  diamond: {
    id: 'diamond',
    name: 'Diamant',
    description: 'Hellblauer Diamant',
    // 16x16 cyan diamond texture
    dataUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAQklEQVR4nGNgYGBgIAYwjiqgD4xq+P+fgQgFoxroA6Ma/v9nIELBqAb6wKgGMsCoBvrAqAYywKgG+sCoBjLA0NAAAHTzBPMv5SKMAAAAAElFTkSuQmCC'
  },

  emerald: {
    id: 'emerald',
    name: 'Smaragd',
    description: 'Grüner Smaragd',
    // 16x16 bright green emerald texture
    dataUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAQ0lEQVR4nGNgYGBgIAYwjiqgD4xq+P+fgQgFoxroA6Ma/v9nIELBqAb6wKgGMsCoBvrAqAYywKgG+sCoBjLA0NAAAHTzBQUv5SKMAAAAAElFTkSuQmCC'
  },

  obsidian: {
    id: 'obsidian',
    name: 'Obsidian',
    description: 'Schwarzer Obsidian',
    // 16x16 dark obsidian texture
    dataUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAOklEQVR4nGNgYGD4z0AEYBxVQBgY1UAfGNXw/z8DEQpGNdAHRjX8/89AhIJRDfSBUQ1kgFEN9IFRDQwAAPW/BPNJpSLLAAAAAElFTkSuQmCC'
  },

  glass: {
    id: 'glass',
    name: 'Glas',
    description: 'Transparentes Glas',
    // 16x16 light blue/white glass texture
    dataUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAP0lEQVR4nGNgYGD4z0AEYBxVQBgY1UAfGNXw/z8DEQpGNdAHRjX8/89AhIJRDfSBUQ1kgFEN9IFRDWSAoaEBAOG/BfPvpSLLAAAAAElFTkSuQmCC'
  },

  snow: {
    id: 'snow',
    name: 'Schnee',
    description: 'Weißer Schnee',
    // 16x16 white snow texture
    dataUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAANklEQVR4nGNgYGD4z0AEYBxVQBgY1UAfGNXw/z8DEQpGNdAHRjX8/89AhIJRDfSBUQ1kgKGhAQBmvwXz76UiywAAAABJRU5ErkJggg=='
  },

  ice: {
    id: 'ice',
    name: 'Eis',
    description: 'Hellblaues Eis',
    // 16x16 light blue ice texture
    dataUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAQElEQVR4nGNgYGBgIAYwjiqgD4xq+P+fgQgFoxroA6Ma/v9nIELBqAb6wKgGMsCoBvrAqAYywKgG+sCoBjLA0NAAAHTzBPMv5SKMAAAAAElFTkSuQmCC'
  }
};

/**
 * Get all preset texture IDs
 */
export function getPresetTextureIds(): string[] {
  return Object.keys(PRESET_TEXTURES);
}

/**
 * Get a preset texture by ID
 */
export function getPresetTexture(id: string): PresetTexture | undefined {
  return PRESET_TEXTURES[id];
}

/**
 * Get preset texture as Buffer for file writing
 */
export function getPresetTextureBuffer(id: string): Buffer {
  const preset = PRESET_TEXTURES[id];
  if (!preset) {
    throw new Error(`E_UNKNOWN_PRESET: No preset texture found with id "${id}"`);
  }

  // Extract base64 data from dataUri
  const matches = preset.dataUri.match(/^data:image\/png;base64,(.+)$/);
  if (!matches) {
    throw new Error(`E_INVALID_PRESET: Preset texture "${id}" has invalid dataUri format`);
  }

  return Buffer.from(matches[1], 'base64');
}

/**
 * Check if a texture ID is a valid preset
 */
export function isValidPreset(id: string): boolean {
  return id in PRESET_TEXTURES;
}
