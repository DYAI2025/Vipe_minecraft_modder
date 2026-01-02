# Project JSON Spec v1

## 1. Overview

The `project.json` file is the **Single Source of Truth** for a KidModStudio project. It defines the purely declarative state of the mod.

* **Version:** v1
* **Encoding:** UTF-8
* **Validation:** Strict Zod Schema (see `packages/core-model/src/schema.ts`)

## 2. Top-Level Structure

```json
{
  "schemaVersion": 1,
  "meta": {
    "modId": "my_mod",
    "name": "My First Mod",
    "version": "0.1.0"
  },
  "blocks": { ... },
  "items": { ... },
  "recipes": { ... }
}
```

## 3. Core Types

### 3.1 Entity IDs (Regex)

All `id` fields (for blocks, items, recipes) MUST match:
`^[a-z0-9_]+$`

* Allowed: `ruby_block`, `super_sword_2`
* Forbidden: `RubyBlock`, `ruby-block`, `ruby block`

### 3.2 Mod ID

The `meta.modId` MUST match:
`^[a-z][a-z0-9_]{1,63}$`

### 3.3 Textures (`TextureSpec`)

Textures define a visual representation. Ideally stored as DataURI to be self-contained.

```typescript
type TextureSpec =
  | { source: "preset"; value: string } // e.g. "rock", "wood"
  | { source: "dataUri"; value: string } // "data:image/png;base64,..."
```

**Recommendation:** The UI should convert presets to dataUris before saving to ensure WYSIWYG.

### 3.4 References (`NamespacedRef`)

Format: `<namespace>:<id>`
Regex: `^[a-z0-9_]+:[a-z0-9_/]+$`

* Allowed: `minecraft:dirt`, `my_mod:ruby_block`
* Forbidden: `dirt` (missing namespace)

## 4. Immutability Policy (Option A)

**IDs are Immutable.**
Once an Entity (Block/Item) is created, its `id` cannot be changed.
To "rename":

1. Copy the object to a new Key/ID.
2. Delete the old Key/ID.

This prevents broken references in Recipes or other dependent structures.
