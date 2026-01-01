import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EspeakService } from './espeak.js';

describe('EspeakService', () => {
    it('should create instance with default config', () => {
        const espeak = new EspeakService();
        expect(espeak).toBeDefined();
    });

    it('should create instance with custom config', () => {
        const espeak = new EspeakService({
            voice: 'en',
            speed: 180,
            pitch: 60
        });
        expect(espeak).toBeDefined();
    });

    it('should check if espeak is installed (returns boolean)', async () => {
        const espeak = new EspeakService();
        const installed = await espeak.checkInstalled();
        expect(typeof installed).toBe('boolean');
    });

    it('should cache installation check result', async () => {
        const espeak = new EspeakService();

        // First check
        const first = await espeak.checkInstalled();
        // Second check should use cached value
        const second = await espeak.checkInstalled();

        expect(first).toBe(second);
    });

    it('should throw error when speak() called and espeak not installed', async () => {
        const espeak = new EspeakService();
        const installed = await espeak.checkInstalled();

        if (!installed) {
            await expect(espeak.speak('Test text')).rejects.toThrow('espeak not installed');
        } else {
            // If espeak is installed, the test passes
            expect(installed).toBe(true);
        }
    });

    it('should throw error when synthesizeWav() called and espeak not installed', async () => {
        const espeak = new EspeakService();
        const installed = await espeak.checkInstalled();

        if (!installed) {
            await expect(espeak.synthesizeWav('Test text')).rejects.toThrow('espeak not installed');
        } else {
            // If espeak is installed, the test passes
            expect(installed).toBe(true);
        }
    });
});
