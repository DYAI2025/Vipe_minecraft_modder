import { ipcMain } from 'electron';
import path from 'path';
import { exportProject } from '../../../../../packages/exporter/src/index.js';
import { safeJoin, assertWorkspace } from '../workspace.js';

export function registerExporterHandlers() {
    /**
     * exporter:run
     * Executes the Fabric mod export pipeline.
     */
    ipcMain.handle('exporter:run', async (_event, { workspaceDir, project }: { workspaceDir: string, project: any }) => {
        try {
            assertWorkspace(workspaceDir);

            // For now, template is relative to the app or in a fixed location
            // In a real app, this might be bundled or downloaded.
            const templateDir = path.join(process.cwd(), 'kidmodstudio_exporter_kit/template');
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
