/**
 * Texture Manager Component
 *
 * Handles texture selection, upload, preview, and management for blocks.
 * Supports both preset textures from library and custom user uploads.
 */

/**
 * Preset textures available in the application
 * Matches the server-side presetTextures.ts library
 */
const PRESET_TEXTURES = {
  stone: { name: 'Stein', description: 'Grauer Stein', color: '#7C7C7C' },
  dirt: { name: 'Erde', description: 'Braune Erde', color: '#8B6914' },
  grass: { name: 'Gras', description: 'Grünes Gras', color: '#5FAD41' },
  wood: { name: 'Holz', description: 'Braunes Holz', color: '#9B6B3C' },
  rock: { name: 'Fels', description: 'Dunkler Fels', color: '#4A4A4A' },
  sand: { name: 'Sand', description: 'Gelber Sand', color: '#EDC9AF' },
  brick: { name: 'Ziegel', description: 'Roter Ziegel', color: '#B04538' },
  coal: { name: 'Kohle', description: 'Schwarze Kohle', color: '#2B2B2B' },
  iron: { name: 'Eisen', description: 'Graues Eisen', color: '#D8D8D8' },
  gold: { name: 'Gold', description: 'Goldenes Erz', color: '#FFD700' },
  diamond: { name: 'Diamant', description: 'Hellblauer Diamant', color: '#5DADE2' },
  emerald: { name: 'Smaragd', description: 'Grüner Smaragd', color: '#50C878' },
  obsidian: { name: 'Obsidian', description: 'Schwarzer Obsidian', color: '#14141E' },
  glass: { name: 'Glas', description: 'Transparentes Glas', color: '#E8F4F8' },
  snow: { name: 'Schnee', description: 'Weißer Schnee', color: '#FFFFFF' },
  ice: { name: 'Eis', description: 'Hellblaues Eis', color: '#A0D6E8' }
};

class TextureManager {
  constructor() {
    this.currentTexture = null; // { source: 'preset'|'dataUri', value: string }
    this.previewCanvas = null;
    this.previewContext = null;
    this.onTextureChangeCallback = null;
  }

  /**
   * Initialize the texture manager with DOM elements
   */
  init(options = {}) {
    this.previewCanvas = options.previewCanvas || document.getElementById('texture-preview');
    this.onTextureChangeCallback = options.onTextureChange;

    if (this.previewCanvas) {
      this.previewContext = this.previewCanvas.getContext('2d');
      // Set canvas to 64x64 for preview (upscaled from 16x16)
      this.previewCanvas.width = 64;
      this.previewCanvas.height = 64;
    }

    // Set default texture to 'stone'
    this.setPresetTexture('stone');
  }

  /**
   * Set a preset texture by ID
   */
  setPresetTexture(presetId) {
    if (!(presetId in PRESET_TEXTURES)) {
      console.error(`[TextureManager] Unknown preset: ${presetId}`);
      return false;
    }

    this.currentTexture = {
      source: 'preset',
      value: presetId
    };

    this.updatePreview();
    this.notifyChange();
    return true;
  }

  /**
   * Upload a custom texture from user's file system
   */
  async uploadCustomTexture() {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/png,image/jpeg';

      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) {
          reject(new Error('Keine Datei ausgewählt'));
          return;
        }

        // Check file size (max 1MB)
        if (file.size > 1024 * 1024) {
          reject(new Error('Datei zu groß! Maximum: 1MB'));
          return;
        }

        // Check file type
        if (!file.type.match(/^image\/(png|jpeg)$/)) {
          reject(new Error('Nur PNG und JPEG Dateien erlaubt'));
          return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUri = ev.target.result;

          // Validate image and potentially resize to 16x16
          this.validateAndProcessImage(dataUri)
            .then((processedDataUri) => {
              this.currentTexture = {
                source: 'dataUri',
                value: processedDataUri
              };

              this.updatePreview();
              this.notifyChange();
              resolve(this.currentTexture);
            })
            .catch(reject);
        };

        reader.onerror = () => {
          reject(new Error('Fehler beim Lesen der Datei'));
        };

        reader.readAsDataURL(file);
      };

      input.click();
    });
  }

  /**
   * Validate and process uploaded image
   * Converts to PNG format and ensures proper dimensions
   */
  async validateAndProcessImage(dataUri) {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        // Create temporary canvas for processing
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 16;
        tempCanvas.height = 16;
        const ctx = tempCanvas.getContext('2d');

        // Draw image scaled to 16x16
        ctx.imageSmoothingEnabled = false; // Pixel-perfect scaling
        ctx.drawImage(img, 0, 0, 16, 16);

        // Convert to PNG DataURI
        const processedDataUri = tempCanvas.toDataURL('image/png');
        resolve(processedDataUri);
      };

      img.onerror = () => {
        reject(new Error('Ungültiges Bild'));
      };

      img.src = dataUri;
    });
  }

  /**
   * Update the preview canvas with current texture
   */
  updatePreview() {
    if (!this.previewCanvas || !this.previewContext) {
      return;
    }

    const ctx = this.previewContext;

    if (this.currentTexture.source === 'preset') {
      // For presets, draw a solid color placeholder
      const preset = PRESET_TEXTURES[this.currentTexture.value];
      ctx.fillStyle = preset.color;
      ctx.fillRect(0, 0, 64, 64);

      // Add text label
      ctx.fillStyle = '#000000';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(preset.name, 32, 36);
    } else if (this.currentTexture.source === 'dataUri') {
      // For custom textures, draw the actual image
      const img = new Image();
      img.onload = () => {
        ctx.imageSmoothingEnabled = false; // Pixel-perfect upscaling
        ctx.drawImage(img, 0, 0, 64, 64);
      };
      img.src = this.currentTexture.value;
    }
  }

  /**
   * Get current texture data
   */
  getCurrentTexture() {
    return this.currentTexture;
  }

  /**
   * Notify listeners about texture change
   */
  notifyChange() {
    if (this.onTextureChangeCallback) {
      this.onTextureChangeCallback(this.currentTexture);
    }
  }

  /**
   * Get all available preset texture IDs
   */
  getPresetTextureIds() {
    return Object.keys(PRESET_TEXTURES);
  }

  /**
   * Get preset texture metadata
   */
  getPresetTexture(id) {
    return PRESET_TEXTURES[id];
  }

  /**
   * Create a preset selector UI element
   */
  createPresetSelector() {
    const container = document.createElement('div');
    container.className = 'preset-selector';
    container.style.cssText = `
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      padding: 12px;
      background: #f5f5f5;
      border-radius: 8px;
      margin: 12px 0;
    `;

    Object.entries(PRESET_TEXTURES).forEach(([id, preset]) => {
      const btn = document.createElement('button');
      btn.className = 'preset-btn';
      btn.style.cssText = `
        padding: 8px;
        background: ${preset.color};
        border: 2px solid #ccc;
        border-radius: 4px;
        cursor: pointer;
        font-size: 10px;
        color: ${this.getContrastColor(preset.color)};
        transition: transform 0.1s;
      `;
      btn.textContent = preset.name;
      btn.title = preset.description;

      btn.onclick = () => {
        this.setPresetTexture(id);
        // Highlight selected
        container.querySelectorAll('.preset-btn').forEach(b => {
          b.style.borderColor = '#ccc';
        });
        btn.style.borderColor = '#4CAF50';
      };

      // Highlight initial selection (stone)
      if (id === 'stone') {
        btn.style.borderColor = '#4CAF50';
      }

      container.appendChild(btn);
    });

    return container;
  }

  /**
   * Get contrasting text color (black or white) for background
   */
  getContrastColor(hexColor) {
    // Convert hex to RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);

    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  }
}

// Export as global for use in app.js
window.TextureManager = TextureManager;
