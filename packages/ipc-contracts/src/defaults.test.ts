import { describe, it, expect } from "vitest";
import { DEFAULT_SETTINGS } from "./defaults.js";
import { isValidSettings } from "./schemas/compiled/index.js";
import type { SettingsConfig } from "./index.js";

describe("DEFAULT_SETTINGS", () => {
    it("should export DEFAULT_SETTINGS object", () => {
        expect(DEFAULT_SETTINGS).toBeDefined();
        expect(typeof DEFAULT_SETTINGS).toBe("object");
    });

    it("should have schemaVersion property", () => {
        expect(DEFAULT_SETTINGS.schemaVersion).toBeDefined();
        expect(typeof DEFAULT_SETTINGS.schemaVersion).toBe("number");
        expect(DEFAULT_SETTINGS.schemaVersion).toBeGreaterThanOrEqual(1);
    });

    it("should have stt configuration", () => {
        expect(DEFAULT_SETTINGS.stt).toBeDefined();
        expect(DEFAULT_SETTINGS.stt.provider).toBeDefined();
        expect(DEFAULT_SETTINGS.stt.language).toBeDefined();
        expect(DEFAULT_SETTINGS.stt.providerConfig).toBeDefined();
    });

    it("should have llm configuration", () => {
        expect(DEFAULT_SETTINGS.llm).toBeDefined();
        expect(DEFAULT_SETTINGS.llm.providerConfig).toBeDefined();
        expect(DEFAULT_SETTINGS.llm.providerConfig.provider).toBeDefined();
        expect(DEFAULT_SETTINGS.llm.defaultMode).toBeDefined();
    });

    it("should have tts configuration", () => {
        expect(DEFAULT_SETTINGS.tts).toBeDefined();
        expect(typeof DEFAULT_SETTINGS.tts.enabled).toBe("boolean");
        expect(DEFAULT_SETTINGS.tts.providerConfig).toBeDefined();
    });

    it("should have safety configuration", () => {
        expect(DEFAULT_SETTINGS.safety).toBeDefined();
        expect(typeof DEFAULT_SETTINGS.safety.allowPatchMode).toBe("boolean");
        expect(DEFAULT_SETTINGS.safety.requireHumanReviewForPatches).toBe(true);
    });

    it("should have ui configuration", () => {
        expect(DEFAULT_SETTINGS.ui).toBeDefined();
        expect(typeof DEFAULT_SETTINGS.ui.kidMode).toBe("boolean");
        expect(typeof DEFAULT_SETTINGS.ui.showDevDetails).toBe("boolean");
    });

    it("should pass schema validation", () => {
        const isValid = isValidSettings(DEFAULT_SETTINGS);
        expect(isValid).toBe(true);
    });

    it("should be assignable to SettingsConfig type", () => {
        // This is a compile-time check - if it compiles, the type is correct
        const settings: SettingsConfig = DEFAULT_SETTINGS;
        expect(settings).toBe(DEFAULT_SETTINGS);
    });

    it("should have valid sampleRateHz (16000 or 48000)", () => {
        expect([16000, 48000]).toContain(DEFAULT_SETTINGS.stt.sampleRateHz);
    });

    it("should have valid temperature range (0-2)", () => {
        const temp = DEFAULT_SETTINGS.llm.providerConfig.temperature;
        expect(temp).toBeGreaterThanOrEqual(0);
        expect(temp).toBeLessThanOrEqual(2);
    });
});
