import { ipcMain } from 'electron';
import path from 'path';
import { exportProject } from '../../../../../packages/exporter/src/index.js';
import { safeJoin, assertWorkspace } from '../workspace.js';
import { settingsStore } from '../settingsStore.js';
import { getDefaultTemplatePath, getExportDirectory } from '../workspaceManager.js';

export function registerExporterHandlers() {
    /**
     * exporter:run
     * Executes the Fabric mod export pipeline.
     */
    ipcMain.handle('exporter:run', async (_event, { workspaceDir, project }: { workspaceDir: string, project: any }) => {
        try {
            assertWorkspace(workspaceDir);

            // Get template path from settings or use default
            const settings = settingsStore.get();
            const templateDir = settings.workspace.templatePath || getDefaultTemplatePath();
            const outputDir = safeJoin(workspaceDir, 'export');

            console.log(`Exporter: Running for ${project.meta.modId} in ${outputDir}`);

            const result = await exportProject({
                project,
                templateDir,
                outputDir
            });

            return result;
        } catch (err: any) {
            console.error('Exporter failed:', err);
            return {
                ok: false,
                error: {
                    code: 'E_EXPORT_FAILED',
                    message: 'Der Mod konnte nicht gebaut werden. Vielleicht ist der Bauplan fehlerhaft?',
                    details: err.message
                }
            };
        }
    });
}
