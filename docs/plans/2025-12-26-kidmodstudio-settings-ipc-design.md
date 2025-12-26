# KidModStudio Settings & IPC System - Design Document

**Date:** 2025-12-26
**Status:** Approved

## Overview

This document describes the design for the Settings System and IPC Contracts for KidModStudio, an Electron application for kid-friendly Minecraft mod creation with voice input and AI assistance.

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Project Structure | New `apps/` + `packages/` layout | Clean separation, monorepo ready |
| Secret Storage | keytar (OS Keychain) | Native, secure, no plaintext in app |
| STT Stub | Echo-Stub | Simple, validates data path |
| LLM Mock | Schema-Echo | Proves schema validation works |
| Package Manager | npm workspaces | Simple, no extra tools |
| Test Framework | Vitest | Fast, TypeScript-native |
| Schema Validation | Ajv pre-compiled | Runtime performance, type safety |
| Electron Tooling | Electron 33+ / electron-builder | Current, stable, proven |

## Architecture

### Project Structure

```
Minecraft-ModBuilder/
├── package.json                    # Root workspace config
├── packages/
│   └── ipc-contracts/
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts            # All TS types exported
│           ├── channels.ts         # IPC channel constants
│           ├── defaults.ts         # DEFAULT_SETTINGS
│           └── schemas/
│               ├── settings.schema.json
│               └── compiled/
│                   └── index.ts    # Pre-compiled Ajv validators
└── apps/
    └── studio-electron/
        ├── package.json
        ├── tsconfig.json
        ├── electron-builder.json
        └── src/
            ├── main/
            │   ├── index.ts
            │   ├── settingsStore.ts
            │   ├── secretStore.ts
            │   └── ipcHandlers/
            │       ├── stt.ts
            │       ├── llm.ts
            │       └── settings.ts
            ├── preload/
            │   └── bridge.ts
            └── renderer/
                ├── index.html
                └── ipc/
                    └── client.ts
```

### Settings Store

- **Location:** `${app.getPath("userData")}/settings.json`
- **Validation:** Ajv with pre-compiled validators
- **Migration:** Schema version based, fallback to defaults on unknown versions
- **Error Recovery:** Backup invalid files to `settings.invalid.<timestamp>.json`

### Secret Store

- **Backend:** keytar with service name "kidmodstudio"
- **Pattern:** `SecretRef = "secret:${name}"` in settings, actual values in OS keychain
- **Renderer Access:** Only `isConfigured(ref): boolean`, never plaintext

### IPC Contracts

#### STT Streaming

| Channel | Type | Purpose |
|---------|------|---------|
| `stt.streamStart` | invoke | Create session, init provider |
| `stt.streamPush` | send | Forward PCM16LE chunks (≤64KB) |
| `stt.streamStop` | invoke | Finalize, get transcript |
| `stt.streamCancel` | invoke | Abort stream |
| `stt.streamStatus` | invoke | Query session state |
| `stt.streamEvent` | main→renderer | interim/final/state/error events |

#### LLM

| Channel | Type | Purpose |
|---------|------|---------|
| `llm.healthCheck` | invoke | Test endpoint connectivity |
| `llm.completeJSON` | invoke | Schema-validated JSON completion |

### Error Codes

| Code | Meaning |
|------|---------|
| `INVALID_PAYLOAD` | Request validation failed |
| `STREAM_NOT_FOUND` | streamId does not exist |
| `STREAM_ALREADY_EXISTS` | streamId already active |
| `PROVIDER_ERROR` | STT/LLM provider error |
| `JSON_PARSE_FAILED` | LLM response not valid JSON |
| `SCHEMA_VALIDATION_FAILED` | JSON doesn't match schema |
| `SECRET_NOT_FOUND` | secretRef not in keychain |
| `SETTINGS_VALIDATION_FAILED` | Settings don't match schema |

## Definition of Done

1. [ ] `settings.schema.json` + TS types are consistent
2. [ ] App starts without settings.json (creates defaults)
3. [ ] `settings.update` persists + validates
4. [ ] All IPC endpoints implemented + typed + preload-exposed
5. [ ] `llm.healthCheck` works against mock provider
6. [ ] `llm.completeJSON` validates response against schema
7. [ ] STT streaming contract works with echo-stub
8. [ ] All unit tests pass
9. [ ] Integration tests pass
