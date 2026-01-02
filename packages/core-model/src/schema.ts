import { z } from "zod";

// ---------------------------
// Primitive contracts
// ---------------------------
export const EntityIdSchema = z.string().regex(/^[a-z0-9_]+$/, "EntityId must match ^[a-z0-9_]+$");
export type EntityId = z.infer<typeof EntityIdSchema>;

export const ModIdSchema = z
    .string()
    .regex(/^[a-z][a-z0-9_]{1,63}$/, "ModId must match ^[a-z][a-z0-9_]{1,63}$");
export type ModId = z.infer<typeof ModIdSchema>;

export const NamespacedRefSchema = z
    .string()
    .regex(/^[a-z0-9_]+:[a-z0-9_/]+$/, "NamespacedRef must match ^[a-z0-9_]+:[a-z0-9_/]+$");
export type NamespacedRef = z.infer<typeof NamespacedRefSchema>;

// ---------------------------
// Domain specs
// ---------------------------
export const TextureSpecSchema = z.union([
    z.object({
        source: z.literal("preset"),
        value: z.string().min(1),
    }),
    z.object({
        source: z.literal("dataUri"),
        value: z.string().min(1),
    }),
]);
export type TextureSpec = z.infer<typeof TextureSpecSchema>;

export const BlockSpecSchema = z.object({
    id: EntityIdSchema,
    name: z.string().min(1).max(50),
    properties: z.object({
        hardness: z.number(), // semantic clamps in validate.ts if desired
        luminance: z.number().int().min(0).max(15),
        transparent: z.boolean(),
    }),
    texture: TextureSpecSchema,
});
export type BlockSpec = z.infer<typeof BlockSpecSchema>;

export const ItemSpecSchema = z.object({
    id: EntityIdSchema,
    name: z.string().min(1).max(50),
    itemType: z.enum(["gem", "sword", "tool", "food"]),
    properties: z.object({
        maxStackSize: z.number().int().min(1).max(64),
        attackDamage: z.number(),
    }),
    texture: TextureSpecSchema,
});
export type ItemSpec = z.infer<typeof ItemSpecSchema>;

const RecipeKeyCharSchema = z.string().regex(/^[A-Z0-9]$/, "Recipe key must be a single A-Z or 0-9 char");

export const RecipeSpecSchema = z.object({
    id: EntityIdSchema,
    type: z.literal("shaped"),
    pattern: z.array(z.string().min(1).max(3)).min(1).max(3),
    key: z.record(RecipeKeyCharSchema, NamespacedRefSchema),
    result: z.object({
        item: NamespacedRefSchema,
        count: z.number().int().min(1).max(64),
    }),
});
export type RecipeSpec = z.infer<typeof RecipeSpecSchema>;

export const ProjectMetaSchema = z.object({
    modId: ModIdSchema,
    name: z.string().min(1).max(50),
    version: z.string().min(1).max(20),
    author: z.string().max(50).optional(),
    description: z.string().max(300).optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});
export type ProjectMeta = z.infer<typeof ProjectMetaSchema>;

export const ProjectFileSchema = z.object({
    schemaVersion: z.literal(1),
    meta: ProjectMetaSchema,
    blocks: z.record(EntityIdSchema, BlockSpecSchema).default({}),
    items: z.record(EntityIdSchema, ItemSpecSchema).default({}),
    recipes: z.record(EntityIdSchema, RecipeSpecSchema).default({}),
});
export type ProjectFile = z.infer<typeof ProjectFileSchema>;
