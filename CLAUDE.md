# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This repository has a **hybrid structure**:
1. **Root monorepo (KidModStudio)** - Active development of a child-friendly Minecraft mod builder Electron app
2. **Independent projects** - Various Minecraft modding tools in subdirectories with their own build systems

## KidModStudio Monorepo (Active Development)

Child-friendly Electron app for building Minecraft mods via voice/LLM.

**Commands (from root):**
```bash
npm install           # Install all workspace dependencies
npm run build         # Build all packages
npm test              # Run all tests
```

### Packages

**@kidmodstudio/ipc-contracts** (`packages/ipc-contracts/`)
Type-safe IPC contracts, JSON schemas, and validators for Electron communication.
```bash
cd packages/ipc-contracts
npm run build         # Compile TypeScript
npm test              # Run Vitest tests
npm run test:watch    # Watch mode
```

**Key files:**
- `src/index.ts` - All TypeScript types (STT, LLM, Settings, IPC)
- `src/channels.ts` - IPC channel constants
- `src/defaults.ts` - Default settings with safety controls
- `src/schemas/settings.schema.json` - JSON Schema (Draft-07) for validation
- `src/schemas/compiled/index.ts` - Ajv validators

**@kidmodstudio/studio-electron** (`apps/studio-electron/`)
Electron app with Main/Preload/Renderer separation.
```bash
cd apps/studio-electron
npm run build         # Compile TypeScript
npm run dev           # Build and run Electron
npm test              # Run Vitest tests
npm run package       # Build distributable (electron-builder)
```

**Key files:**
- `src/main/index.ts` - Main process entry, window creation, IPC registration
- `src/main/settingsStore.ts` - Persistent settings with validation/migration/backup
- `src/main/secretStore.ts` - OS keychain storage via keytar
- `src/main/ipcHandlers/` - IPC handlers for STT, LLM, Settings
- `src/main/providers/` - Provider interfaces and implementations (STT, LLM)
- `src/preload/bridge.ts` - Type-safe IPC bridge with input validation
- `src/renderer/index.html` - Test UI for LLM/STT functionality

### Architecture

```
packages/
  ipc-contracts/     # Shared types, schemas, validators (Ajv, Vitest)
apps/
  studio-electron/   # Electron app with IPC handlers
docs/
  plans/             # Implementation plans
```

**Key patterns:**
- Monorepo with npm workspaces
- Strict TypeScript with ESM modules
- JSON Schema validation via Ajv
- IPC types define contract between Main ↔ Preload ↔ Renderer
- Secret refs (`secret:key_name`) for OS keychain storage via keytar
- Provider pattern for STT/LLM extensibility (mock implementations included)
- Settings migration with schema versioning and automatic backup
- Context isolation with `contextBridge` for security

### Test Coverage

15 passing tests across workspaces:
- `packages/ipc-contracts`: 8 tests (settings validation)
- `apps/studio-electron`: 7 tests (LLM provider IPC handlers)

---

## Independent Projects

### mcmodding-mcp-dev (Node.js/TypeScript)
MCP server providing AI assistants with Minecraft modding documentation for Fabric and NeoForge.

**Commands:**
```bash
cd mcmodding-mcp-dev
npm install
npm run dev          # Watch mode with hot reload
npm run build        # Build TypeScript
npm run test         # Run tests
npm run lint         # ESLint
npm run format       # Prettier formatting
npx mcmodding-mcp manage  # Database installer/updater
```

**Key architecture:** SQLite database with FTS5 + semantic embeddings for hybrid documentation search. Entry point is `src/index.ts`, tools in `src/tools/`, services in `src/services/`.

### kidmodstudio_exporter_kit (Node.js)
Exporter that generates Fabric mod projects from JSON project definitions.

**Commands:**
```bash
cd kidmodstudio_exporter_kit/exporter
npm install
node index.js --project ../project.example.json --template ./template --out ./out
```

Requires a Fabric template folder with gradle wrapper and base structure.

### Claude-Craft-main (Vanilla JS + Three.js)
Browser-based Minecraft mod creator with 3D block/item visualization.

**Commands:**
```bash
cd "Claude-Craft-main (2)/Claude-Craft-main"
npm start            # Start HTTP server on port 8080
# Open http://localhost:8080/index.html
```

Single-file architecture: `index.html` contains all code. Uses Three.js r128.

### mindcraft-develop (Node.js + Mineflayer)
LLM-powered Minecraft bot using Mineflayer for autonomous gameplay.

**Commands:**
```bash
cd "mindcraft-develop (1)/mindcraft-develop"
npm install
node main.js         # Start bot (requires Minecraft LAN on port 55916)
node main.js --profiles ./profiles/andy.json  # Specific profile
node main.js --task_path tasks/basic/single_agent.json --task_id gather_oak_logs  # Run task
```

**Configuration:** `keys.json` for API keys, `settings.js` for project settings, profiles (e.g., `andy.json`) for bot behavior.

**Security warning:** `allow_insecure_coding` in settings.js enables code execution. Use Docker for untrusted environments.

### Fabric-main (Go)
AI prompt framework ("fabric") for augmenting humans with AI patterns - not Minecraft Fabric mod loader.

**Commands:**
```bash
cd Fabric-main
go install github.com/danielmiessler/fabric/cmd/fabric@latest
fabric --setup       # Initial setup
fabric -p summarize  # Use pattern
fabric --serve       # REST API server
```

Uses Go modules. Patterns stored in `~/.config/fabric/patterns/`.

### Antura-main (Unity)
Educational language learning game (Unity 6.x project). Not directly Minecraft-related but included in collection.

**Commands:**
```bash
cd Antura-main
npm run docs:dev     # Preview docs locally (VitePress)
npm run docs:build   # Build docs
```

### Minecraft-Mod-Language-Package-main (C#/.NET)
Chinese localization resource packs for Minecraft mods.

**Build:** Uses .NET solution file `Minecraft-Mod-Language-Package.sln`. See `Packer-Doc.md` for packer documentation.

### gitlab-ci-pipelines-exporter-main (Go)
Prometheus exporter for GitLab CI pipelines. Not Minecraft-related but included in collection.

**Commands:**
```bash
cd gitlab-ci-pipelines-exporter-main
go run github.com/mvisonneau/gitlab-ci-pipelines-exporter/cmd/gitlab-ci-pipelines-exporter@latest
```

## Cross-Project Notes

- Most Node.js projects use npm, Node 18+ recommended
- Go projects require Go 1.21+
- No shared dependencies between projects
- Each project has its own README with detailed instructions
