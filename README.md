# KidModStudio

[![CI](https://github.com/YOUR_USERNAME/Minecraft-ModBuilder/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/Minecraft-ModBuilder/actions/workflows/ci.yml)

> Kindgerechte Electron-App zum Erstellen von Minecraft-Mods via Sprache und LLM

**Crafty** ist ein virtueller Assistent, der Kindern (10-14 Jahre) beim Modding durch natürliche Konversation hilft.

## Architektur

```
┌─────────────────────────────────────────────────────────────────┐
│                     Electron App (studio-electron)              │
├─────────────────────────────────────────────────────────────────┤
│  Main Process      │  Preload (bridge.cjs)  │  Renderer         │
│  ├── index.ts      │  └── contextBridge     │  ├── chatPanel.js │
│  ├── settingsStore │                        │  ├── craftyBrain  │
│  └── voiceServer   │                        │  └── voiceControl │
└─────────────────────────────────────────────────────────────────┘
         │
         │ WebSocket (ws://127.0.0.1:3847)
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Voice Server (voice-server)                 │
│  Fastify + WebSocket                                            │
│  ├── /chat    → Text-Chat mit Ollama-Streaming                  │
│  └── /voice   → STT (Whisper) / TTS (espeak/Piper)              │
└─────────────────────────────────────────────────────────────────┘
```

## Voraussetzungen

- **Node.js** 20.x oder höher
- **npm** 9.x oder höher
- **Ollama** mit `llama3.2` Modell: `ollama pull llama3.2`
- **espeak** für TTS: `sudo apt install espeak`
- *(optional)* **whisper.cpp** für STT

## Installation

```bash
# Repository klonen
git clone https://github.com/YOUR_USERNAME/Minecraft-ModBuilder.git
cd Minecraft-ModBuilder

# Abhängigkeiten installieren
npm install

# Alle Packages bauen
npm run build
```

## Entwicklung

```bash
# Ollama starten (separates Terminal)
ollama serve

# Electron-App starten
cd apps/studio-electron
npm run dev
```

### Port-Konflikte beheben

```bash
# Port 3847 freigeben falls blockiert
fuser -k 3847/tcp 2>/dev/null || true
```

## Packages

| Package | Beschreibung |
|---------|--------------|
| `@kidmodstudio/ipc-contracts` | IPC-Typen, JSON-Schemas, Validatoren (Ajv) |
| `@kidmodstudio/voice-server` | Fastify WebSocket für Voice/Chat-Pipeline |
| `@kidmodstudio/studio-electron` | Electron-App mit Main/Preload/Renderer |

## Tests

```bash
# Alle Tests ausführen
npm test

# Einzelne Packages testen
npm test -w @kidmodstudio/ipc-contracts
npm test -w @kidmodstudio/voice-server
npm test -w @kidmodstudio/studio-electron

# Watch-Modus
npm run test:watch -w @kidmodstudio/ipc-contracts
```

## Projektstruktur

```
Minecraft-ModBuilder/
├── apps/
│   └── studio-electron/      # Electron-Hauptanwendung
├── packages/
│   ├── ipc-contracts/        # Typen, Schemas, Validatoren
│   └── voice-server/         # WebSocket-Server für Voice/Chat
├── docs/plans/               # Implementierungspläne
├── CLAUDE.md                 # Anweisungen für Claude Code
└── projekt.md                # Detaillierte Projektdokumentation
```

## CI/CD

GitHub Actions führt bei jedem Push/PR automatisch aus:

- `npm install`
- `npm run build`
- `npm test`

## Lizenz

Privat - Alle Rechte vorbehalten
