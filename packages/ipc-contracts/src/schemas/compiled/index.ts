// AUTO-GENERATED - DO NOT EDIT
import Ajv, { type ErrorObject } from "ajv";
import addFormats from "ajv-formats";
import type { SettingsConfig } from "../../index.js";

// Schema will be imported at build time
import settingsSchema from "../settings.schema.json" with { type: "json" };

const ajv = new Ajv.default({ allErrors: true });
addFormats.default(ajv);

const validateSettings = ajv.compile<SettingsConfig>(settingsSchema);

export function isValidSettings(data: unknown): data is SettingsConfig {
  return validateSettings(data) === true;
}

export function validateSettingsWithErrors(data: unknown): { valid: boolean; errors: string[] } {
  const valid = validateSettings(data);
  if (valid) {
    return { valid: true, errors: [] };
  }
  const errors = validateSettings.errors?.map((e: ErrorObject) => `${e.instancePath} ${e.message}`) ?? [];
  return { valid: false, errors };
}

export { validateSettings };
