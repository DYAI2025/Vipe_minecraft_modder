import path from 'path';
import fs from 'fs';

/**
 * Safely joins a base directory with sub-paths, preventing path traversal.
 * If any part of the path attempts to escape the baseDir, an error is thrown.
 */
export function safeJoin(baseDir: string, ...subPaths: string[]): string {
    const joined = path.join(baseDir, ...subPaths);
    const normalizedBase = path.normalize(baseDir) + path.sep;
    const normalizedJoined = path.normalize(joined);

    if (!normalizedJoined.startsWith(normalizedBase) && normalizedJoined !== normalizedBase.slice(0, -1)) {
        throw new Error('E_PATH_TRAVERSAL: Attempted to escape workspace boundary');
    }

    return normalizedJoined;
}

/**
 * Asserts that a directory exists and is a valid workspace.
 */
export function assertWorkspace(dir: string): void {
    if (!dir || !fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
        throw new Error('E_WORKSPACE_REQUIRED: Invalid or missing workspace directory');
    }
}
