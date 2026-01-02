import fs from 'fs-extra';
import path from 'path';
import { generateBlockTextures } from './generators/assets.js';
import { generateBlockRegistry } from './generators/java.js';

export interface ExportOptions {
    project: any;
    templateDir: string;
    outputDir: string;
}

export async function exportProject(options: ExportOptions) {
    const { project, templateDir, outputDir } = options;
    const modId = project.meta.modId;

    console.log(`Exporter: Starting export for ${modId}...`);

    // 1. Clean and prepare output dir
    if (await fs.pathExists(outputDir)) {
        await fs.remove(outputDir);
    }
    await fs.ensureDir(outputDir);

    // 2. Copy Template
    console.log('Exporter: Copying Fabric template...');
    await fs.copy(templateDir, outputDir);

    // 3. Generate Assets (Textures, Models, etc.)
    console.log('Exporter: Generating assets...');
    await generateBlockTextures(outputDir, modId, project.blocks);

    // 4. Generate Code (Java Registry)
    console.log('Exporter: Generating Java code...');
    await generateBlockRegistry(outputDir, modId, project.blocks);

    // 5. Update fabric.mod.json (Optional, but recommended)
    const modJsonPath = path.join(outputDir, 'src/main/resources/fabric.mod.json');
    if (await fs.pathExists(modJsonPath)) {
        const modJson = await fs.readJson(modJsonPath);
        modJson.id = modId;
        modJson.name = project.meta.name;
        modJson.version = project.meta.version;
        await fs.writeJson(modJsonPath, modJson, { spaces: 2 });
    }

    console.log('Exporter: Export completed successfully.');
    return { ok: true, outputDir };
}
