import { app } from "electron";
import { readFile, writeFile, rename, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join, dirname } from "path";
import log from "electron-log";
import {
  type SettingsConfig,
  DEFAULT_SETTINGS,
  isValidSettings,
  validateSettingsWithErrors,
} from "@kidmodstudio/ipc-contracts";

export class SettingsStore {
  private settings: SettingsConfig = DEFAULT_SETTINGS;
  private filePath: string;
  private loaded = false;

  constructor() {
    this.filePath = join(app.getPath("userData"), "settings.json");
  }

  async load(): Promise<SettingsConfig> {
    if (this.loaded) {
      return this.settings;
    }

    try {
      if (!existsSync(this.filePath)) {
        log.info("No settings file found, creating with defaults");
        await this.save(DEFAULT_SETTINGS);
        this.loaded = true;
        return this.settings;
      }

      const content = await readFile(this.filePath, "utf-8");
      const parsed = JSON.parse(content);
      const migrated = this.migrate(parsed);

      if (!isValidSettings(migrated)) {
        const { errors } = validateSettingsWithErrors(migrated);
        log.warn("Settings validation failed:", errors);
        await this.backupInvalidSettings();
        this.settings = DEFAULT_SETTINGS;
        await this.save(this.settings);
      } else {
        this.settings = migrated;
      }

      this.loaded = true;
      return this.settings;
    } catch (error) {
      log.error("Failed to load settings:", error);
      await this.backupInvalidSettings();
      this.settings = DEFAULT_SETTINGS;
      await this.save(this.settings);
      this.loaded = true;
      return this.settings;
    }
  }

  async save(settings: SettingsConfig): Promise<void> {
    if (!isValidSettings(settings)) {
      const { errors } = validateSettingsWithErrors(settings);
      throw new Error(`Invalid settings: ${errors.join(", ")}`);
    }

    // Ensure directory exists
    await mkdir(dirname(this.filePath), { recursive: true });

    // Atomic write: write to temp file, then rename
    const tempPath = `${this.filePath}.tmp`;
    await writeFile(tempPath, JSON.stringify(settings, null, 2), "utf-8");
    await rename(tempPath, this.filePath);

    this.settings = settings;
    log.info("Settings saved successfully");
  }

  async update(patch: Partial<SettingsConfig>): Promise<SettingsConfig> {
    await this.load(); // Ensure loaded

    const updated = this.deepMerge(this.settings, patch);

    if (!isValidSettings(updated)) {
      const { errors } = validateSettingsWithErrors(updated);
      throw new Error(`Invalid settings update: ${errors.join(", ")}`);
    }

    await this.save(updated);
    return this.settings;
  }

  get(): SettingsConfig {
    return this.settings;
  }

  private migrate(old: unknown): SettingsConfig {
    if (typeof old !== "object" || old === null) {
      log.warn("Settings is not an object, using defaults");
      return DEFAULT_SETTINGS;
    }

    const obj = old as Record<string, unknown>;

    // No schemaVersion or version 0 → migrate to v1
    if (!("schemaVersion" in obj) || obj.schemaVersion === 0) {
      log.info("Migrating settings from v0 to v1");
      return this.deepMerge(DEFAULT_SETTINGS, obj) as SettingsConfig;
    }

    // Unknown future version → reject
    if (typeof obj.schemaVersion === "number" && obj.schemaVersion > 1) {
      log.warn(`Unknown schema version ${obj.schemaVersion}, using defaults`);
      return DEFAULT_SETTINGS;
    }

    return obj as unknown as SettingsConfig;
  }

  private async backupInvalidSettings(): Promise<void> {
    if (!existsSync(this.filePath)) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = this.filePath.replace(".json", `.invalid.${timestamp}.json`);

    try {
      await rename(this.filePath, backupPath);
      log.info(`Invalid settings backed up to ${backupPath}`);
    } catch (error) {
      log.error("Failed to backup invalid settings:", error);
    }
  }

  private deepMerge(target: any, source: any): any {
    if (typeof source !== "object" || source === null) {
      return source;
    }

    const result = { ...target };

    for (const key of Object.keys(source)) {
      if (typeof source[key] === "object" && source[key] !== null && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] ?? {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }
}

export const settingsStore = new SettingsStore();
