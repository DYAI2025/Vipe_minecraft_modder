import { ipcMain } from 'electron';
import fs from 'fs';
import { safeJoin, assertWorkspace } from '../workspace.js';
import { validateProject } from '../../../../../packages/core-model/src/validate.js';
import { ProjectFile } from '../../../../../packages/core-model/src/schema.js';

export function registerProjectHandlers() {
    /**
     * project:save
     * Persists the project JSON to the workspace directory.
     * Enforces sandboxing and validation.
     */
    ipcMain.handle('project:save', async (_event, { workspaceDir, project }: { workspaceDir: string, project: ProjectFile }) => {
        try {
            assertWorkspace(workspaceDir);

            // 1. Validate the project data before saving
            const validation = validateProject(project);
            if (!validation.ok) {
                return {
                    ok: false,
                    error: {
                        code: 'E_VALIDATION',
                        message: 'In deinem Mod stimmt etwas noch nicht. Bitte repariere es und versuch es nochmal.',
                        details: validation.errors
                    }
                };
            }

            const filePath = safeJoin(workspaceDir, 'project.json');
            const data = JSON.stringify(validation.project, null, 2);

            // 2. Atomic-ish write using a temporary file
            const tempPath = filePath + '.tmp';
            fs.writeFileSync(tempPath, data, 'utf8');
            fs.renameSync(tempPath, filePath);

            return { ok: true, data: { path: filePath } };
        } catch (err: any) {
            console.error('project:save failed:', err);
            return {
                ok: false,
                error: {
                    code: err.message.startsWith('E_') ? err.message.split(':')[0] : 'E_IO',
                    message: 'Ich kann gerade keine Dateien speichern. Bitte prüfe deine Berechtigungen.',
                    details: err.message
                }
            };
        }
    });

    /**
     * project:load
     * Reads the project JSON from the workspace directory.
     */
    ipcMain.handle('project:load', async (_event, { workspaceDir }: { workspaceDir: string }) => {
        try {
            assertWorkspace(workspaceDir);
            const filePath = safeJoin(workspaceDir, 'project.json');

            if (!fs.existsSync(filePath)) {
                return {
                    ok: false,
                    error: {
                        code: 'E_NOT_FOUND',
                        message: 'Keine Projektdatei gefunden.',
                        details: `File not found: ${filePath}`
                    }
                };
            }

            const content = fs.readFileSync(filePath, 'utf8');
            const project = JSON.parse(content);

            // Validate loaded project
            const validation = validateProject(project);
            if (!validation.ok) {
                return {
                    ok: false,
                    error: {
                        code: 'E_VALIDATION',
                        message: 'Die Projektdatei scheint beschädigt zu sein.',
                        details: validation.errors
                    }
                };
            }

            return { ok: true, data: validation.project };
        } catch (err: any) {
            console.error('project:load failed:', err);
            return {
                ok: false,
                error: {
                    code: err.message.startsWith('E_') ? err.message.split(':')[0] : 'E_IO',
                    message: 'Ich konnte das Projekt nicht laden.',
                    details: err.message
                }
            };
        }
    });
}
