import type { BlockSpec, EntityId, ItemSpec, ProjectFile, RecipeSpec } from "./schema";

export type KidAction =
    | { type: "LOAD_PROJECT"; project: ProjectFile }
    | { type: "UNDO" }
    | { type: "REDO" }
    | { type: "CREATE_BLOCK"; block: BlockSpec }
    | { type: "UPDATE_BLOCK"; id: EntityId; patch: Partial<Omit<BlockSpec, "id">> }
    | { type: "DELETE_BLOCK"; id: EntityId }
    | { type: "CREATE_ITEM"; item: ItemSpec }
    | { type: "UPDATE_ITEM"; id: EntityId; patch: Partial<Omit<ItemSpec, "id">> }
    | { type: "DELETE_ITEM"; id: EntityId }
    | { type: "CREATE_RECIPE"; recipe: RecipeSpec }
    | { type: "UPDATE_RECIPE"; id: EntityId; patch: Partial<Omit<RecipeSpec, "id">> }
    | { type: "DELETE_RECIPE"; id: EntityId };

export function isDomainChange(a: KidAction): boolean {
    switch (a.type) {
        case "UNDO":
        case "REDO":
            return false;
        default:
            return true;
    }
}
