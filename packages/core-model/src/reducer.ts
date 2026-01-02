import type { KidAction } from "./actions";
import type { ProjectFile } from "./schema";

export type HistoryState = { past: ProjectFile[]; future: ProjectFile[] };

export type AppState = {
    project: ProjectFile;
    history: HistoryState;
    lastAction: KidAction | null;
};

export function projectReducer(project: ProjectFile, action: KidAction): ProjectFile {
    switch (action.type) {
        case "LOAD_PROJECT":
            return action.project;

        case "CREATE_BLOCK": {
            const id = action.block.id;
            return { ...project, blocks: { ...project.blocks, [id]: action.block } };
        }
        case "UPDATE_BLOCK": {
            const current = project.blocks[action.id];
            if (!current) return project;
            return {
                ...project,
                blocks: { ...project.blocks, [action.id]: { ...current, ...action.patch, id: current.id } },
            };
        }
        case "DELETE_BLOCK": {
            if (!project.blocks[action.id]) return project;
            const { [action.id]: _, ...rest } = project.blocks;
            return { ...project, blocks: rest };
        }

        case "CREATE_ITEM": {
            const id = action.item.id;
            return { ...project, items: { ...project.items, [id]: action.item } };
        }
        case "UPDATE_ITEM": {
            const current = project.items[action.id];
            if (!current) return project;
            return {
                ...project,
                items: { ...project.items, [action.id]: { ...current, ...action.patch, id: current.id } },
            };
        }
        case "DELETE_ITEM": {
            if (!project.items[action.id]) return project;
            const { [action.id]: _, ...rest } = project.items;
            return { ...project, items: rest };
        }

        case "CREATE_RECIPE": {
            const id = action.recipe.id;
            return { ...project, recipes: { ...project.recipes, [id]: action.recipe } };
        }
        case "UPDATE_RECIPE": {
            const current = project.recipes[action.id];
            if (!current) return project;
            return {
                ...project,
                recipes: { ...project.recipes, [action.id]: { ...current, ...action.patch, id: current.id } },
            };
        }
        case "DELETE_RECIPE": {
            if (!project.recipes[action.id]) return project;
            const { [action.id]: _, ...rest } = project.recipes;
            return { ...project, recipes: rest };
        }

        case "UNDO":
        case "REDO":
            // handled in rootReducer
            return project;
    }
}

export function rootReducer(state: AppState, action: KidAction): AppState {
    switch (action.type) {
        case "UNDO": {
            const prev = state.history.past[state.history.past.length - 1];
            if (!prev) return { ...state, lastAction: action };
            const past = state.history.past.slice(0, -1);
            const future = [state.project, ...state.history.future];
            return { project: prev, history: { past, future }, lastAction: action };
        }
        case "REDO": {
            const next = state.history.future[0];
            if (!next) return { ...state, lastAction: action };
            const future = state.history.future.slice(1);
            const past = [...state.history.past, state.project];
            return { project: next, history: { past, future }, lastAction: action };
        }
        case "LOAD_PROJECT": {
            const project = projectReducer(state.project, action);
            return { project, history: { past: [], future: [] }, lastAction: action };
        }
        default: {
            const nextProject = projectReducer(state.project, action);
            if (nextProject === state.project) return { ...state, lastAction: action };
            return {
                project: nextProject,
                history: { past: [...state.history.past, state.project], future: [] },
                lastAction: action,
            };
        }
    }
}
