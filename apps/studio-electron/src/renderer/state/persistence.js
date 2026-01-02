/**
 * Persistence Layer for KidModStudio Renderer
 * Interacts with IPC via window.kidmod.project
 */
export const Persistence = {
    /**
     * Saves the current project state to disk.
     */
    async saveProject(workspaceDir, projectData) {
        if (!window.kidmod) return { ok: false, error: 'IPC Not available' };

        console.log('Persistence: Saving project...', projectData);
        const result = await window.kidmod.project.save({
            workspaceDir,
            project: {
                schemaVersion: 1,
                ...projectData
            }
        });

        if (!result.ok) {
            console.error('Persistence: Save failed', result.error);
            // Handle error (show toast, etc.)
        }

        return result;
    },

    /**
     * Loads a project from disk.
     */
    async loadProject(workspaceDir) {
        if (!window.kidmod) return { ok: false, error: 'IPC Not available' };

        console.log('Persistence: Loading project from...', workspaceDir);
        const result = await window.kidmod.project.load({ workspaceDir });

        if (result.ok) {
            console.log('Persistence: Load success', result.data);
        } else {
            console.error('Persistence: Load failed', result.error);
        }

        return result;
    }
};
