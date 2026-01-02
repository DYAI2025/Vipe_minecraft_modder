import fs from 'fs-extra';
import path from 'path';

/**
 * Generates the Java Registry class for Fabric.
 */
export async function generateBlockRegistry(outputDir: string, modId: string, blocks: Record<string, any>) {
    const pkgPath = `com/kidmodstudio/${modId}`;
    const javaPath = path.join(outputDir, 'src/main/java', pkgPath);
    await fs.ensureDir(javaPath);

    const className = 'ModBlocks';
    let code = `package com.kidmodstudio.${modId};\n\n`;
    code += `import net.minecraft.block.Block;\n`;
    code += `import net.minecraft.block.AbstractBlock;\n`;
    code += `import net.minecraft.block.Material;\n`;
    code += `import net.minecraft.util.Identifier;\n`;
    code += `import net.minecraft.util.registry.Registry;\n\n`;

    code += `public class ${className} {\n\n`;

    for (const [id, block] of Object.entries(blocks)) {
        const uId = id.toUpperCase();
        code += `    public static final Block ${uId} = register("${id}", new Block(AbstractBlock.Settings.of(Material.STONE).strength(${block.properties?.hardness || 1}f)));\n`;
    }

    code += `\n    private static Block register(String name, Block block) {\n`;
    code += `        return Registry.register(Registry.BLOCK, new Identifier("${modId}", name), block);\n`;
    code += `    }\n\n`;
    code += `    public static void registerModBlocks() {\n`;
    code += `        // Trigger static init\n`;
    code += `    }\n`;
    code += `}\n`;

    await fs.writeFile(path.join(javaPath, `${className}.java`), code);
}
