import { ProjectFileSchema, type ProjectFile, type NamespacedRef } from "./schema";

export type ValidationError = {
    code: "E_VALIDATION";
    path: string; // json-pointer-ish, e.g. "/recipes/r1/key/R"
    message: string;
    details?: string;
};

export type ValidateOk = { ok: true; project: ProjectFile };
export type ValidateFail = { ok: false; errors: ValidationError[] };

type Options = {
    // recommended v1: keep default false to avoid blocking existing projects
    disallowBlockItemIdCollision?: boolean;
};

function ptr(path: Array<string | number>): string {
    return "/" + path.map(String).join("/");
}

function err(path: Array<string | number>, message: string, details?: string): ValidationError {
    return { code: "E_VALIDATION", path: ptr(path), message, details };
}

function splitNs(ref: NamespacedRef): { ns: string; id: string } {
    const [ns, ...rest] = ref.split(":");
    return { ns, id: rest.join(":") };
}

export function validateProject(input: unknown, options: Options = {}): ValidateOk | ValidateFail {
    const parsed = ProjectFileSchema.safeParse(input);
    if (!parsed.success) {
        const errors = parsed.error.issues.map((i) =>
            err(i.path, i.message, i.code)
        );
        return { ok: false, errors };
    }

    const project = parsed.data;
    const errors: ValidationError[] = [];
    const modId = project.meta.modId;

    // 1) record key must equal value.id
    for (const [k, v] of Object.entries(project.blocks)) {
        if (k !== v.id) errors.push(err(["blocks", k, "id"], "Block key must equal block.id"));
    }
    for (const [k, v] of Object.entries(project.items)) {
        if (k !== v.id) errors.push(err(["items", k, "id"], "Item key must equal item.id"));
    }
    for (const [k, v] of Object.entries(project.recipes)) {
        if (k !== v.id) errors.push(err(["recipes", k, "id"], "Recipe key must equal recipe.id"));
    }

    // 2) texture rules
    const presetAllowlist = new Set(["rock", "wood", "gem", "metal", "grass", "sand"]);
    const checkTexture = (pathBase: Array<string | number>, tex: any) => {
        if (tex?.source === "preset") {
            if (!presetAllowlist.has(tex.value)) {
                errors.push(err([...pathBase, "value"], "Unknown texture preset", `Allowed: ${[...presetAllowlist].join(", ")}`));
            }
            return;
        }
        if (tex?.source === "dataUri") {
            if (typeof tex.value !== "string" || !tex.value.startsWith("data:image/png;base64,")) {
                errors.push(err([...pathBase, "value"], "dataUri must start with data:image/png;base64,"));
            }
            return;
        }
        errors.push(err(pathBase, "Invalid texture spec"));
    };

    for (const [id, b] of Object.entries(project.blocks)) {
        checkTexture(["blocks", id, "texture"], b.texture);
    }
    for (const [id, it] of Object.entries(project.items)) {
        checkTexture(["items", id, "texture"], it.texture);
    }

    // 3) recipe semantics
    const hasOwn = (entityId: string) => Boolean(project.blocks[entityId] || project.items[entityId]);

    const checkRef = (pathBase: Array<string | number>, ref: NamespacedRef) => {
        const { ns, id } = splitNs(ref);
        if (ns === "minecraft") return;
        if (ns !== modId) {
            errors.push(err(pathBase, "Only minecraft:* or <modId>:* references allowed", `Expected namespace: ${modId}`));
            return;
        }
        if (!hasOwn(id)) {
            errors.push(err(pathBase, "Reference points to missing block/item", ref));
        }
    };

    const allowedPatternChar = /^[A-Z0-9 ]$/;
    for (const [rid, r] of Object.entries(project.recipes)) {
        // chars allowed + every non-space char must be in key
        for (let rowIdx = 0; rowIdx < r.pattern.length; rowIdx++) {
            const row = r.pattern[rowIdx] ?? "";
            for (let col = 0; col < row.length; col++) {
                const ch = row[col]!;
                if (!allowedPatternChar.test(ch)) {
                    errors.push(err(["recipes", rid, "pattern", rowIdx], "Pattern may only contain A-Z, 0-9 or space", `Found: ${JSON.stringify(ch)}`));
                    continue;
                }
                if (ch !== " " && !r.key[ch]) {
                    errors.push(err(["recipes", rid, "key", ch], "Pattern uses a char that is missing in key"));
                }
            }
        }

        // key refs
        for (const [k, ref] of Object.entries(r.key)) {
            checkRef(["recipes", rid, "key", k], ref as NamespacedRef);
        }
        // result ref
        checkRef(["recipes", rid, "result", "item"], r.result.item);
    }

    // 4) optional: disallow collisions between blocks/items ids
    if (options.disallowBlockItemIdCollision) {
        for (const id of Object.keys(project.blocks)) {
            if (project.items[id]) {
                errors.push(err(["items", id, "id"], "Id collision: same id used in blocks and items"));
            }
        }
    }

    if (errors.length > 0) return { ok: false, errors };
    return { ok: true, project };
}
