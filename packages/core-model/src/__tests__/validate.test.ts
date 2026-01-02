import { describe, expect, it } from "vitest";
import { validateProject } from "../validate";

describe("validateProject", () => {
    it("flags missing recipe key char used in pattern", () => {
        const res = validateProject({
            schemaVersion: 1,
            meta: { modId: "kid_ruby_mod", name: "Ruby Mod", version: "0.1.0" },
            blocks: {},
            items: {
                ruby_gem: {
                    id: "ruby_gem",
                    name: "Ruby",
                    itemType: "gem",
                    properties: { maxStackSize: 64, attackDamage: 0 },
                    texture: { source: "preset", value: "gem" },
                },
            },
            recipes: {
                r1: {
                    id: "r1",
                    type: "shaped",
                    pattern: ["R  "],
                    key: {},
                    result: { item: "kid_ruby_mod:ruby_gem", count: 1 },
                },
            },
        });
        expect(res.ok).toBe(false);
        if (!res.ok) {
            expect(res.errors[0].message).toContain("Pattern uses a char that is missing in key");
        }
    });

    it("accepts valid project with references", () => {
        const res = validateProject({
            schemaVersion: 1,
            meta: { modId: "kid_mod", name: "Mod", version: "1.0.0" },
            blocks: {
                test_block: {
                    id: "test_block",
                    name: "Test",
                    properties: { hardness: 1, luminance: 0, transparent: false },
                    texture: { source: "preset", value: "rock" }
                }
            },
            items: {},
            recipes: {
                r1: {
                    id: "r1",
                    type: "shaped",
                    pattern: ["T  "],
                    key: { "T": "kid_mod:test_block" },
                    result: { item: "minecraft:stick", count: 1 }
                }
            }
        });
        expect(res.ok).toBe(true);
    });

    it("rejects foreign modId reference", () => {
        const res = validateProject({
            schemaVersion: 1,
            meta: { modId: "my_mod", name: "Mod", version: "1.0.0" },
            blocks: {},
            items: {},
            recipes: {
                r1: {
                    id: "r1",
                    type: "shaped",
                    pattern: ["X  "],
                    key: { "X": "other_mod:item" },
                    result: { item: "minecraft:stick", count: 1 }
                }
            }
        });
        expect(res.ok).toBe(false);
        if (!res.ok) {
            expect(res.errors[0].message).toContain("Only minecraft:* or <modId>:* references allowed");
        }
    });
});
