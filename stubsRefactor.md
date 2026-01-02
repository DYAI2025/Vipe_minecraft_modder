# Stubs & Mockups Refactoring Plan
**Datum:** 2026-01-02
**Repository:** Vipe_minecraft_modder / KidModStudio
**Branch:** claude/analyze-stubs-refactor-KL3v6

---

## Inhaltsverzeichnis
1. [Executive Summary](#executive-summary)
2. [Identifizierte Stubs & Platzhalter](#identifizierte-stubs--platzhalter)
3. [Ersetzungsstrategie](#ersetzungsstrategie)
4. [Sanftes Refactoring](#sanftes-refactoring)
5. [Implementierungsplan](#implementierungsplan)
6. [Risikobewertung](#risikobewertung)

---

## Executive Summary

### Gesamtzustand
Das KidModStudio-Projekt befindet sich in aktiver Entwicklung mit **funktionsfähiger Architektur**, aber mehreren **kritischen Platzhaltern**, die eine Produktiv-Nutzung verhindern.

### Kritische Blocker (MUSS behoben werden)
1. **EchoSttProvider** (Mock STT) - Alle Spracherkennung funktioniert nicht
2. **Hardcoded Workspace Path** - App läuft nur auf Entwickler-Maschine
3. **Hardcoded Template Path** - Export funktioniert nicht in Production

### Prioritäten-Matrix

| Priorität | Komponente | Impact | Aufwand | Risiko |
|-----------|------------|--------|---------|--------|
| 🔴 CRITICAL | Workspace-Pfad | 10/10 | Niedrig | Niedrig |
| 🔴 CRITICAL | Template-Pfad | 10/10 | Mittel | Niedrig |
| 🔴 CRITICAL | EchoSttProvider | 9/10 | Hoch | Mittel |
| 🟡 HIGH | DevTools Production | 7/10 | Niedrig | Niedrig |
| 🟡 HIGH | Sandbox Disabled | 6/10 | Hoch | Hoch |
| 🟢 MEDIUM | Texture Placeholder | 5/10 | Mittel | Niedrig |
| 🟢 MEDIUM | Preset Texture Handling | 4/10 | Mittel | Niedrig |
| ⚪ LOW | Tutorial UI | 2/10 | Mittel | Niedrig |

---

## Identifizierte Stubs & Platzhalter

### 1. KRITISCH: Mock Provider (Production-Blocker)

#### 1.1 EchoSttProvider - Speech-to-Text Mock
**Datei:** `apps/studio-electron/src/main/providers/echoSttProvider.ts`
**Status:** ✅ AKTIV IN PRODUCTION
**Verwendung:** `apps/studio-electron/src/main/ipcHandlers/stt.ts:67`

**Problem:**
```typescript
export class EchoSttProvider implements SttProvider {
  readonly providerId: SttProviderId = "livekit"; // Gibt vor, LiveKit zu sein

  async stop(): Promise<string> {
    const transcript = "Hallo, ich bin ein Test"; // Hardcoded!
    return transcript;
  }
}
```

**Impact:**
- Alle STT-Funktionalität gibt nur "Hallo, ich bin ein Test" zurück
- Keine echte Spracherkennung möglich
- Kinder können nicht mit der App sprechen

**Betroffene Features:**
- Voice Recording (`app.js:191-204`)
- Voice Processing (`app.js:218-246`)
- Crafty Brain Integration
- Gesamte Sprachsteuerung

---

#### 1.2 MockLlmProvider - Language Model Mock
**Datei:** `apps/studio-electron/src/main/providers/mockLlmProvider.ts`
**Status:** ⚪ NUR IN TESTS
**Verwendung:** `apps/studio-electron/src/main/ipcHandlers/llm.test.ts:2`

**Problem:**
```typescript
export class MockLlmProvider implements LlmProvider {
  async complete(messages: LlmMessage[]): Promise<string> {
    // Return a mock JSON response
    return JSON.stringify({
      action: "create_block",
      blockId: "custom_block",
      properties: { hardness: 1.5, resistance: 6.0 }
    });
  }
}
```

**Impact:**
- ✅ Korrekt isoliert in Tests
- ❌ ABER: Könnte versehentlich in Production verwendet werden
- Schema-Generator wird nirgends produktiv genutzt

**Empfehlung:** Beibehalten für Tests, aber mit klarem Naming

---

### 2. KRITISCH: Hardcoded Pfade (Distribution-Blocker)

#### 2.1 Workspace Directory
**Datei:** `apps/studio-electron/src/renderer/app.js:341`
**Status:** ✅ AKTIV IN PRODUCTION

```javascript
// Using a default workspace for now
const workspaceDir = '/home/dyai/Dokumente/Pers.Tests-Page/social-role/DYAI_home/DEV/TOOLS/Minecraft-ModBuilder/workspace';
```

**Impact:**
- App funktioniert NICHT auf anderen Maschinen
- Export schlägt fehl mit "Directory not found"
- Kann nicht verteilt werden

**Betroffene Funktionen:**
- Mod Export (`app.js:306-361`)
- Projekt-Speicherung
- Build-Pipeline

---

#### 2.2 Template Directory
**Datei:** `apps/studio-electron/src/main/ipcHandlers/exporter.ts:17`
**Status:** ✅ AKTIV IN PRODUCTION

```typescript
// For now, template is relative to the app or in a fixed location
// In a real app, this might be bundled or downloaded.
const templateDir = path.join(process.cwd(), 'kidmodstudio_exporter_kit/template');
```

**Impact:**
- Template nicht gefunden in gepackter App
- Export funktioniert nur in Development
- `process.cwd()` zeigt in Production auf falsches Verzeichnis

**Korrekte Lösung:**
- Template in `app.asar` bundeln
- Oder: `app.getAppPath()` + `extraResources` verwenden

---

### 3. HIGH: Entwicklungs-Code in Production

#### 3.1 DevTools automatisch geöffnet
**Datei:** `apps/studio-electron/src/main/index.ts:57`
**Status:** ✅ AKTIV

```typescript
// Open DevTools for debugging
mainWindow.webContents.openDevTools();
```

**Impact:**
- Schlechte User Experience (Developer Console öffnet immer)
- Potentielles Sicherheitsrisiko (Nutzer sieht interne Daten)
- Unprofessionell

**Fix:** Conditional basierend auf `app.isPackaged` oder Environment-Variable

---

#### 3.2 Sandbox Disabled
**Datei:** `apps/studio-electron/src/main/index.ts:38`
**Status:** ✅ AKTIV

```typescript
webPreferences: {
  sandbox: false, // Disabled for ESM preload support
}
```

**Impact:**
- Reduzierte Sicherheit (Renderer-Prozess hat mehr Zugriff)
- Sicherheitslücke bei XSS-Angriffen
- Nicht Best Practice

**Notwendigkeit:** Aktuell für ESM preload nötig
**Alternative:** Migration zu CommonJS preload oder Electron-Update abwarten

---

### 4. MEDIUM: Funktionale Platzhalter

#### 4.1 Texture Placeholder
**Datei:** `apps/studio-electron/src/renderer/app.js:334`

```javascript
texture: { source: 'preset', value: 'rock' } // placeholder, ideally dataUri
```

**Impact:**
- Blocks verwenden immer 'rock' Textur
- Keine custom Texturen möglich
- Eingeschränkte Kreativität

**Betroffene Funktion:** Block-Export, Mod-Generierung

---

#### 4.2 Preset Texture Handling
**Datei:** `packages/exporter/src/generators/assets.ts:27-29`

```typescript
// presets usually handled by copying from a known library,
// but for now we assume they are already there or handled elsewhere.
```

**Impact:**
- Preset-Texturen werden nicht kopiert
- User muss manuell Texturen bereitstellen
- Fehlende Assets im Export

---

### 5. LOW: Unimplementierte Features

#### 5.1 Tutorial UI
**Datei:** `apps/studio-electron/src/renderer/app.js:235`

```javascript
if (result.suggestedAction === 'show_tutorial') {
  // TODO: Show tutorial UI
}
```

**Impact:** Feature-Request vom LLM wird ignoriert
**Priorität:** Niedrig (Nice-to-have)

#### 5.2 Sitemap Parsing
**Datei:** `mcmodding-mcp-dev/src/indexer/crawler.ts:774`

```typescript
// TODO: Implement sitemap parsing or recursive discovery
```

**Impact:** Limitierte Dokumentations-Crawler
**Priorität:** Niedrig (funktioniert mit manueller Liste)

---

## Ersetzungsstrategie

### Phase 1: Quick Wins (1-2 Tage)
**Ziel:** Distribution-fähig machen

#### 1.1 Workspace-Pfad dynamisch machen
**Priorität:** 🔴 CRITICAL
**Aufwand:** 2-4 Stunden
**Risiko:** Niedrig

**Implementierung:**
```typescript
// Option A: User beim ersten Start fragen
async function selectWorkspace(): Promise<string> {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory'],
    title: 'Wähle deinen Minecraft Mod Workspace'
  });
  if (result.filePaths.length > 0) {
    await settingsStore.update({ workspace: result.filePaths[0] });
    return result.filePaths[0];
  }
  // Fallback: OS-spezifischer Default
  return path.join(app.getPath('documents'), 'KidModStudio');
}

// Option B: Default + Settings UI
const defaultWorkspace = path.join(app.getPath('documents'), 'KidModStudio', 'workspace');
```

**Änderungen:**
1. `app.js:341` - Pfad aus Settings laden
2. Settings UI erweitern um Workspace-Auswahl
3. Default-Workspace beim ersten Start erstellen

---

#### 1.2 Template-Pfad für Production
**Priorität:** 🔴 CRITICAL
**Aufwand:** 2-3 Stunden
**Risiko:** Niedrig

**Implementierung:**
```typescript
// exporter.ts
import { app } from 'electron';

const templateDir = app.isPackaged
  ? path.join(process.resourcesPath, 'templates', 'fabric')
  : path.join(process.cwd(), 'kidmodstudio_exporter_kit', 'template');
```

**Build-Config (electron-builder):**
```json
{
  "extraResources": [
    {
      "from": "kidmodstudio_exporter_kit/template",
      "to": "templates/fabric"
    }
  ]
}
```

**Änderungen:**
1. `exporter.ts:17` - Pfadlogik anpassen
2. `electron-builder` Config erweitern
3. Testen in gepackter App

---

#### 1.3 DevTools Conditional
**Priorität:** 🟡 HIGH
**Aufwand:** 10 Minuten
**Risiko:** Keine

**Implementierung:**
```typescript
// index.ts:57
if (!app.isPackaged || process.env.DEBUG) {
  mainWindow.webContents.openDevTools();
}
```

---

### Phase 2: STT Provider Replacement (3-5 Tage)
**Ziel:** Echte Spracherkennung

#### 2.1 Strategie-Optionen

**Option A: WebSpeech API Integration (Browser-basiert)**
- ✅ Keine externe API nötig
- ✅ Kostenlos
- ✅ Schnelle Implementation
- ❌ Nur in Chromium verfügbar
- ❌ Begrenzte Kontrolle
- **Aufwand:** 1-2 Tage
- **Empfehlung:** ⭐ BESTE WAHL für Quick Start

**Option B: LiveKit Integration (Cloud/Self-hosted)**
- ✅ Provider-ID "livekit" bereits im Code
- ✅ Professionelle Lösung
- ✅ Skalierbar
- ❌ Komplexe Setup
- ❌ Kosten (oder Self-hosting nötig)
- **Aufwand:** 3-5 Tage
- **Empfehlung:** Für Production-Grade

**Option C: Whisper.cpp (Lokal)**
- ✅ Offline-fähig
- ✅ Datenschutz (keine Cloud)
- ✅ Kostenlos
- ❌ Hohe CPU-Last
- ❌ Komplexe Integration
- **Aufwand:** 4-7 Tage
- **Empfehlung:** Für Privacy-First Ansatz

**Option D: Hybrid (Voice Service vorhanden!)**
- ℹ️ `voiceService.ts` startet bereits Python Server
- ℹ️ `voice-server` Prozess läuft in Background
- ✅ Infrastructure vorhanden
- 🔍 **PRÜFEN:** Ist dort bereits STT implementiert?
- **Aufwand:** 0-2 Tage (wenn bereits vorhanden)
- **Empfehlung:** ⭐⭐ ZUERST PRÜFEN!

---

#### 2.2 Implementierung WebSpeech (Empfohlen für Start)

**Neue Datei:** `apps/studio-electron/src/main/providers/webSpeechSttProvider.ts`

```typescript
import type { SttProvider } from "./sttProvider.js";
import type { SttStreamEvent, SttProviderId } from "@kidmodstudio/ipc-contracts";

export class WebSpeechSttProvider implements SttProvider {
  readonly providerId: SttProviderId = "webspeech";
  private eventHandler?: (event: Omit<SttStreamEvent, "streamId">) => void;
  private recognizer?: any; // SpeechRecognition API via renderer

  async start(): Promise<void> {
    this.emit({ type: "state", state: "ready", tMs: Date.now() });
    this.emit({ type: "state", state: "listening", tMs: Date.now() });

    // Signal renderer to start WebSpeech
    // (STT muss im Renderer laufen, da Browser API)
  }

  pushChunk(chunk: Uint8Array, chunkIndex: number): void {
    // WebSpeech braucht keine Chunks - läuft direkt im Browser
  }

  async stop(): Promise<string> {
    // Get final transcript from renderer
    return this.finalTranscript;
  }

  // ... rest der Implementation
}
```

**WICHTIG:** WebSpeech API läuft im Renderer-Prozess, nicht im Main-Prozess!

**Alternative Architektur:**
1. STT bleibt im Renderer (`app.js` hat bereits `voiceController`)
2. Main-Process nur für Settings/Coordination
3. IPC nur für Events, nicht für Audio-Streaming

**PRÜFEN:** `app.js:191-204` nutzt bereits `window.voiceController.startRecording()`
- Möglicherweise ist WebSpeech bereits implementiert?
- Voice Service könnte bereits funktionieren?

---

### Phase 3: Texture System (2-3 Tage)
**Ziel:** Custom Texturen ermöglichen

#### 3.1 Texture Upload UI
```javascript
// app.js - neue Funktion
async function uploadTexture() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/png';

  input.onchange = async (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUri = ev.target.result;
      currentBlock.texture = { source: 'dataUri', value: dataUri };
    };
    reader.readAsDataURL(file);
  };

  input.click();
}
```

#### 3.2 Preset Texture Library
```typescript
// packages/exporter/src/generators/assets.ts
const PRESET_TEXTURES = {
  rock: 'data:image/png;base64,...',
  dirt: 'data:image/png;base64,...',
  // ... more presets
};

function handlePresetTexture(preset: string, outputDir: string) {
  const textureData = PRESET_TEXTURES[preset];
  if (!textureData) {
    throw new Error(`Unknown preset: ${preset}`);
  }
  const buffer = Buffer.from(textureData.split(',')[1], 'base64');
  fs.writeFileSync(path.join(outputDir, `${preset}.png`), buffer);
}
```

---

### Phase 4: Security Hardening (2-4 Tage)
**Ziel:** Production-ready Security

#### 4.1 Sandbox Re-enabling (Komplex!)
**Problem:** ESM preload benötigt `sandbox: false`

**Lösung A: CommonJS Preload**
```typescript
// Konvertiere preload/bridge.ts zu .cjs
// Nutze require() statt import
// ODER: Bundle mit esbuild
```

**Lösung B: Electron Update**
- Prüfe ob neuere Electron-Version ESM + Sandbox unterstützt
- Aktuell: Electron Version prüfen

**Lösung C: Context Isolation + IPC strengthening**
```typescript
webPreferences: {
  sandbox: true,  // Re-enable
  contextIsolation: true,
  nodeIntegration: false,
  nodeIntegrationInWorker: false,
  enableRemoteModule: false,
  webSecurity: true,
}
```

**Aufwand:** 2-4 Tage
**Risiko:** Hoch (kann andere Features brechen)
**Empfehlung:** Nach Phase 1-3, mit ausgiebigen Tests

---

## Sanftes Refactoring

### Prinzipien für risikoarmes Refactoring

#### 1. Strangler Fig Pattern
**Idee:** Neue Implementation parallel zur alten laufen lassen

```typescript
// stt.ts
const USE_NEW_STT = process.env.USE_NEW_STT === 'true';

const provider = USE_NEW_STT
  ? new WebSpeechSttProvider()
  : new EchoSttProvider();
```

**Vorteile:**
- Rollback jederzeit möglich
- A/B Testing möglich
- Schrittweise Migration

---

#### 2. Interface-First Development
**Idee:** Interface bleibt stabil, Implementation variabel

```typescript
// Bestehende Interfaces NICHT ändern:
// - SttProvider
// - LlmProvider
// - Exporter Contracts

// Neue Implementierungen schreiben die Interface erfüllen
```

**Vorteile:**
- Bestehender Code läuft weiter
- Austauschbar ohne Breaking Changes
- Testbar

---

#### 3. Feature Flags
**Idee:** Neue Features hinter Flags verstecken

```typescript
// settingsStore
interface Settings {
  features: {
    newSttProvider: boolean;
    customTextures: boolean;
    tutorialUI: boolean;
  }
}

// Nur aktivieren wenn User opt-in
if (settings.features.newSttProvider) {
  // use new provider
}
```

---

#### 4. Incremental Testing
**Idee:** Jeden Schritt testen bevor nächster

```bash
# Nach jeder Änderung:
npm test                    # Unit tests
npm run build              # Build successful?
npm run dev                # Manual smoke test
```

---

#### 5. Backup & Rollback Strategy

```bash
# Vor jedem Refactoring:
git checkout -b refactor/stt-provider-webspeech
git push -u origin refactor/stt-provider-webspeech

# Bei Problemen:
git checkout claude/analyze-stubs-refactor-KL3v6
```

---

### Refactoring-Reihenfolge (Risiko-optimiert)

1. **DevTools Conditional** (5 min, kein Risiko)
2. **Workspace Path** (2h, niedriges Risiko)
3. **Template Path** (3h, niedriges Risiko)
4. **Texture Placeholder** (1 Tag, mittleres Risiko)
5. **STT Provider** (3-5 Tage, hohes Risiko)
6. **Sandbox** (2-4 Tage, sehr hohes Risiko)

---

## Implementierungsplan

### Sprint 1: Distribution-Ready (2-3 Tage)

**Ziel:** App kann auf anderen Maschinen laufen

#### Tag 1: Pfad-Fixes
- [ ] **Morning:** Workspace-Pfad dynamisch
  - Settings-Integration
  - Default-Pfad Logik
  - First-Run Dialog
- [ ] **Afternoon:** Template-Pfad Production
  - Pfad-Conditional
  - electron-builder Config
  - Test in packaged App

#### Tag 2: Polish & Testing
- [ ] **Morning:** DevTools Conditional
- [ ] **Afternoon:** Integration Tests
  - Export auf sauberem System
  - Settings Persistence
  - Path Resolution

#### Tag 3: Dokumentation & Release
- [ ] User Guide: Workspace Setup
- [ ] Developer Docs: Build Process
- [ ] Release Notes

**Deliverable:** v0.1.0-alpha - "First Distribution"

---

### Sprint 2: Voice Reality (5-7 Tage)

**Ziel:** Echte Spracherkennung

#### Pre-Work: Voice Service Audit
- [ ] Analysiere `voiceService.ts` und Python Server
- [ ] Prüfe ob STT bereits implementiert ist
- [ ] Entscheide: Nutzen oder neu bauen?

#### Implementierung (abhängig von Audit)

**Szenario A: Voice Service hat STT**
- [ ] Integration mit bestehendem Service
- [ ] EchoSttProvider durch Bridge ersetzen
- [ ] Testing

**Szenario B: WebSpeech neu implementieren**
- [ ] Renderer-seitige SpeechRecognition API
- [ ] IPC Event Bridge
- [ ] Fallback für unsupported Browsers

#### Testing
- [ ] Unit Tests
- [ ] Integration Tests
- [ ] User Acceptance Testing (mit Kindern!)

**Deliverable:** v0.2.0-alpha - "Voice Works"

---

### Sprint 3: Creative Freedom (3-4 Tage)

**Ziel:** Custom Texturen

#### Tag 1-2: Texture Upload
- [ ] UI für Texture Upload
- [ ] DataURI Handling
- [ ] Preview System

#### Tag 3: Preset Library
- [ ] Preset Texture Collection
- [ ] Asset Generator Implementation
- [ ] Testing

#### Tag 4: Polish
- [ ] Texture Browser UI
- [ ] Dokumentation

**Deliverable:** v0.3.0-beta - "Creative Update"

---

### Sprint 4: Security & Stability (4-5 Tage)

**Ziel:** Production-Grade Security

#### Research Phase
- [ ] Electron Version Check
- [ ] ESM + Sandbox Compatibility
- [ ] Alternative Preload Strategies

#### Implementation
- [ ] Sandbox Re-enabling
- [ ] Security Audit
- [ ] Penetration Testing

#### Stabilization
- [ ] Bug Fixes
- [ ] Performance Optimization
- [ ] Error Handling

**Deliverable:** v1.0.0-rc1 - "Production Candidate"

---

## Risikobewertung

### Risiko-Matrix

| Komponente | Technisches Risiko | Business Risiko | Mitigation |
|------------|-------------------|-----------------|------------|
| Workspace Path | 🟢 Niedrig | 🔴 Kritisch | User Testing, Defaults |
| Template Path | 🟢 Niedrig | 🔴 Kritisch | Package Testing |
| DevTools | 🟢 Keine | 🟡 Medium | Conditional Logic |
| STT Provider | 🟡 Mittel | 🔴 Kritisch | Parallel Implementation, Fallback |
| Sandbox | 🔴 Hoch | 🟡 Medium | Ausgiebige Tests, Staged Rollout |
| Textures | 🟡 Mittel | 🟢 Niedrig | Incremental Features |

---

### Technische Risiken

#### Risiko 1: STT Provider Breaking Changes
**Wahrscheinlichkeit:** Mittel
**Impact:** Hoch
**Symptome:** Keine Spracherkennung, IPC Errors

**Mitigation:**
- Strangler Fig Pattern (beide Provider parallel)
- Ausgiebige Tests mit echten Benutzern
- Rollback-Plan (Feature Flag)

**Rollback:**
```typescript
// Quick disable in production
const FORCE_ECHO_STT = true;
const provider = FORCE_ECHO_STT ? new EchoSttProvider() : createRealProvider();
```

---

#### Risiko 2: Sandbox Breaking App
**Wahrscheinlichkeit:** Hoch
**Impact:** Kritisch
**Symptome:** App startet nicht, White Screen

**Mitigation:**
- Separater Branch für Sandbox-Experimente
- VM Testing vor Main-Branch Merge
- ESM → CJS Bundling als Alternative

**Rollback:**
```typescript
sandbox: false, // TEMPORARY: See issue #123
```

---

#### Risiko 3: Template nicht gefunden in Production
**Wahrscheinlichkeit:** Mittel (wenn falsch konfiguriert)
**Impact:** Kritisch
**Symptome:** Export schlägt fehl

**Mitigation:**
- Explicit Path Testing in packaged app
- Fallback zu Download-Template
- Clear Error Messages

**Fallback:**
```typescript
if (!fs.existsSync(templateDir)) {
  // Offer to download template
  const downloadUrl = 'https://github.com/.../template.zip';
  await downloadAndExtractTemplate(downloadUrl);
}
```

---

### Business Risiken

#### Risiko 1: Verzögerung durch Scope Creep
**Mitigation:**
- Strict Sprint Planning
- MVP-First Approach
- Feature Freeze vor Release

#### Risiko 2: User Experience Regression
**Mitigation:**
- Beta Testing mit echten Nutzern
- Feedback Loop
- A/B Testing wichtiger Features

---

## Testing Strategy

### Test-Pyramide

```
           /\
          /E2E\         <- 5% (Integration Tests)
         /------\
        /  API   \      <- 15% (IPC Handler Tests)
       /----------\
      /   Unit     \    <- 80% (Provider, Logic Tests)
     /--------------\
```

---

### Unit Tests (80%)

**Neue Tests erforderlich:**

```typescript
// webSpeechSttProvider.test.ts
describe('WebSpeechSttProvider', () => {
  it('should emit listening state on start', async () => {
    const provider = new WebSpeechSttProvider();
    const events: SttStreamEvent[] = [];
    provider.onEvent(e => events.push(e));

    await provider.start();

    expect(events).toContainEqual({
      type: 'state',
      state: 'listening'
    });
  });

  it('should return transcript on stop', async () => {
    // ... test implementation
  });
});
```

**Coverage-Ziel:** >80% für alle Provider

---

### Integration Tests (15%)

```typescript
// stt.integration.test.ts
describe('STT IPC Integration', () => {
  it('should start stream and receive events', async () => {
    const streamId = 'test-' + Date.now();
    const response = await ipcRenderer.invoke('stt:streamStart', { streamId });

    expect(response.ok).toBe(true);
    expect(response.provider).toBe('webspeech');
  });
});
```

---

### E2E Tests (5%)

**Manual Test Scenarios:**

1. **Happy Path: Mod Creation**
   - [ ] Starte App
   - [ ] Wähle Workspace
   - [ ] Drag Block in Grid
   - [ ] Click "Erstellen"
   - [ ] Verify Export Success

2. **Voice Path:**
   - [ ] Click Microphone
   - [ ] Spreche "Ich möchte einen Diamant Block"
   - [ ] Verify Transcript
   - [ ] Verify Crafty Response

3. **Settings Path:**
   - [ ] Öffne Settings
   - [ ] Change Workspace
   - [ ] Save
   - [ ] Restart App
   - [ ] Verify Settings Persisted

---

## Metriken & Success Criteria

### Phase 1 Success Criteria
- [ ] App läuft auf 3 verschiedenen Maschinen (Win, Mac, Linux)
- [ ] Export funktioniert ohne hardcoded Paths
- [ ] DevTools nicht in Production Build
- [ ] Settings persistieren über Restarts

### Phase 2 Success Criteria
- [ ] 5 Kinder können erfolgreich Sprachbefehle geben
- [ ] Transcript Accuracy >80% (Deutsch)
- [ ] <500ms Latenz für STT Start
- [ ] Keine Crashes bei Voice Input

### Phase 3 Success Criteria
- [ ] Custom Texture Upload funktioniert
- [ ] 10 Preset Texturen verfügbar
- [ ] Texture Preview in UI
- [ ] Export mit Custom Textures erfolgreich

### Phase 4 Success Criteria
- [ ] Sandbox enabled ODER klare Dokumentation warum nicht
- [ ] Security Audit bestanden
- [ ] Keine Known Vulnerabilities
- [ ] Error Handling für alle kritischen Pfade

---

## Anhang

### A. Datei-Referenzen

**Kritische Stubs:**
- `apps/studio-electron/src/main/providers/echoSttProvider.ts:11` - Mock STT
- `apps/studio-electron/src/main/providers/mockLlmProvider.ts:3` - Mock LLM (Test only)
- `apps/studio-electron/src/renderer/app.js:341` - Hardcoded Workspace
- `apps/studio-electron/src/main/ipcHandlers/exporter.ts:17` - Hardcoded Template

**Sicherheit:**
- `apps/studio-electron/src/main/index.ts:57` - DevTools
- `apps/studio-electron/src/main/index.ts:38` - Sandbox

**Features:**
- `apps/studio-electron/src/renderer/app.js:334` - Texture Placeholder
- `packages/exporter/src/generators/assets.ts:27` - Preset Textures
- `apps/studio-electron/src/renderer/app.js:235` - Tutorial TODO

---

### B. Architektur-Übersicht

```
┌─────────────────────────────────────────┐
│         Renderer Process                │
│  ┌─────────────────────────────────┐   │
│  │  app.js                         │   │
│  │  - UI Logic                     │   │
│  │  - WebSpeech API (Browser)      │   │
│  │  - VoiceController               │   │
│  └─────────────────────────────────┘   │
│              ▲ IPC Bridge ▼            │
└──────────────┼─────────────────────────┘
               │
┌──────────────┼─────────────────────────┐
│              │  Main Process            │
│  ┌───────────▼──────────────────────┐  │
│  │  IPC Handlers                    │  │
│  │  - stt.ts (EchoStub → Replace!)  │  │
│  │  - llm.ts (OpenAI Compatible ✓)  │  │
│  │  - exporter.ts (Path Fix!)       │  │
│  │  - settings.ts (✓)               │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  Providers                       │  │
│  │  - EchoSttProvider (STUB!)       │  │
│  │  - OpenAICompatibleProvider (✓)  │  │
│  │  - MockLlmProvider (Test Only)   │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  Voice Service (Python)          │  │
│  │  - WebSocket Server              │  │
│  │  - TTS (XTTS)                    │  │
│  │  - STT? (TODO: Audit)            │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

### C. Dependencies für neue Features

**WebSpeech STT:**
```json
// Keine neuen Dependencies! Browser API
```

**LiveKit STT:**
```json
{
  "dependencies": {
    "livekit-client": "^2.0.0",
    "livekit-server-sdk": "^2.0.0"
  }
}
```

**Whisper.cpp:**
```json
{
  "dependencies": {
    "whisper-node": "^1.0.0"
  }
}
```

---

### D. Migration Checklist

**Vor jedem Refactoring:**
- [ ] Branch erstellt
- [ ] Tests laufen (alle grün)
- [ ] Backup der Settings

**Nach jedem Refactoring:**
- [ ] Tests aktualisiert
- [ ] Dokumentation aktualisiert
- [ ] Changelog Entry
- [ ] Code Review

**Vor Production Release:**
- [ ] Security Audit
- [ ] Performance Testing
- [ ] User Acceptance Testing
- [ ] Migration Guide geschrieben

---

## Nächste Schritte

### Sofort (heute):
1. ✅ Dieses Dokument reviewen
2. [ ] Sprint 1 priorisieren
3. [ ] Branch für Quick Wins erstellen
4. [ ] Workspace-Pfad Fix implementieren

### Diese Woche:
1. [ ] Sprint 1 abschließen
2. [ ] Voice Service Audit
3. [ ] Sprint 2 Planning

### Dieser Monat:
1. [ ] Sprint 1-3 abschließen
2. [ ] Beta Release
3. [ ] User Testing

---

**Autor:** Claude (Anthropic)
**Review:** Pending
**Status:** Draft v1.0
**Letzte Aktualisierung:** 2026-01-02
