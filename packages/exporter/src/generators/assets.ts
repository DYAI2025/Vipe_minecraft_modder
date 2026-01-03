import fs from 'fs-extra';
import path from 'path';
import { getPresetTextureBuffer, isValidPreset } from './presetTextures.js';

/**
 * Converts a DataURI (PNG) to a Buffer for file writing.
 */
export function dataUriToBuffer(dataUri: string): Buffer {
    const matches = dataUri.match(/^data:image\/png;base64,(.+)$/);
    if (!matches) {
        throw new Error('E_INVALID_IMAGE: Expected base64 PNG dataUri');
    }
    return Buffer.from(matches[1], 'base64');
}

/**
 * Generates texture files in the output directory.
 * Handles both custom DataURI textures and preset textures from the library.
 */
export async function generateBlockTextures(outputDir: string, modId: string, blocks: Record<string, any>) {
    const texturePath = path.join(outputDir, 'src/main/resources/assets', modId, 'textures/block');
    await fs.ensureDir(texturePath);

    for (const [id, block] of Object.entries(blocks)) {
        const textureFilePath = path.join(texturePath, `${id}.png`);

        if (block.texture?.source === 'dataUri') {
            // Custom uploaded texture (Base64 DataURI)
            const buffer = dataUriToBuffer(block.texture.value);
            await fs.writeFile(textureFilePath, buffer);
        } else if (block.texture?.source === 'preset') {
            // Preset texture from library
            const presetId = block.texture.value;

            if (!isValidPreset(presetId)) {
                console.warn(`[WARN] Unknown preset texture "${presetId}" for block "${id}". Skipping.`);
                continue;
            }

            const buffer = getPresetTextureBuffer(presetId);
            await fs.writeFile(textureFilePath, buffer);
        } else {
            // No texture specified - skip
            console.warn(`[WARN] No texture specified for block "${id}". Skipping.`);
        }
    }
}
