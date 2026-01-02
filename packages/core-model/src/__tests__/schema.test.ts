import { describe, expect, it } from "vitest";
import { ProjectFileSchema } from "../schema";

describe("ProjectFileSchema", () => {
    it("accepts a minimal valid project", () => {
        const ok = ProjectFileSchema.safeParse({
            schemaVersion: 1,
            meta: { modId: "kid_ruby_mod", name: "Ruby Mod", version: "0.1.0" },
            blocks: {},
            items: {},
            recipes: {},
        });
        expect(ok.success).toBe(true);
    });

    it("rejects invalid modId", () => {
        const bad = ProjectFileSchema.safeParse({
            schemaVersion: 1,
            meta: { modId: "Kid_Ruby_Mod", name: "Ruby Mod", version: "0.1.0" },
            blocks: {},
            items: {},
            recipes: {},
        });
        expect(bad.success).toBe(false);
    });

    it("rejects invalid EntityId", () => {
        const bad = ProjectFileSchema.safeParse({
            schemaVersion: 1,
            meta: { modId: "ruby_mod", name: "Ruby Mod", version: "0.1.0" },
            blocks: {
                "Invalid ID": {
                    id: "Invalid ID",
                    name: "Oops",
                    properties: { hardness: 1, luminance: 0, transparent: false },
                    texture: { source: "preset", value: "rock" }
                }
            },
            items: {},
            recipes: {},
        });
        expect(bad.success).toBe(false);
    });
});
