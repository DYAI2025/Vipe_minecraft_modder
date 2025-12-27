# KidModStudio - Projekt-Dokumentation

> Letzte Aktualisierung: 2025-12-27, 14:40 Uhr

## Projektziel

**KidModStudio** ist eine kindgerechte Electron-App zum Erstellen von Minecraft-Mods mittels Sprache und LLM. Ein virtueller Assistent namens "Crafty" hilft Kindern beim Modding durch natürliche Konversation.

## Repository-Struktur

```
Minecraft-ModBuilder/
├── apps/
│   └── studio-electron/          # Electron-Hauptanwendung
├── packages/
│   ├── ipc-contracts/            # Typen, Schemas, Validatoren
│   └── voice-server/             # WebSocket-Server für Voice/Chat
├── docs/plans/                   # Implementierungspläne
├── .worktrees/
│   ├── feature-voice-chat/       # Voice-Chat Feature Branch
│   └── feature-baukasten/        # Baukasten Feature Branch
└── CLAUDE.md                     # Anweisungen für Claude Code
```

## Aktuelle Architektur

```
┌─────────────────────────────────────────────────────────────────┐
│                     Electron App (studio-electron)              │
├─────────────────────────────────────────────────────────────────┤
│  Main Process                                                   │
│  ├── index.ts          → Fenster, IPC-Handler                   │
│  ├── voiceServer.ts    → Spawnt voice-server als Child-Prozess  │
│  ├── settingsStore.ts  → Persistente Einstellungen              │
│  └── secretStore.ts    → OS Keychain (keytar)                   │
├─────────────────────────────────────────────────────────────────┤
│  Preload (bridge.ts → bridge.cjs)                               │
│  └── contextBridge für sichere IPC-Kommunikation                │
├─────────────────────────────────────────────────────────────────┤
│  Renderer                                                       │
│  ├── index.html        → Hauptseite mit Chat-Panel              │
│  ├── app.js            → App-Initialisierung                    │
│  ├── chatPanel.js      → WebSocket-Chat + Browser TTS/STT       │
│  ├── craftyBrain.js    → LLM-Logik (Ollama)                     │
│  └── voiceController.js→ Voice-Input-Steuerung                  │
└─────────────────────────────────────────────────────────────────┘
        │
        │ WebSocket (ws://127.0.0.1:3847)
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Voice Server (voice-server)                 │
├─────────────────────────────────────────────────────────────────┤
│  Fastify + WebSocket                                            │
│  ├── /chat             → Text-Chat mit Ollama-Streaming         │
│  └── /voice            → STT/TTS Pipeline                       │
├─────────────────────────────────────────────────────────────────┤
│  Services                                                       │
│  ├── ollama.ts         → LLM-Anbindung (llama3.2)               │
│  ├── whisper.ts        → STT via whisper.cpp                    │
│  ├── piper.ts          → TTS via Piper (nicht aktiv)            │
│  └── espeak.ts         → TTS via System-espeak (aktiv)          │
└─────────────────────────────────────────────────────────────────┘
```

## Was funktioniert (Stand: 27.12.2025)

### Vollständig implementiert
- [x] Monorepo-Struktur mit npm workspaces
- [x] `@kidmodstudio/ipc-contracts` mit Typen und JSON-Schema-Validierung
- [x] `@kidmodstudio/voice-server` mit Fastify WebSocket
- [x] Ollama-Integration mit Streaming-Responses
- [x] Whisper STT-Service (whisper.cpp)
- [x] Espeak TTS-Service für Server-seitige Sprachausgabe
- [x] Chat-WebSocket-Route mit Text-Streaming
- [x] Electron Main/Preload/Renderer Separation
- [x] Voice-Server Auto-Start aus Electron Main
- [x] ChatPanel mit WebSocket-Verbindung
- [x] Browser SpeechRecognition für STT im Renderer
- [x] Preload-Script ESM/CJS Kompatibilität (tsconfig.preload.json)
- [x] CSP für WebSocket und data: URIs

### Teilweise funktionsfähig
- [~] Text-Chat funktioniert, aber LLM-Schema-Validierung schlägt manchmal fehl
- [~] espeak TTS spricht Willkommensnachricht, LLM-Antworten sollten auch gesprochen werden
- [~] Browser speechSynthesis funktioniert NICHT in Electron (SpeechSynthesisErrorEvent)

### Noch nicht implementiert
- [ ] Piper TTS (thorsten-high Modell) - Code existiert, aber nicht aktiviert
- [ ] Vollständige Voice-Pipeline (/voice Endpoint) - Routen existieren
- [ ] Settings-UI im Renderer
- [ ] Mod-Export-Funktionalität (Baukasten-Feature)

## Bekannte Probleme

### 1. LLM Schema-Validierung
```
Schema validation failed: must have required property 'response'; must have required property 'emotion'
```
**Ursache:** Das LLM (llama3.2) gibt nicht immer das erwartete JSON-Format zurück.
**Lösung:** System-Prompt anpassen oder Response-Parsing robuster machen.
**Datei:** `apps/studio-electron/src/renderer/craftyBrain.js`

### 2. Browser TTS in Electron
```
[ChatPanel] TTS voice: undefined
[ChatPanel] TTS error: SpeechSynthesisErrorEvent
```
**Ursache:** `speechSynthesis` API funktioniert nicht zuverlässig in Electron.
**Lösung:** Espeak über IPC nutzen statt Browser-API.
**Dateien:**
- `apps/studio-electron/src/renderer/components/chatPanel.js`
- `packages/voice-server/src/routes/chat.ts` (espeak bereits integriert)

### 3. Port-Konflikte beim Entwickeln
Mehrere Dev-Instanzen können Port 3847 blockieren.
**Lösung:** Vor `npm run dev`:
```bash
fuser -k 3847/tcp 2>/dev/null || true
```

### 4. Settings TTS-Provider Validation
```
Failed to update settings: Invalid settings update: /tts/providerConfig must match exactly one schema in oneOf
```
**Ursache:** TTS-Provider-Konfiguration passt nicht zum Schema.
**Datei:** `packages/ipc-contracts/src/schemas/settings.schema.json`

## Wichtige Konfigurationsdateien

### apps/studio-electron/tsconfig.preload.json
```json
{
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "Node",
    "outDir": "./dist/preload"
  }
}
```
**Wichtig:** Preload-Script muss als CommonJS kompiliert und zu `.cjs` umbenannt werden!

### Build-Script (package.json)
```json
"build": "tsc && tsc -p tsconfig.preload.json && mv dist/preload/bridge.js dist/preload/bridge.cjs && npm run copy-assets"
```

## Entwicklungs-Workflow

### Starten der Anwendung
```bash
cd .worktrees/feature-voice-chat/apps/studio-electron
npm run dev
```

### Voraussetzungen
1. **Ollama** muss laufen: `ollama serve`
2. **llama3.2** Modell: `ollama pull llama3.2`
3. **espeak** installiert: `sudo apt install espeak`
4. **whisper.cpp** (optional für Voice): Kompiliert in `/opt/whisper.cpp`

### Tests ausführen
```bash
npm test                    # Alle Tests
npm run test -w voice-server # Nur voice-server Tests
```

## Nächste Schritte (Priorisiert)

### Priorität 1: LLM-Antworten reparieren
1. `craftyBrain.js` System-Prompt anpassen für stabiles JSON-Output
2. Fallback-Parsing wenn JSON-Schema nicht matched
3. `chat.ts` - Sicherstellen dass espeak alle Antworten spricht

### Priorität 2: Voice-Pipeline vervollständigen
1. `/voice` WebSocket-Endpoint testen
2. Whisper STT mit Mikrofon-Input verbinden
3. Piper TTS aktivieren (bessere Qualität als espeak)

### Priorität 3: UI-Verbesserungen
1. Crafty-Feedback-Element animieren
2. Lade-Indikator während LLM-Streaming
3. Fehler-Handling im UI anzeigen

### Priorität 4: Baukasten-Feature
Siehe Plan: `docs/plans/2025-12-27-baukasten-crafting-export.md`

## Hilfreiche Befehle

```bash
# Port freigeben
fuser -k 3847/tcp

# Alle Node-Prozesse killen
pkill -9 node

# Voice-Server standalone testen
cd packages/voice-server && npm run dev

# Electron mit DevTools starten
# In apps/studio-electron/src/main/index.ts:
# mainWindow.webContents.openDevTools();

# Git Worktrees anzeigen
git worktree list
```

## Commit-Historie (Relevante)

| Commit | Beschreibung |
|--------|--------------|
| `589104c5b` | feat(voice): add espeak TTS and browser STT support |
| `0b38afddf` | test: add voice-server integration tests |
| `7f5672840` | feat(electron): auto-start voice server from main process |
| `0695b782f` | feat(studio): integrate chat panel into layout |
| `52afc4373` | feat: add chat panel component and styles |
| `709f6078a` | feat: add Whisper STT to voice pipeline |

## Kontakt mit Crafty (Demo-Dialog)

**Aktueller Willkommens-Text:**
> "Hallo! Ich bin Crafty! Was bauen wir heute?"

**Erwartetes Verhalten:**
1. App startet → Willkommensnachricht wird gesprochen (espeak)
2. User tippt/spricht → WebSocket sendet an voice-server
3. Ollama generiert Antwort → Streaming an Client
4. Antwort wird angezeigt UND gesprochen

## Für den nächsten AI-Agenten

1. **Lies zuerst:** `CLAUDE.md` für Repository-Anweisungen
2. **Arbeite im Worktree:** `.worktrees/feature-voice-chat/`
3. **Teste mit:** `npm run dev` in `apps/studio-electron/`
4. **Logs prüfen:** Console zeigt `[Chat]`, `[VoiceServer]`, `[TTS]` Prefixe
5. **Bei Port-Problemen:** Siehe "Bekannte Probleme" oben

---

*Dieses Dokument wurde erstellt, um die Kontinuität der Entwicklung zu gewährleisten.*
