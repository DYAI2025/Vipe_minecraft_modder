import { describe, it, expect } from "vitest";
import { DEFAULT_SETTINGS } from "./defaults.js";
import { isValidSettings, validateSettingsWithErrors } from "./schemas/compiled/index.js";
import type { SettingsConfig } from "./index.js";

describe("Settings Validation", () => {
  it("accepts valid default settings", () => {
    expect(isValidSettings(DEFAULT_SETTINGS)).toBe(true);
  });

  it("rejects missing schemaVersion", () => {
    const invalid = { ...DEFAULT_SETTINGS } as Partial<SettingsConfig>;
    delete (invalid as any).schemaVersion;
    expect(isValidSettings(invalid)).toBe(false);
  });

  it("rejects invalid provider id", () => {
    const invalid = {
      ...DEFAULT_SETTINGS,
      stt: { ...DEFAULT_SETTINGS.stt, provider: "invalid_provider" },
    };
    expect(isValidSettings(invalid)).toBe(false);
  });

  it("rejects invalid secretRef pattern", () => {
    const invalid = {
      ...DEFAULT_SETTINGS,
      stt: {
        ...DEFAULT_SETTINGS.stt,
        providerConfig: {
          ...DEFAULT_SETTINGS.stt.providerConfig,
          apiKeyRef: "not-a-secret-ref", // should be "secret:..."
        },
      },
    };
    expect(isValidSettings(invalid)).toBe(false);
  });

  it("enforces requireHumanReviewForPatches = true", () => {
    const invalid = {
      ...DEFAULT_SETTINGS,
      safety: {
        ...DEFAULT_SETTINGS.safety,
        requireHumanReviewForPatches: false,
      },
    };
    expect(isValidSettings(invalid)).toBe(false);
  });

  it("rejects invalid sampleRateHz", () => {
    const invalid = {
      ...DEFAULT_SETTINGS,
      stt: { ...DEFAULT_SETTINGS.stt, sampleRateHz: 44100 },
    };
    expect(isValidSettings(invalid)).toBe(false);
  });

  it("rejects temperature > 2.0", () => {
    const invalid = {
      ...DEFAULT_SETTINGS,
      llm: {
        ...DEFAULT_SETTINGS.llm,
        providerConfig: {
          ...DEFAULT_SETTINGS.llm.providerConfig,
          temperature: 2.5,
        },
      },
    };
    expect(isValidSettings(invalid)).toBe(false);
  });

  it("returns detailed errors for invalid settings", () => {
    const invalid = { schemaVersion: 1 }; // missing most fields
    const result = validateSettingsWithErrors(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
