\
/* KidModStudio Exporter (v0.1)
 *
 * Usage:
 *   node index.js --project path/to/project.json --template path/to/template --out path/to/output
 *
 * This exporter:
 * - validates project.json with AJV
 * - copies template -> out dir
 * - replaces placeholders in gradle and fabric.mod.json
 * - generates Java registry files (blocks/items/item group)
 * - generates resource JSONs + textures (procedural or imported)
 *
 * NOTE: Keep the template folder "known-good" and include gradle wrapper jar/scripts.
 */

const path = require("path");
const fs = require("fs-extra");
const minimist = require("minimist");
const Ajv = require("ajv");
const addFormats = require("ajv-formats");
const { PNG } = require("pngjs");

function die(msg) {
  console.error("[exporter] ERROR:", msg);
  process.exit(1);
}

function assertSafeRel(rel) {
  // Prevent path traversal
  if (rel.includes("..") || path.isAbsolute(rel)) {
    throw new Error("Unsafe path: " + rel);
  }
}

function toPackagePath(pkg) {
  return pkg.replace(/\./g, "/");
}

function replaceAll(text, vars) {
  let out = text;
  for (const [k, v] of Object.entries(vars)) {
    const needle = new RegExp("\\{\\{\\s*" + k + "\\s*\\}\\}", "g");
    out = out.replace(needle, String(v));
  }
  return out;
}

function parseHexColor(hex) {
  // "#RRGGBB"
  const m = /^#([0-9a-fA-F]{6})$/.exec(hex || "");
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function presetToColor(preset) {
  // Simple presets for MVP, tweak later
  switch (preset) {
    case "ruby": return { r: 210, g: 40, b: 70 };
    case "emerald": return { r: 40, g: 200, b: 120 };
    case "diamond": return { r: 80, g: 220, b: 220 };
    case "stone": return { r: 130, g: 130, b: 130 };
    case "wood": return { r: 150, g: 110, b: 70 };
    case "grass": return { r: 60, g: 170, b: 60 };
    case "glass": return { r: 180, g: 220, b: 230 };
    case "solid":
    default: return { r: 200, g: 200, b: 200 };
  }
}

async function writeSolidPng(filePath, rgba, size = 16, alpha = 255) {
  const png = new PNG({ width: size, height: size });
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;
      png.data[idx + 0] = rgba.r;
      png.data[idx + 1] = rgba.g;
      png.data[idx + 2] = rgba.b;
      png.data[idx + 3] = alpha;
    }
  }
  await fs.ensureDir(path.dirname(filePath));
  await new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(filePath);
    png.pack().pipe(stream);
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
}

async function writeTexture(outPath, textureDef) {
  if (textureDef.type === "import") {
    const src = textureDef.path;
    await fs.ensureDir(path.dirname(outPath));
    await fs.copyFile(src, outPath);
    return;
  }
  // procedural
  const color = parseHexColor(textureDef.color) || presetToColor(textureDef.preset);
  const alpha = (textureDef.preset === "glass") ? 160 : 255;
  await writeSolidPng(outPath, color, 16, alpha);
}

function ident(modId, id) {
  return `${modId}:${id}`;
}

function ensureArrayUniqueIds(arr, label) {
  const seen = new Set();
  for (const e of arr) {
    if (seen.has(e.id)) throw new Error(`${label} id duplicate: ${e.id}`);
    seen.add(e.id);
  }
}

function emitLang(project) {
  const modId = project.meta.modId;

  // Prefer explicit lang maps if provided; also ensure keys for blocks/items
  const en = { ...(project.lang?.en_us || {}) };
  const de = { ...(project.lang?.de_de || {}) };

  // Default item group key
  const groupKey = `itemGroup.${modId}`;
  en[groupKey] = en[groupKey] || project.meta.name;
  de[groupKey] = de[groupKey] || project.meta.name;

  for (const b of project.blocks) {
    en[`block.${modId}.${b.id}`] = en[`block.${modId}.${b.id}`] || b.displayName.en_us;
    de[`block.${modId}.${b.id}`] = de[`block.${modId}.${b.id}`] || b.displayName.de_de;
  }
  for (const it of project.items) {
    en[`item.${modId}.${it.id}`] = en[`item.${modId}.${it.id}`] || it.displayName.en_us;
    de[`item.${modId}.${it.id}`] = de[`item.${modId}.${it.id}`] || it.displayName.de_de;
  }

  return { en, de };
}

function emitBlockAssets(modId, blockId) {
  return {
    blockstate: {
      "variants": { "": { "model": `${modId}:block/${blockId}` } }
    },
    blockModel: {
      "parent": "block/cube_all",
      "textures": { "all": `${modId}:block/${blockId}` }
    },
    blockItemModel: {
      "parent": `${modId}:block/${blockId}`
    },
    lootTable: {
      "type": "minecraft:block",
      "pools": [{
        "rolls": 1,
        "entries": [{ "type": "minecraft:item", "name": `${modId}:${blockId}` }],
        "conditions": [{ "condition": "minecraft:survives_explosion" }]
      }]
    }
  };
}

function emitItemAssets(modId, itemId) {
  return {
    itemModel: {
      "parent": "item/generated",
      "textures": { "layer0": `${modId}:item/${itemId}` }
    }
  };
}

function emitRecipe(modId, recipe) {
  if (recipe.type === "shapeless") {
    return {
      "type": "minecraft:crafting_shapeless",
      "ingredients": recipe.ingredients.map(i => ({ "item": i.item })),
      "result": { "item": recipe.result.item, "count": recipe.result.count }
    };
  }
  // shaped
  const key = {};
  for (const [ch, ing] of Object.entries(recipe.key)) {
    key[ch] = { "item": ing.item };
  }
  return {
    "type": "minecraft:crafting_shaped",
    "pattern": recipe.pattern,
    "key": key,
    "result": { "item": recipe.result.item, "count": recipe.result.count }
  };
}

function javaHeader() {
  return "/* Generated by KidModStudio Exporter. Do not edit by hand. */\n";
}

function emitJavaModInit(pkg) {
  return javaHeader() + `
package ${pkg};

import ${pkg}.registry.ModBlocks;
import ${pkg}.registry.ModItems;
import ${pkg}.registry.ModItemGroups;
import net.fabricmc.api.ModInitializer;

public class KidModStudioMod implements ModInitializer {
    public static final String MOD_ID = "${" + "{MOD_ID}" + `}";

    @Override
    public void onInitialize() {
        ModItems.register();
        ModBlocks.register();
        ModItemGroups.register();
    }
}
`.trim() + "\n";
}

function emitJavaItems(pkg, project) {
  const modId = project.meta.modId;

  // generate constants
  const lines = [];
  for (const it of project.items) {
    const constName = it.id.toUpperCase();
    lines.push(`    public static final Item ${constName} = registerItem("${it.id}", new Item(new Item.Settings()));`);
  }
  if (lines.length === 0) {
    lines.push(`    // No custom items in this project yet.`);
  }

  return javaHeader() + `
package ${pkg}.registry;

import ${pkg}.KidModStudioMod;
import net.minecraft.item.Item;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.util.Identifier;

public class ModItems {
${lines.join("\n")}

    private static Item registerItem(String id, Item item) {
        return Registry.register(Registries.ITEM, new Identifier(KidModStudioMod.MOD_ID, id), item);
    }

    public static void register() {
        // no-op
    }
}
`.trim() + "\n";
}

function emitJavaBlocks(pkg, project) {
  const modId = project.meta.modId;

  const lines = [];
  for (const b of project.blocks) {
    const constName = b.id.toUpperCase();
    const hardness = (typeof b.props?.hardness === "number") ? b.props.hardness : 1.0;
    // luminance and transparency are MVP fields; we keep Java simple and only set strength for now.
    lines.push(`    public static final Block ${constName} = registerBlock("${b.id}", new Block(FabricBlockSettings.create().strength(${hardness}f)));`);
  }
  if (lines.length === 0) {
    lines.push(`    // No custom blocks in this project yet.`);
  }

  return javaHeader() + `
package ${pkg}.registry;

import ${pkg}.KidModStudioMod;
import net.fabricmc.fabric.api.object.builder.v1.block.FabricBlockSettings;
import net.minecraft.block.Block;
import net.minecraft.item.BlockItem;
import net.minecraft.item.Item;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.util.Identifier;

public class ModBlocks {
${lines.join("\n")}

    private static Block registerBlock(String id, Block block) {
        Identifier identifier = new Identifier(KidModStudioMod.MOD_ID, id);
        Registry.register(Registries.ITEM, identifier, new BlockItem(block, new Item.Settings()));
        return Registry.register(Registries.BLOCK, identifier, block);
    }

    public static void register() {
        // no-op
    }
}
`.trim() + "\n";
}

function emitJavaItemGroups(pkg, project) {
  const modId = project.meta.modId;

  // Pick an icon: first item if exists, else first block item, else vanilla stone.
  let iconExpr = "new ItemStack(net.minecraft.item.Items.STONE)";
  const entries = [];

  if (project.items.length > 0) {
    iconExpr = `new ItemStack(ModItems.${project.items[0].id.toUpperCase()})`;
  } else if (project.blocks.length > 0) {
    iconExpr = `new ItemStack(ModBlocks.${project.blocks[0].id.toUpperCase()})`;
  }

  for (const it of project.items) entries.push(`                entries.add(ModItems.${it.id.toUpperCase()});`);
  for (const b of project.blocks) entries.push(`                entries.add(ModBlocks.${b.id.toUpperCase()});`);
  if (entries.length === 0) entries.push(`                // No entries yet.`);

  return javaHeader() + `
package ${pkg}.registry;

import ${pkg}.KidModStudioMod;
import net.fabricmc.fabric.api.itemgroup.v1.FabricItemGroup;
import net.minecraft.item.ItemGroup;
import net.minecraft.item.ItemStack;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.registry.RegistryKey;
import net.minecraft.registry.RegistryKeys;
import net.minecraft.text.Text;
import net.minecraft.util.Identifier;

public class ModItemGroups {
    public static final RegistryKey<ItemGroup> MAIN_GROUP_KEY = RegistryKey.of(
            RegistryKeys.ITEM_GROUP,
            new Identifier(KidModStudioMod.MOD_ID, "main")
    );

    public static final ItemGroup MAIN_GROUP = FabricItemGroup.builder()
            .icon(() -> ${iconExpr})
            .displayName(Text.translatable("itemGroup." + KidModStudioMod.MOD_ID))
            .entries((ctx, entries) -> {
${entries.join("\n")}
            })
            .build();

    public static void register() {
        Registry.register(Registries.ITEM_GROUP, MAIN_GROUP_KEY, MAIN_GROUP);
    }
}
`.trim() + "\n";
}

async function writeJson(filePath, obj) {
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(obj, null, 2), "utf8");
}

async function main() {
  const args = minimist(process.argv.slice(2));
  const projectPath = args.project;
  const templateDir = args.template;
  const outDir = args.out;

  if (!projectPath) die("Missing --project");
  if (!templateDir) die("Missing --template");
  if (!outDir) die("Missing --out");

  const schemaPath = args.schema || path.resolve(__dirname, "..", "project.schema.json");
  if (!await fs.pathExists(schemaPath)) die("Schema not found: " + schemaPath);

  const project = JSON.parse(await fs.readFile(projectPath, "utf8"));
  const schema = JSON.parse(await fs.readFile(schemaPath, "utf8"));

  // Validate
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  const ok = validate(project);
  if (!ok) {
    console.error(validate.errors);
    die("Project JSON failed schema validation.");
  }

  ensureArrayUniqueIds(project.blocks, "blocks");
  ensureArrayUniqueIds(project.items, "items");
  ensureArrayUniqueIds(project.recipes, "recipes");

  // Copy template
  await fs.remove(outDir);
  await fs.ensureDir(outDir);
  await fs.copy(templateDir, outDir);

  const vars = {
    MOD_ID: project.meta.modId,
    MOD_NAME: project.meta.name,
    MAVEN_GROUP: project.meta.mavenGroup,
    PACKAGE: project.meta.packageName,
    PACKAGE_PATH: toPackagePath(project.meta.packageName),
    ARCHIVES_BASE_NAME: project.meta.archivesBaseName,
    MOD_VERSION: project.meta.version,
    MC_VERSION: project.meta.mcVersion,
    JAVA_VERSION: project.meta.javaVersion
  };

  // Replace placeholders in a known set of files if they exist.
  const replaceFiles = [
    "settings.gradle",
    "gradle.properties",
    "build.gradle",
    "src/main/resources/fabric.mod.json"
  ];

  for (const rel of replaceFiles) {
    assertSafeRel(rel);
    const p = path.join(outDir, rel);
    if (await fs.pathExists(p)) {
      const t = await fs.readFile(p, "utf8");
      await fs.writeFile(p, replaceAll(t, vars), "utf8");
    }
  }

  // Generate Java files (overwrite)
  const pkg = project.meta.packageName;
  const pkgPath = toPackagePath(pkg);
  const javaBase = path.join(outDir, "src/main/java", pkgPath);
  await fs.ensureDir(path.join(javaBase, "registry"));

  // Mod init
  const modInitPath = path.join(javaBase, "KidModStudioMod.java");
  await fs.writeFile(modInitPath, replaceAll(emitJavaModInit(pkg), { MOD_ID: project.meta.modId }), "utf8");

  // Registries
  await fs.writeFile(path.join(javaBase, "registry/ModItems.java"), emitJavaItems(pkg, project), "utf8");
  await fs.writeFile(path.join(javaBase, "registry/ModBlocks.java"), emitJavaBlocks(pkg, project), "utf8");
  await fs.writeFile(path.join(javaBase, "registry/ModItemGroups.java"), emitJavaItemGroups(pkg, project), "utf8");

  // Resources paths
  const modId = project.meta.modId;
  const assetsBase = path.join(outDir, "src/main/resources/assets", modId);
  const dataBase = path.join(outDir, "src/main/resources/data", modId);

  // Lang
  const { en, de } = emitLang(project);
  await writeJson(path.join(assetsBase, "lang/en_us.json"), en);
  await writeJson(path.join(assetsBase, "lang/de_de.json"), de);

  // Icon placeholder (32x32 solid)
  await writeSolidPng(path.join(assetsBase, "icon.png"), presetToColor("solid"), 32, 255);

  // Blocks
  for (const b of project.blocks) {
    const a = emitBlockAssets(modId, b.id);
    await writeJson(path.join(assetsBase, `blockstates/${b.id}.json`), a.blockstate);
    await writeJson(path.join(assetsBase, `models/block/${b.id}.json`), a.blockModel);
    await writeJson(path.join(assetsBase, `models/item/${b.id}.json`), a.blockItemModel);
    await writeJson(path.join(dataBase, `loot_tables/blocks/${b.id}.json`), a.lootTable);

    const texPath = path.join(assetsBase, `textures/block/${b.id}.png`);
    await writeTexture(texPath, b.texture);
  }

  // Items
  for (const it of project.items) {
    const a = emitItemAssets(modId, it.id);
    await writeJson(path.join(assetsBase, `models/item/${it.id}.json`), a.itemModel);

    const texPath = path.join(assetsBase, `textures/item/${it.id}.png`);
    await writeTexture(texPath, it.texture);
  }

  // Recipes
  for (const r of project.recipes) {
    const out = emitRecipe(modId, r);
    await writeJson(path.join(dataBase, `recipes/${r.id}.json`), out);
  }

  // Helpful output
  console.log("[exporter] OK");
  console.log("[exporter] Wrote:", outDir);
  console.log("[exporter] Next:");
  console.log("  cd " + outDir);
  console.log("  ./gradlew build");
}

main().catch((e) => die(e && e.stack ? e.stack : String(e)));
