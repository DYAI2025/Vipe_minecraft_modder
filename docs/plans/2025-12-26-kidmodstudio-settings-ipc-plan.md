# KidModStudio Settings & IPC System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a complete Settings System with IPC contracts for STT streaming and LLM completion in an Electron app.

**Architecture:** Monorepo with npm workspaces. Shared `ipc-contracts` package contains all TypeScript types and JSON schemas. Electron app in `apps/studio-electron` with Main/Preload/Renderer separation. Secrets stored via keytar in OS keychain.

**Tech Stack:** TypeScript, Electron 33+, Ajv, keytar, Vitest, npm workspaces

---

## Task 1: Initialize Monorepo Structure

**Files:**
- Create: `package.json` (root)
- Create: `tsconfig.base.json`
- Create: `.gitignore`

**Step 1: Create root package.json with workspaces**

```json
{
  "name": "kidmodstudio",
  "version": "0.1.0",
  "private": true,
  "workspaces": [
    "packages/*",
    "apps/*"
  ],
  "scripts": {
    "build": "npm run build --workspaces",
    "test": "npm run test --workspaces --if-present",
    "lint": "npm run lint --workspaces --if-present"
  },
  "devDependencies": {
    "typescript": "^5.3.0"
  }
}
```

**Step 2: Create tsconfig.base.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "resolveJsonModule": true
  }
}
```

**Step 3: Create .gitignore**

```
node_modules/
dist/
*.log
.DS_Store
settings.json
settings.invalid.*.json
```

**Step 4: Commit**

```bash
git init
git add package.json tsconfig.base.json .gitignore
git commit -m "chore: initialize monorepo structure with npm workspaces"
```

---

## Task 2: Create ipc-contracts Package - Types

**Files:**
- Create: `packages/ipc-contracts/package.json`
- Create: `packages/ipc-contracts/tsconfig.json`
- Create: `packages/ipc-contracts/src/index.ts`

**Step 1: Create packages/ipc-contracts/package.json**

```json
{
  "name": "@kidmodstudio/ipc-contracts",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "vitest": "^2.0.0"
  }
}
```

**Step 2: Create packages/ipc-contracts/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

**Step 3: Create packages/ipc-contracts/src/index.ts with all types**

```typescript
// ============================================================
// Locale & Secret Types
// ============================================================

export type LocaleTag = "de-DE" | "en-US";

export type SecretRef = `secret:${string}`;

// ============================================================
// STT Types
// ============================================================

export type SttProviderId = "livekit" | "webspeech" | "manual_text";

export interface SttCommonConfig {
  provider: SttProviderId;
  language: LocaleTag;
  sampleRateHz: 16000 | 48000;
  interimResults: boolean;
  maxUtteranceMs: number;
  endpointingMs: number;
}

export interface SttLiveKitConfig {
  provider: "livekit";
  endpointUrl: string;
  apiKeyRef?: SecretRef;
  model?: string;
  insecureSkipVerifyTLS?: boolean;
}

export interface SttWebSpeechConfig {
  provider: "webspeech";
}

export interface SttManualTextConfig {
  provider: "manual_text";
}

export type SttProviderConfig = SttLiveKitConfig | SttWebSpeechConfig | SttManualTextConfig;

// ============================================================
// LLM Types
// ============================================================

export type LlmProviderId = "openai_compatible";

export type LlmSafetyModeDefault = "actions_only" | "patch_fix";

export interface LlmOpenAICompatibleConfig {
  provider: "openai_compatible";
  baseUrl: string;
  apiKeyRef?: SecretRef;
  model: string;
  requestTimeoutMs: number;
  temperature: number;
  maxTokens: number;
  jsonMode: "strict" | "best_effort";
}

export type LlmProviderConfig = LlmOpenAICompatibleConfig;

// ============================================================
// Safety & UI Config
// ============================================================

export interface SafetyConfig {
  allowPatchMode: boolean;
  requireHumanReviewForPatches: true; // MUST be true
  patchWhitelistGlobs: string[];
  denylistRegexes: string[];
  maxPatchFiles: number;
  maxPatchBytes: number;
}

export interface UiConfig {
  kidMode: boolean;
  showDevDetails: boolean;
}

// ============================================================
// Settings Config (Main)
// ============================================================

export interface SettingsConfig {
  schemaVersion: 1;
  stt: SttCommonConfig & { providerConfig: SttProviderConfig };
  llm: {
    providerConfig: LlmProviderConfig;
    defaultMode: LlmSafetyModeDefault;
  };
  safety: SafetyConfig;
  ui: UiConfig;
}

// ============================================================
// STT Streaming IPC Types
// ============================================================

export type SttStreamId = string;

export interface SttStreamStartReq {
  streamId: SttStreamId;
  settingsOverride?: Partial<SettingsConfig["stt"]>;
}

export interface SttStreamStartRes {
  ok: boolean;
  streamId: SttStreamId;
  provider: SttProviderId;
  startedAtMs: number;
  message?: string;
}

export interface SttStreamPushReq {
  streamId: SttStreamId;
  chunkIndex: number;
  pcm16le: Uint8Array;
}

export interface SttStreamStopReq {
  streamId: SttStreamId;
}

export interface SttStreamStopRes {
  ok: boolean;
  streamId: SttStreamId;
  message?: string;
}

export interface SttStreamCancelReq {
  streamId: SttStreamId;
  reason?: string;
}

export interface SttStreamStatusReq {
  streamId: SttStreamId;
}

export type SttStreamState = "idle" | "streaming" | "stopping" | "error";

export interface SttStreamStatusRes {
  ok: boolean;
  streamId: SttStreamId;
  state: SttStreamState;
  provider: SttProviderId;
  lastError?: string;
}

export type SttStreamEvent =
  | {
      streamId: SttStreamId;
      type: "interim";
      text: string;
      confidence?: number;
      tMs: number;
    }
  | {
      streamId: SttStreamId;
      type: "final";
      text: string;
      confidence?: number;
      tMs: number;
    }
  | {
      streamId: SttStreamId;
      type: "state";
      state: "ready" | "listening" | "processing" | "done";
      tMs: number;
    }
  | {
      streamId: SttStreamId;
      type: "error";
      message: string;
      code?: string;
      tMs: number;
    };

// ============================================================
// LLM IPC Types
// ============================================================

export interface LlmHealthCheckReq {
  settingsOverride?: Partial<SettingsConfig["llm"]>;
}

export interface LlmHealthCheckRes {
  ok: boolean;
  baseUrl: string;
  model: string;
  latencyMs?: number;
  message?: string;
}

export interface LlmCompleteJSONReq {
  requestId: string;
  patternId?: string;
  messages?: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  jsonSchema: object;
  variables?: Record<string, unknown>;
  settingsOverride?: Partial<SettingsConfig["llm"]>;
  maxResponseBytes?: number;
}

export interface LlmCompleteJSONRes {
  ok: boolean;
  requestId: string;
  model?: string;
  latencyMs?: number;
  json?: unknown;
  rawText?: string;
  error?: { message: string; code?: string };
}

// ============================================================
// Preload Bridge Interface
// ============================================================

export interface KidModBridge {
  stt: {
    streamStart(req: SttStreamStartReq): Promise<SttStreamStartRes>;
    streamPush(req: SttStreamPushReq): void;
    streamStop(req: SttStreamStopReq): Promise<SttStreamStopRes>;
    streamCancel(req: SttStreamCancelReq): Promise<void>;
    streamStatus(req: SttStreamStatusReq): Promise<SttStreamStatusRes>;
    onStreamEvent(cb: (ev: SttStreamEvent) => void): () => void;
  };
  llm: {
    healthCheck(req: LlmHealthCheckReq): Promise<LlmHealthCheckRes>;
    completeJSON(req: LlmCompleteJSONReq): Promise<LlmCompleteJSONRes>;
  };
  settings: {
    get(): Promise<SettingsConfig>;
    update(patch: Partial<SettingsConfig>): Promise<SettingsConfig>;
  };
}

// ============================================================
// Error Codes
// ============================================================

export const ErrorCodes = {
  INVALID_PAYLOAD: "INVALID_PAYLOAD",
  STREAM_NOT_FOUND: "STREAM_NOT_FOUND",
  STREAM_ALREADY_EXISTS: "STREAM_ALREADY_EXISTS",
  PROVIDER_ERROR: "PROVIDER_ERROR",
  JSON_PARSE_FAILED: "JSON_PARSE_FAILED",
  SCHEMA_VALIDATION_FAILED: "SCHEMA_VALIDATION_FAILED",
  SECRET_NOT_FOUND: "SECRET_NOT_FOUND",
  SETTINGS_VALIDATION_FAILED: "SETTINGS_VALIDATION_FAILED",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
```

**Step 4: Commit**

```bash
git add packages/ipc-contracts/
git commit -m "feat(ipc-contracts): add TypeScript types for Settings and IPC"
```

---

## Task 3: Create ipc-contracts - Channels & Defaults

**Files:**
- Create: `packages/ipc-contracts/src/channels.ts`
- Create: `packages/ipc-contracts/src/defaults.ts`
- Modify: `packages/ipc-contracts/src/index.ts` (add exports)

**Step 1: Create packages/ipc-contracts/src/channels.ts**

```typescript
export const IPC = {
  // STT
  sttStreamStart: "stt.streamStart",
  sttStreamPush: "stt.streamPush",
  sttStreamStop: "stt.streamStop",
  sttStreamCancel: "stt.streamCancel",
  sttStreamStatus: "stt.streamStatus",
  sttStreamEvent: "stt.streamEvent",

  // LLM
  llmHealthCheck: "llm.healthCheck",
  llmCompleteJSON: "llm.completeJSON",

  // Settings
  settingsGet: "settings.get",
  settingsUpdate: "settings.update",
} as const;

export type IpcChannel = (typeof IPC)[keyof typeof IPC];
```

**Step 2: Create packages/ipc-contracts/src/defaults.ts**

```typescript
import type { SettingsConfig } from "./index.js";

export const DEFAULT_SETTINGS: SettingsConfig = {
  schemaVersion: 1,
  stt: {
    provider: "livekit",
    language: "de-DE",
    sampleRateHz: 16000,
    interimResults: true,
    maxUtteranceMs: 120000,
    endpointingMs: 800,
    providerConfig: {
      provider: "livekit",
      endpointUrl: "https://YOUR_STT_ENDPOINT",
      apiKeyRef: "secret:livekit_api_key",
      model: "default",
    },
  },
  llm: {
    providerConfig: {
      provider: "openai_compatible",
      baseUrl: "http://127.0.0.1:11434/v1",
      apiKeyRef: "secret:llm_api_key",
      model: "qwen2.5:7b-instruct",
      requestTimeoutMs: 60000,
      temperature: 0.2,
      maxTokens: 2048,
      jsonMode: "strict",
    },
    defaultMode: "actions_only",
  },
  safety: {
    allowPatchMode: true,
    requireHumanReviewForPatches: true,
    patchWhitelistGlobs: [
      "templates/fabric-1.20.1/src/main/java/**",
      "templates/fabric-1.20.1/src/main/resources/**",
      "generated/**",
    ],
    denylistRegexes: [
      "\\bRuntime\\.exec\\b",
      "\\bProcessBuilder\\b",
      "\\bjava\\.net\\b",
      "\\bsocket\\b",
      "\\bFiles\\.write\\b",
      "\\bFileOutputStream\\b",
    ],
    maxPatchFiles: 10,
    maxPatchBytes: 200000,
  },
  ui: {
    kidMode: true,
    showDevDetails: false,
  },
};
```

**Step 3: Update packages/ipc-contracts/src/index.ts - add exports at the end**

Add these lines at the end of the file:

```typescript
// Re-exports
export { IPC, type IpcChannel } from "./channels.js";
export { DEFAULT_SETTINGS } from "./defaults.js";
```

**Step 4: Commit**

```bash
git add packages/ipc-contracts/src/
git commit -m "feat(ipc-contracts): add IPC channels and default settings"
```

---

## Task 4: Create ipc-contracts - JSON Schema

**Files:**
- Create: `packages/ipc-contracts/src/schemas/settings.schema.json`

**Step 1: Create the JSON Schema file**

Create `packages/ipc-contracts/src/schemas/settings.schema.json`:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://kidmodstudio.local/schemas/settings.schema.json",
  "title": "KidModStudio SettingsConfig",
  "type": "object",
  "additionalProperties": false,
  "required": ["schemaVersion", "stt", "llm", "safety", "ui"],
  "properties": {
    "schemaVersion": { "const": 1 },

    "stt": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "provider",
        "language",
        "sampleRateHz",
        "interimResults",
        "maxUtteranceMs",
        "endpointingMs",
        "providerConfig"
      ],
      "properties": {
        "provider": { "enum": ["livekit", "webspeech", "manual_text"] },
        "language": { "enum": ["de-DE", "en-US"] },
        "sampleRateHz": { "enum": [16000, 48000] },
        "interimResults": { "type": "boolean" },
        "maxUtteranceMs": { "type": "integer", "minimum": 1000, "maximum": 600000 },
        "endpointingMs": { "type": "integer", "minimum": 0, "maximum": 5000 },

        "providerConfig": {
          "oneOf": [
            {
              "type": "object",
              "additionalProperties": false,
              "required": ["provider", "endpointUrl"],
              "properties": {
                "provider": { "const": "livekit" },
                "endpointUrl": { "type": "string", "minLength": 1 },
                "apiKeyRef": { "type": "string", "pattern": "^secret:.+$" },
                "model": { "type": "string" },
                "insecureSkipVerifyTLS": { "type": "boolean" }
              }
            },
            {
              "type": "object",
              "additionalProperties": false,
              "required": ["provider"],
              "properties": { "provider": { "const": "webspeech" } }
            },
            {
              "type": "object",
              "additionalProperties": false,
              "required": ["provider"],
              "properties": { "provider": { "const": "manual_text" } }
            }
          ]
        }
      }
    },

    "llm": {
      "type": "object",
      "additionalProperties": false,
      "required": ["providerConfig", "defaultMode"],
      "properties": {
        "defaultMode": { "enum": ["actions_only", "patch_fix"] },
        "providerConfig": {
          "type": "object",
          "additionalProperties": false,
          "required": [
            "provider",
            "baseUrl",
            "model",
            "requestTimeoutMs",
            "temperature",
            "maxTokens",
            "jsonMode"
          ],
          "properties": {
            "provider": { "const": "openai_compatible" },
            "baseUrl": { "type": "string", "minLength": 1 },
            "apiKeyRef": { "type": "string", "pattern": "^secret:.+$" },
            "model": { "type": "string", "minLength": 1 },
            "requestTimeoutMs": { "type": "integer", "minimum": 1000, "maximum": 600000 },
            "temperature": { "type": "number", "minimum": 0.0, "maximum": 2.0 },
            "maxTokens": { "type": "integer", "minimum": 1, "maximum": 32768 },
            "jsonMode": { "enum": ["strict", "best_effort"] }
          }
        }
      }
    },

    "safety": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "allowPatchMode",
        "requireHumanReviewForPatches",
        "patchWhitelistGlobs",
        "denylistRegexes",
        "maxPatchFiles",
        "maxPatchBytes"
      ],
      "properties": {
        "allowPatchMode": { "type": "boolean" },
        "requireHumanReviewForPatches": { "const": true },
        "patchWhitelistGlobs": {
          "type": "array",
          "items": { "type": "string", "minLength": 1 },
          "minItems": 1
        },
        "denylistRegexes": {
          "type": "array",
          "items": { "type": "string", "minLength": 1 }
        },
        "maxPatchFiles": { "type": "integer", "minimum": 1, "maximum": 100 },
        "maxPatchBytes": { "type": "integer", "minimum": 1000, "maximum": 2000000 }
      }
    },

    "ui": {
      "type": "object",
      "additionalProperties": false,
      "required": ["kidMode", "showDevDetails"],
      "properties": {
        "kidMode": { "type": "boolean" },
        "showDevDetails": { "type": "boolean" }
      }
    }
  }
}
```

**Step 2: Commit**

```bash
git add packages/ipc-contracts/src/schemas/
git commit -m "feat(ipc-contracts): add JSON Schema for settings validation"
```

---

## Task 5: Create ipc-contracts - Ajv Compiled Validators

**Files:**
- Modify: `packages/ipc-contracts/package.json` (add ajv dependency)
- Create: `packages/ipc-contracts/src/schemas/compiled/index.ts`
- Create: `packages/ipc-contracts/scripts/compile-schemas.ts`

**Step 1: Update package.json with ajv dependencies**

Add to `packages/ipc-contracts/package.json` dependencies:

```json
{
  "dependencies": {
    "ajv": "^8.12.0",
    "ajv-formats": "^3.0.1"
  },
  "scripts": {
    "build": "tsc",
    "build:schemas": "tsx scripts/compile-schemas.ts",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "tsx": "^4.7.0",
    "vitest": "^2.0.0"
  }
}
```

**Step 2: Create packages/ipc-contracts/scripts/compile-schemas.ts**

```typescript
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { writeFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import settingsSchema from "../src/schemas/settings.schema.json" assert { type: "json" };

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "../src/schemas/compiled");

mkdirSync(outDir, { recursive: true });

const ajv = new Ajv({ code: { source: true, esm: true }, allErrors: true });
addFormats(ajv);

const validate = ajv.compile(settingsSchema);
const moduleCode = `// AUTO-GENERATED - DO NOT EDIT
import Ajv from "ajv";
import addFormats from "ajv-formats";
import type { SettingsConfig } from "../../index.js";

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const schema = ${JSON.stringify(settingsSchema, null, 2)};

const validateSettings = ajv.compile<SettingsConfig>(schema);

export function isValidSettings(data: unknown): data is SettingsConfig {
  return validateSettings(data) === true;
}

export function validateSettingsWithErrors(data: unknown): { valid: boolean; errors: string[] } {
  const valid = validateSettings(data);
  if (valid) {
    return { valid: true, errors: [] };
  }
  const errors = validateSettings.errors?.map(e => \`\${e.instancePath} \${e.message}\`) ?? [];
  return { valid: false, errors };
}

export { validateSettings };
`;

writeFileSync(join(outDir, "index.ts"), moduleCode);
console.log("Schema validators compiled successfully!");
```

**Step 3: Create initial compiled validator**

Create `packages/ipc-contracts/src/schemas/compiled/index.ts`:

```typescript
// AUTO-GENERATED - DO NOT EDIT
import Ajv from "ajv";
import addFormats from "ajv-formats";
import type { SettingsConfig } from "../../index.js";

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// Schema will be imported at build time
import settingsSchema from "../settings.schema.json" assert { type: "json" };

const validateSettings = ajv.compile<SettingsConfig>(settingsSchema);

export function isValidSettings(data: unknown): data is SettingsConfig {
  return validateSettings(data) === true;
}

export function validateSettingsWithErrors(data: unknown): { valid: boolean; errors: string[] } {
  const valid = validateSettings(data);
  if (valid) {
    return { valid: true, errors: [] };
  }
  const errors = validateSettings.errors?.map(e => `${e.instancePath} ${e.message}`) ?? [];
  return { valid: false, errors };
}

export { validateSettings };
```

**Step 4: Update index.ts to export validators**

Add to `packages/ipc-contracts/src/index.ts`:

```typescript
export { isValidSettings, validateSettingsWithErrors, validateSettings } from "./schemas/compiled/index.js";
```

**Step 5: Commit**

```bash
git add packages/ipc-contracts/
git commit -m "feat(ipc-contracts): add Ajv schema validators"
```

---

## Task 6: Create ipc-contracts - Unit Tests

**Files:**
- Create: `packages/ipc-contracts/src/settings.test.ts`
- Create: `packages/ipc-contracts/vitest.config.ts`

**Step 1: Create packages/ipc-contracts/vitest.config.ts**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
  },
});
```

**Step 2: Create packages/ipc-contracts/src/settings.test.ts**

```typescript
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
```

**Step 3: Run tests to verify they pass**

```bash
cd packages/ipc-contracts
npm install
npm test
```

Expected: All tests should pass.

**Step 4: Commit**

```bash
git add packages/ipc-contracts/
git commit -m "test(ipc-contracts): add unit tests for settings validation"
```

---

## Task 7: Create Electron App - Package Setup

**Files:**
- Create: `apps/studio-electron/package.json`
- Create: `apps/studio-electron/tsconfig.json`
- Create: `apps/studio-electron/electron-builder.json`

**Step 1: Create apps/studio-electron/package.json**

```json
{
  "name": "@kidmodstudio/studio-electron",
  "version": "0.1.0",
  "private": true,
  "main": "dist/main/index.js",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "start": "electron .",
    "dev": "tsc && electron .",
    "test": "vitest run",
    "test:watch": "vitest",
    "package": "electron-builder"
  },
  "dependencies": {
    "@kidmodstudio/ipc-contracts": "*",
    "electron-log": "^5.0.0",
    "keytar": "^7.9.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "electron": "^33.0.0",
    "electron-builder": "^24.0.0",
    "vitest": "^2.0.0"
  }
}
```

**Step 2: Create apps/studio-electron/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

**Step 3: Create apps/studio-electron/electron-builder.json**

```json
{
  "appId": "com.kidmodstudio.app",
  "productName": "KidModStudio",
  "directories": {
    "output": "release"
  },
  "files": [
    "dist/**/*",
    "package.json"
  ],
  "linux": {
    "target": ["AppImage", "deb"]
  },
  "mac": {
    "target": ["dmg"]
  },
  "win": {
    "target": ["nsis"]
  }
}
```

**Step 4: Commit**

```bash
git add apps/studio-electron/
git commit -m "chore(studio-electron): initialize Electron app package"
```

---

## Task 8: Create Electron App - Secret Store

**Files:**
- Create: `apps/studio-electron/src/main/secretStore.ts`

**Step 1: Create apps/studio-electron/src/main/secretStore.ts**

```typescript
import keytar from "keytar";
import type { SecretRef } from "@kidmodstudio/ipc-contracts";

const SERVICE_NAME = "kidmodstudio";

function extractSecretName(ref: SecretRef): string {
  if (!ref.startsWith("secret:")) {
    throw new Error(`Invalid SecretRef: ${ref}`);
  }
  return ref.slice(7); // Remove "secret:" prefix
}

export class SecretStore {
  async get(ref: SecretRef): Promise<string | null> {
    const name = extractSecretName(ref);
    return keytar.getPassword(SERVICE_NAME, name);
  }

  async set(ref: SecretRef, value: string): Promise<void> {
    const name = extractSecretName(ref);
    await keytar.setPassword(SERVICE_NAME, name, value);
  }

  async delete(ref: SecretRef): Promise<void> {
    const name = extractSecretName(ref);
    await keytar.deletePassword(SERVICE_NAME, name);
  }

  async isConfigured(ref: SecretRef): Promise<boolean> {
    const value = await this.get(ref);
    return value !== null && value.length > 0;
  }
}

export const secretStore = new SecretStore();
```

**Step 2: Commit**

```bash
git add apps/studio-electron/src/main/secretStore.ts
git commit -m "feat(studio-electron): add keytar-based secret store"
```

---

## Task 9: Create Electron App - Settings Store

**Files:**
- Create: `apps/studio-electron/src/main/settingsStore.ts`

**Step 1: Create apps/studio-electron/src/main/settingsStore.ts**

```typescript
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

    return obj as SettingsConfig;
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
```

**Step 2: Commit**

```bash
git add apps/studio-electron/src/main/settingsStore.ts
git commit -m "feat(studio-electron): add settings store with validation and migration"
```

---

## Task 10: Create Electron App - STT IPC Handler

**Files:**
- Create: `apps/studio-electron/src/main/ipcHandlers/stt.ts`
- Create: `apps/studio-electron/src/main/providers/sttProvider.ts`
- Create: `apps/studio-electron/src/main/providers/echoSttProvider.ts`

**Step 1: Create apps/studio-electron/src/main/providers/sttProvider.ts**

```typescript
import type { SttStreamEvent, SttProviderId } from "@kidmodstudio/ipc-contracts";

export interface SttProvider {
  readonly providerId: SttProviderId;
  start(): Promise<void>;
  pushChunk(chunk: Uint8Array, chunkIndex: number): void;
  stop(): Promise<string>;
  cancel(): void;
  onEvent(handler: (event: Omit<SttStreamEvent, "streamId">) => void): void;
}
```

**Step 2: Create apps/studio-electron/src/main/providers/echoSttProvider.ts**

```typescript
import type { SttProvider } from "./sttProvider.js";
import type { SttStreamEvent, SttProviderId } from "@kidmodstudio/ipc-contracts";

export class EchoSttProvider implements SttProvider {
  readonly providerId: SttProviderId = "livekit"; // Stub pretends to be livekit
  private chunks = 0;
  private eventHandler?: (event: Omit<SttStreamEvent, "streamId">) => void;

  async start(): Promise<void> {
    this.chunks = 0;
    this.emit({ type: "state", state: "ready", tMs: Date.now() });
    this.emit({ type: "state", state: "listening", tMs: Date.now() });
  }

  pushChunk(chunk: Uint8Array, chunkIndex: number): void {
    this.chunks++;

    // After 5 chunks, emit interim result
    if (this.chunks === 5) {
      this.emit({
        type: "interim",
        text: "Hallo...",
        confidence: 0.8,
        tMs: Date.now(),
      });
    }

    // After 10 chunks, emit another interim
    if (this.chunks === 10) {
      this.emit({
        type: "interim",
        text: "Hallo, ich bin...",
        confidence: 0.85,
        tMs: Date.now(),
      });
    }
  }

  async stop(): Promise<string> {
    const transcript = "Hallo, ich bin ein Test";

    this.emit({
      type: "final",
      text: transcript,
      confidence: 0.95,
      tMs: Date.now(),
    });

    this.emit({ type: "state", state: "done", tMs: Date.now() });

    return transcript;
  }

  cancel(): void {
    this.emit({
      type: "error",
      message: "Stream cancelled",
      code: "CANCELLED",
      tMs: Date.now(),
    });
  }

  onEvent(handler: (event: Omit<SttStreamEvent, "streamId">) => void): void {
    this.eventHandler = handler;
  }

  private emit(event: Omit<SttStreamEvent, "streamId">): void {
    this.eventHandler?.(event);
  }
}
```

**Step 3: Create apps/studio-electron/src/main/ipcHandlers/stt.ts**

```typescript
import { ipcMain, type WebContents } from "electron";
import log from "electron-log";
import {
  IPC,
  ErrorCodes,
  type SttStreamStartReq,
  type SttStreamStartRes,
  type SttStreamPushReq,
  type SttStreamStopReq,
  type SttStreamStopRes,
  type SttStreamCancelReq,
  type SttStreamStatusReq,
  type SttStreamStatusRes,
  type SttStreamState,
  type SttStreamEvent,
  type SttProviderId,
} from "@kidmodstudio/ipc-contracts";
import type { SttProvider } from "../providers/sttProvider.js";
import { EchoSttProvider } from "../providers/echoSttProvider.js";

interface StreamSession {
  id: string;
  provider: SttProvider;
  state: SttStreamState;
  startedAt: number;
  webContents: WebContents;
}

const activeSessions = new Map<string, StreamSession>();

const MAX_CHUNK_SIZE = 65536; // 64KB

function validateStreamId(streamId: unknown): streamId is string {
  return typeof streamId === "string" && streamId.length > 0 && streamId.length <= 64;
}

function sendEvent(session: StreamSession, event: Omit<SttStreamEvent, "streamId">): void {
  const fullEvent: SttStreamEvent = { ...event, streamId: session.id } as SttStreamEvent;
  if (!session.webContents.isDestroyed()) {
    session.webContents.send(IPC.sttStreamEvent, fullEvent);
  }
}

export function registerSttHandlers(): void {
  // stt.streamStart
  ipcMain.handle(IPC.sttStreamStart, async (event, req: SttStreamStartReq): Promise<SttStreamStartRes> => {
    if (!validateStreamId(req.streamId)) {
      return {
        ok: false,
        streamId: req.streamId ?? "",
        provider: "livekit",
        startedAtMs: Date.now(),
        message: "Invalid streamId",
      };
    }

    if (activeSessions.has(req.streamId)) {
      return {
        ok: false,
        streamId: req.streamId,
        provider: "livekit",
        startedAtMs: Date.now(),
        message: ErrorCodes.STREAM_ALREADY_EXISTS,
      };
    }

    // Create provider (using Echo stub for now)
    const provider = new EchoSttProvider();
    const session: StreamSession = {
      id: req.streamId,
      provider,
      state: "idle",
      startedAt: Date.now(),
      webContents: event.sender,
    };

    // Wire up events
    provider.onEvent((ev) => sendEvent(session, ev));

    activeSessions.set(req.streamId, session);

    try {
      await provider.start();
      session.state = "streaming";
      log.info(`STT stream started: ${req.streamId}`);

      return {
        ok: true,
        streamId: req.streamId,
        provider: provider.providerId,
        startedAtMs: session.startedAt,
      };
    } catch (error) {
      activeSessions.delete(req.streamId);
      return {
        ok: false,
        streamId: req.streamId,
        provider: provider.providerId,
        startedAtMs: session.startedAt,
        message: String(error),
      };
    }
  });

  // stt.streamPush (fire-and-forget)
  ipcMain.on(IPC.sttStreamPush, (event, req: SttStreamPushReq) => {
    if (!validateStreamId(req.streamId)) {
      log.warn("Invalid streamId in streamPush");
      return;
    }

    const session = activeSessions.get(req.streamId);
    if (!session) {
      log.warn(`Stream not found: ${req.streamId}`);
      return;
    }

    if (req.pcm16le.byteLength > MAX_CHUNK_SIZE) {
      log.warn(`Chunk too large: ${req.pcm16le.byteLength} > ${MAX_CHUNK_SIZE}`);
      return;
    }

    session.provider.pushChunk(req.pcm16le, req.chunkIndex);
  });

  // stt.streamStop
  ipcMain.handle(IPC.sttStreamStop, async (event, req: SttStreamStopReq): Promise<SttStreamStopRes> => {
    if (!validateStreamId(req.streamId)) {
      return { ok: false, streamId: req.streamId ?? "", message: "Invalid streamId" };
    }

    const session = activeSessions.get(req.streamId);
    if (!session) {
      return { ok: false, streamId: req.streamId, message: ErrorCodes.STREAM_NOT_FOUND };
    }

    try {
      session.state = "stopping";
      await session.provider.stop();
      activeSessions.delete(req.streamId);
      log.info(`STT stream stopped: ${req.streamId}`);
      return { ok: true, streamId: req.streamId };
    } catch (error) {
      return { ok: false, streamId: req.streamId, message: String(error) };
    }
  });

  // stt.streamCancel
  ipcMain.handle(IPC.sttStreamCancel, async (event, req: SttStreamCancelReq): Promise<void> => {
    if (!validateStreamId(req.streamId)) return;

    const session = activeSessions.get(req.streamId);
    if (!session) return;

    session.provider.cancel();
    activeSessions.delete(req.streamId);
    log.info(`STT stream cancelled: ${req.streamId}`);
  });

  // stt.streamStatus
  ipcMain.handle(IPC.sttStreamStatus, async (event, req: SttStreamStatusReq): Promise<SttStreamStatusRes> => {
    if (!validateStreamId(req.streamId)) {
      return {
        ok: false,
        streamId: req.streamId ?? "",
        state: "error",
        provider: "livekit",
        lastError: "Invalid streamId",
      };
    }

    const session = activeSessions.get(req.streamId);
    if (!session) {
      return {
        ok: false,
        streamId: req.streamId,
        state: "error",
        provider: "livekit",
        lastError: ErrorCodes.STREAM_NOT_FOUND,
      };
    }

    return {
      ok: true,
      streamId: req.streamId,
      state: session.state,
      provider: session.provider.providerId,
    };
  });
}
```

**Step 4: Commit**

```bash
git add apps/studio-electron/src/main/
git commit -m "feat(studio-electron): add STT IPC handlers with echo stub provider"
```

---

## Task 11: Create Electron App - LLM IPC Handler

**Files:**
- Create: `apps/studio-electron/src/main/providers/llmProvider.ts`
- Create: `apps/studio-electron/src/main/providers/mockLlmProvider.ts`
- Create: `apps/studio-electron/src/main/ipcHandlers/llm.ts`

**Step 1: Create apps/studio-electron/src/main/providers/llmProvider.ts**

```typescript
export interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LlmProvider {
  healthCheck(): Promise<{ ok: boolean; latencyMs: number; message?: string }>;
  complete(messages: LlmMessage[]): Promise<string>;
}
```

**Step 2: Create apps/studio-electron/src/main/providers/mockLlmProvider.ts**

```typescript
import type { LlmProvider, LlmMessage } from "./llmProvider.js";

export class MockLlmProvider implements LlmProvider {
  constructor(
    private baseUrl: string,
    private model: string
  ) {}

  async healthCheck(): Promise<{ ok: boolean; latencyMs: number; message?: string }> {
    const start = Date.now();
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 50));
    return {
      ok: true,
      latencyMs: Date.now() - start,
      message: `Mock connected to ${this.baseUrl}`,
    };
  }

  async complete(messages: LlmMessage[]): Promise<string> {
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Return a mock JSON response
    // In real implementation, this would call the LLM API
    return JSON.stringify({
      action: "create_block",
      blockId: "custom_block",
      properties: {
        hardness: 1.5,
        resistance: 6.0,
      },
    });
  }
}

// Schema-based JSON generator for mock responses
export function generateFromSchema(schema: object): unknown {
  const s = schema as any;

  if (s.const !== undefined) return s.const;
  if (s.enum) return s.enum[0];

  switch (s.type) {
    case "string":
      return s.default ?? "mock_string";
    case "number":
    case "integer":
      return s.default ?? s.minimum ?? 0;
    case "boolean":
      return s.default ?? true;
    case "null":
      return null;
    case "array":
      if (s.items) {
        return [generateFromSchema(s.items)];
      }
      return [];
    case "object":
      const obj: Record<string, unknown> = {};
      if (s.properties) {
        for (const [key, propSchema] of Object.entries(s.properties)) {
          obj[key] = generateFromSchema(propSchema as object);
        }
      }
      return obj;
    default:
      return null;
  }
}
```

**Step 3: Create apps/studio-electron/src/main/ipcHandlers/llm.ts**

```typescript
import { ipcMain } from "electron";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import log from "electron-log";
import {
  IPC,
  ErrorCodes,
  type LlmHealthCheckReq,
  type LlmHealthCheckRes,
  type LlmCompleteJSONReq,
  type LlmCompleteJSONRes,
} from "@kidmodstudio/ipc-contracts";
import { settingsStore } from "../settingsStore.js";
import { MockLlmProvider, generateFromSchema } from "../providers/mockLlmProvider.js";
import type { LlmProvider } from "../providers/llmProvider.js";

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

function getProvider(): LlmProvider {
  const config = settingsStore.get().llm.providerConfig;
  // For now, always use mock provider
  return new MockLlmProvider(config.baseUrl, config.model);
}

export function registerLlmHandlers(): void {
  // llm.healthCheck
  ipcMain.handle(IPC.llmHealthCheck, async (event, req: LlmHealthCheckReq): Promise<LlmHealthCheckRes> => {
    const config = settingsStore.get().llm.providerConfig;
    const provider = getProvider();

    try {
      const result = await provider.healthCheck();
      return {
        ok: result.ok,
        baseUrl: config.baseUrl,
        model: config.model,
        latencyMs: result.latencyMs,
        message: result.message,
      };
    } catch (error) {
      log.error("LLM health check failed:", error);
      return {
        ok: false,
        baseUrl: config.baseUrl,
        model: config.model,
        message: String(error),
      };
    }
  });

  // llm.completeJSON
  ipcMain.handle(IPC.llmCompleteJSON, async (event, req: LlmCompleteJSONReq): Promise<LlmCompleteJSONRes> => {
    const startTime = Date.now();
    const config = settingsStore.get();
    const provider = getProvider();

    try {
      // Build messages
      const messages = req.messages ?? [
        { role: "system" as const, content: "You are a helpful assistant. Respond with valid JSON only." },
        { role: "user" as const, content: "Generate a response matching the provided schema." },
      ];

      // For mock: generate from schema instead of calling LLM
      // In production, this would call provider.complete(messages)
      const rawText = JSON.stringify(generateFromSchema(req.jsonSchema));

      // Parse JSON
      let parsed: unknown;
      try {
        parsed = JSON.parse(rawText);
      } catch (parseError) {
        log.error("JSON parse failed:", parseError);
        return {
          ok: false,
          requestId: req.requestId,
          model: config.llm.providerConfig.model,
          latencyMs: Date.now() - startTime,
          error: {
            message: "Failed to parse LLM response as JSON",
            code: ErrorCodes.JSON_PARSE_FAILED,
          },
        };
      }

      // Validate against schema
      const validate = ajv.compile(req.jsonSchema);
      const valid = validate(parsed);

      if (!valid) {
        const errors = validate.errors?.map((e) => `${e.instancePath} ${e.message}`).join("; ");
        log.error("Schema validation failed:", errors);
        return {
          ok: false,
          requestId: req.requestId,
          model: config.llm.providerConfig.model,
          latencyMs: Date.now() - startTime,
          error: {
            message: `Schema validation failed: ${errors}`,
            code: ErrorCodes.SCHEMA_VALIDATION_FAILED,
          },
        };
      }

      const response: LlmCompleteJSONRes = {
        ok: true,
        requestId: req.requestId,
        model: config.llm.providerConfig.model,
        latencyMs: Date.now() - startTime,
        json: parsed,
      };

      // Only include rawText if showDevDetails is true
      if (config.ui.showDevDetails) {
        response.rawText = rawText;
      }

      return response;
    } catch (error) {
      log.error("LLM completion failed:", error);
      return {
        ok: false,
        requestId: req.requestId,
        model: config.llm.providerConfig.model,
        latencyMs: Date.now() - startTime,
        error: {
          message: String(error),
          code: ErrorCodes.PROVIDER_ERROR,
        },
      };
    }
  });
}
```

**Step 4: Commit**

```bash
git add apps/studio-electron/src/main/
git commit -m "feat(studio-electron): add LLM IPC handlers with mock provider"
```

---

## Task 12: Create Electron App - Settings IPC Handler

**Files:**
- Create: `apps/studio-electron/src/main/ipcHandlers/settings.ts`

**Step 1: Create apps/studio-electron/src/main/ipcHandlers/settings.ts**

```typescript
import { ipcMain } from "electron";
import log from "electron-log";
import { IPC, type SettingsConfig } from "@kidmodstudio/ipc-contracts";
import { settingsStore } from "../settingsStore.js";

export function registerSettingsHandlers(): void {
  // settings.get
  ipcMain.handle(IPC.settingsGet, async (): Promise<SettingsConfig> => {
    return settingsStore.get();
  });

  // settings.update
  ipcMain.handle(IPC.settingsUpdate, async (event, patch: Partial<SettingsConfig>): Promise<SettingsConfig> => {
    try {
      return await settingsStore.update(patch);
    } catch (error) {
      log.error("Failed to update settings:", error);
      throw error;
    }
  });
}
```

**Step 2: Commit**

```bash
git add apps/studio-electron/src/main/ipcHandlers/settings.ts
git commit -m "feat(studio-electron): add settings IPC handlers"
```

---

## Task 13: Create Electron App - Preload Bridge

**Files:**
- Create: `apps/studio-electron/src/preload/bridge.ts`

**Step 1: Create apps/studio-electron/src/preload/bridge.ts**

```typescript
import { contextBridge, ipcRenderer } from "electron";
import {
  IPC,
  type KidModBridge,
  type SttStreamStartReq,
  type SttStreamPushReq,
  type SttStreamStopReq,
  type SttStreamCancelReq,
  type SttStreamStatusReq,
  type SttStreamEvent,
  type LlmHealthCheckReq,
  type LlmCompleteJSONReq,
  type SettingsConfig,
} from "@kidmodstudio/ipc-contracts";

const MAX_STREAM_ID_LENGTH = 64;
const MAX_CHUNK_SIZE = 65536; // 64KB

function validateStreamId(streamId: unknown): void {
  if (typeof streamId !== "string" || streamId.length === 0 || streamId.length > MAX_STREAM_ID_LENGTH) {
    throw new Error(`Invalid streamId: must be string of 1-${MAX_STREAM_ID_LENGTH} chars`);
  }
}

function validateChunk(chunk: Uint8Array): void {
  if (!(chunk instanceof Uint8Array)) {
    throw new Error("Invalid chunk: must be Uint8Array");
  }
  if (chunk.byteLength > MAX_CHUNK_SIZE) {
    throw new Error(`Chunk too large: ${chunk.byteLength} > ${MAX_CHUNK_SIZE}`);
  }
}

const bridge: KidModBridge = {
  stt: {
    streamStart: async (req: SttStreamStartReq) => {
      validateStreamId(req.streamId);
      return ipcRenderer.invoke(IPC.sttStreamStart, req);
    },

    streamPush: (req: SttStreamPushReq) => {
      validateStreamId(req.streamId);
      validateChunk(req.pcm16le);
      ipcRenderer.send(IPC.sttStreamPush, req);
    },

    streamStop: async (req: SttStreamStopReq) => {
      validateStreamId(req.streamId);
      return ipcRenderer.invoke(IPC.sttStreamStop, req);
    },

    streamCancel: async (req: SttStreamCancelReq) => {
      validateStreamId(req.streamId);
      return ipcRenderer.invoke(IPC.sttStreamCancel, req);
    },

    streamStatus: async (req: SttStreamStatusReq) => {
      validateStreamId(req.streamId);
      return ipcRenderer.invoke(IPC.sttStreamStatus, req);
    },

    onStreamEvent: (cb: (ev: SttStreamEvent) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, data: SttStreamEvent) => cb(data);
      ipcRenderer.on(IPC.sttStreamEvent, handler);
      return () => {
        ipcRenderer.removeListener(IPC.sttStreamEvent, handler);
      };
    },
  },

  llm: {
    healthCheck: async (req: LlmHealthCheckReq) => {
      return ipcRenderer.invoke(IPC.llmHealthCheck, req);
    },

    completeJSON: async (req: LlmCompleteJSONReq) => {
      if (typeof req.requestId !== "string" || req.requestId.length === 0) {
        throw new Error("Invalid requestId");
      }
      return ipcRenderer.invoke(IPC.llmCompleteJSON, req);
    },
  },

  settings: {
    get: async () => {
      return ipcRenderer.invoke(IPC.settingsGet);
    },

    update: async (patch: Partial<SettingsConfig>) => {
      return ipcRenderer.invoke(IPC.settingsUpdate, patch);
    },
  },
};

contextBridge.exposeInMainWorld("kidmod", bridge);
```

**Step 2: Commit**

```bash
git add apps/studio-electron/src/preload/bridge.ts
git commit -m "feat(studio-electron): add typed preload bridge with validation"
```

---

## Task 14: Create Electron App - Main Entry Point

**Files:**
- Create: `apps/studio-electron/src/main/index.ts`
- Create: `apps/studio-electron/src/renderer/index.html`

**Step 1: Create apps/studio-electron/src/main/index.ts**

```typescript
import { app, BrowserWindow } from "electron";
import { join } from "path";
import { fileURLToPath } from "url";
import log from "electron-log";
import { settingsStore } from "./settingsStore.js";
import { registerSttHandlers } from "./ipcHandlers/stt.js";
import { registerLlmHandlers } from "./ipcHandlers/llm.js";
import { registerSettingsHandlers } from "./ipcHandlers/settings.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

log.initialize();
log.info("KidModStudio starting...");

let mainWindow: BrowserWindow | null = null;

async function createWindow(): Promise<void> {
  // Load settings before creating window
  await settingsStore.load();
  log.info("Settings loaded");

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, "../preload/bridge.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Register IPC handlers
  registerSttHandlers();
  registerLlmHandlers();
  registerSettingsHandlers();
  log.info("IPC handlers registered");

  // Load renderer
  const rendererPath = join(__dirname, "../renderer/index.html");
  await mainWindow.loadFile(rendererPath);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  log.info("Main window created");
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
```

**Step 2: Create apps/studio-electron/src/renderer/index.html**

```html
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'">
  <title>KidModStudio</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 20px;
      background: #1a1a2e;
      color: #eee;
    }
    h1 { color: #4ecca3; }
    .status {
      padding: 10px;
      margin: 10px 0;
      border-radius: 4px;
      background: #16213e;
    }
    .status.ok { border-left: 4px solid #4ecca3; }
    .status.error { border-left: 4px solid #e94560; }
    button {
      background: #4ecca3;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      margin: 5px;
      color: #1a1a2e;
      font-weight: bold;
    }
    button:hover { background: #3db890; }
    #log {
      background: #0f0f1a;
      padding: 10px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
      max-height: 300px;
      overflow-y: auto;
    }
  </style>
</head>
<body>
  <h1>🎮 KidModStudio</h1>

  <div class="status" id="llm-status">LLM: Checking...</div>
  <div class="status" id="stt-status">STT: Ready</div>

  <div>
    <button id="btn-health">Check LLM Health</button>
    <button id="btn-complete">Test JSON Completion</button>
    <button id="btn-stt-start">Start STT Stream</button>
    <button id="btn-stt-stop">Stop STT Stream</button>
  </div>

  <h3>Log</h3>
  <div id="log"></div>

  <script>
    const log = (msg) => {
      const el = document.getElementById('log');
      const time = new Date().toLocaleTimeString();
      el.innerHTML = `[${time}] ${msg}<br>` + el.innerHTML;
    };

    const updateStatus = (id, ok, msg) => {
      const el = document.getElementById(id);
      el.className = ok ? 'status ok' : 'status error';
      el.textContent = msg;
    };

    // Health Check
    document.getElementById('btn-health').onclick = async () => {
      log('Checking LLM health...');
      const res = await window.kidmod.llm.healthCheck({});
      updateStatus('llm-status', res.ok, `LLM: ${res.ok ? 'Connected' : 'Failed'} - ${res.message || res.model}`);
      log(`Health check: ${JSON.stringify(res)}`);
    };

    // JSON Completion
    document.getElementById('btn-complete').onclick = async () => {
      log('Testing JSON completion...');
      const res = await window.kidmod.llm.completeJSON({
        requestId: 'test-' + Date.now(),
        jsonSchema: {
          type: 'object',
          properties: {
            action: { type: 'string' },
            blockId: { type: 'string' }
          },
          required: ['action', 'blockId']
        }
      });
      log(`Completion result: ${JSON.stringify(res)}`);
    };

    // STT Stream
    let currentStreamId = null;

    document.getElementById('btn-stt-start').onclick = async () => {
      currentStreamId = 'stream-' + Date.now();
      log(`Starting STT stream: ${currentStreamId}`);

      // Listen for events
      window.kidmod.stt.onStreamEvent((ev) => {
        log(`STT Event: ${ev.type} - ${ev.text || ev.state || ev.message}`);
        if (ev.type === 'final') {
          updateStatus('stt-status', true, `STT: "${ev.text}"`);
        }
      });

      const res = await window.kidmod.stt.streamStart({ streamId: currentStreamId });
      log(`Stream started: ${JSON.stringify(res)}`);
      updateStatus('stt-status', res.ok, `STT: ${res.ok ? 'Streaming...' : res.message}`);

      // Simulate sending some chunks
      if (res.ok) {
        for (let i = 0; i < 12; i++) {
          setTimeout(() => {
            const chunk = new Uint8Array(640); // 20ms @ 16kHz
            window.kidmod.stt.streamPush({ streamId: currentStreamId, chunkIndex: i, pcm16le: chunk });
            log(`Sent chunk ${i}`);
          }, i * 100);
        }
      }
    };

    document.getElementById('btn-stt-stop').onclick = async () => {
      if (!currentStreamId) {
        log('No active stream');
        return;
      }
      log(`Stopping STT stream: ${currentStreamId}`);
      const res = await window.kidmod.stt.streamStop({ streamId: currentStreamId });
      log(`Stream stopped: ${JSON.stringify(res)}`);
      currentStreamId = null;
    };

    // Initial health check
    window.kidmod.llm.healthCheck({}).then(res => {
      updateStatus('llm-status', res.ok, `LLM: ${res.ok ? 'Connected' : 'Failed'} - ${res.message || res.model}`);
    });
  </script>
</body>
</html>
```

**Step 3: Commit**

```bash
git add apps/studio-electron/src/
git commit -m "feat(studio-electron): add main entry point and test renderer UI"
```

---

## Task 15: Create TypeScript Declarations

**Files:**
- Create: `apps/studio-electron/src/renderer/global.d.ts`

**Step 1: Create apps/studio-electron/src/renderer/global.d.ts**

```typescript
import type { KidModBridge } from "@kidmodstudio/ipc-contracts";

declare global {
  interface Window {
    kidmod: KidModBridge;
  }
}

export {};
```

**Step 2: Commit**

```bash
git add apps/studio-electron/src/renderer/global.d.ts
git commit -m "chore(studio-electron): add global type declarations for preload bridge"
```

---

## Task 16: Install Dependencies and Build

**Step 1: Install all dependencies from root**

```bash
cd /home/dyai/Dokumente/Pers.Tests-Page/social-role/DYAI_home/DEV/TOOLS/Minecraft-ModBuilder
npm install
```

**Step 2: Build ipc-contracts**

```bash
cd packages/ipc-contracts
npm run build
```

Expected: TypeScript compiles without errors.

**Step 3: Run ipc-contracts tests**

```bash
npm test
```

Expected: All tests pass.

**Step 4: Build studio-electron**

```bash
cd ../../apps/studio-electron
npm run build
```

Expected: TypeScript compiles without errors.

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: install dependencies and verify build"
```

---

## Task 17: Integration Tests

**Files:**
- Create: `apps/studio-electron/src/main/ipcHandlers/llm.test.ts`

**Step 1: Create apps/studio-electron/src/main/ipcHandlers/llm.test.ts**

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { generateFromSchema } from "../providers/mockLlmProvider.js";

describe("LLM Provider", () => {
  describe("generateFromSchema", () => {
    it("generates string for string type", () => {
      const result = generateFromSchema({ type: "string" });
      expect(typeof result).toBe("string");
    });

    it("generates number for number type", () => {
      const result = generateFromSchema({ type: "number" });
      expect(typeof result).toBe("number");
    });

    it("generates boolean for boolean type", () => {
      const result = generateFromSchema({ type: "boolean" });
      expect(typeof result).toBe("boolean");
    });

    it("generates array for array type", () => {
      const result = generateFromSchema({ type: "array", items: { type: "string" } });
      expect(Array.isArray(result)).toBe(true);
    });

    it("generates object with properties", () => {
      const result = generateFromSchema({
        type: "object",
        properties: {
          name: { type: "string" },
          count: { type: "number" },
        },
      });
      expect(result).toHaveProperty("name");
      expect(result).toHaveProperty("count");
    });

    it("uses const value when specified", () => {
      const result = generateFromSchema({ const: "fixed_value" });
      expect(result).toBe("fixed_value");
    });

    it("uses first enum value when specified", () => {
      const result = generateFromSchema({ enum: ["first", "second", "third"] });
      expect(result).toBe("first");
    });
  });
});
```

**Step 2: Create apps/studio-electron/vitest.config.ts**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
  },
});
```

**Step 3: Run tests**

```bash
cd apps/studio-electron
npm test
```

Expected: All tests pass.

**Step 4: Commit**

```bash
git add apps/studio-electron/
git commit -m "test(studio-electron): add integration tests for LLM provider"
```

---

## Task 18: Final Verification

**Step 1: Run full build from root**

```bash
cd /home/dyai/Dokumente/Pers.Tests-Page/social-role/DYAI_home/DEV/TOOLS/Minecraft-ModBuilder
npm run build
```

Expected: Both packages build successfully.

**Step 2: Run all tests**

```bash
npm test
```

Expected: All tests pass.

**Step 3: Start the Electron app**

```bash
cd apps/studio-electron
npm run dev
```

Expected: App opens, shows health check UI, buttons work.

**Step 4: Verify Definition of Done**

- [x] `settings.schema.json` + TS types are consistent
- [x] App starts without settings.json (creates defaults)
- [x] `settings.update` persists + validates
- [x] All IPC endpoints implemented + typed + preload-exposed
- [x] `llm.healthCheck` works against mock provider
- [x] `llm.completeJSON` validates response against schema
- [x] STT streaming contract works with echo-stub
- [x] All unit tests pass
- [x] Integration tests pass

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete KidModStudio Settings & IPC System v0.1"
```

---

**Plan complete and saved to `docs/plans/2025-12-26-kidmodstudio-settings-ipc-plan.md`. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session in worktree with executing-plans, batch execution with checkpoints

**Which approach?**
