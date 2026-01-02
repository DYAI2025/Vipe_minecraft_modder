import fs from 'fs-extra';
import path from 'path';

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
 */
export async function generateBlockTextures(outputDir: string, modId: string, blocks: Record<string, any>) {
    const texturePath = path.join(outputDir, 'src/main/resources/assets', modId, 'textures/block');
    await fs.ensureDir(texturePath);

    for (const [id, block] of Object.entries(blocks)) {
        if (block.texture?.source === 'dataUri') {
            const buffer = dataUriToBuffer(block.texture.value);
            await fs.writeFile(path.join(texturePath, `${id}.png`), buffer);
        }
        // presets usually handled by copying from a known library, 
        // but for now we assume they are already there or handled elsewhere.
    }
}
