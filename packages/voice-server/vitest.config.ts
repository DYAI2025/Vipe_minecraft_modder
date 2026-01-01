import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        include: ["src/**/*.test.ts"],
        // Skip integration tests in CI - they require external services
        exclude: ["src/integration.test.ts"],
    },
});
