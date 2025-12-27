# TTS/STT macOS Kompatibilitätsanalyse

## Zusammenfassung

Das KidModStudio-Projekt verwendet mehrere TTS (Text-to-Speech) und STT (Speech-to-Text) Implementierungen. Diese Analyse dokumentiert die macOS-Kompatibilität und erforderliche Änderungen.

## TTS Provider

### 1. OpenAI TTS (Cloud-basiert)
**Status: Vollständig macOS-kompatibel**
- Verwendet HTTP/HTTPS Fetch API
- Keine plattformspezifischen Abhängigkeiten
- Erfordert: API-Key und Internetverbindung

### 2. Piper TTS (Lokal)
**Status: macOS-kompatibel mit Installation**

| Plattform | Installation |
|-----------|--------------|
| macOS (Intel) | `pip install piper-tts` oder manueller Build |
| macOS (Apple Silicon) | `pip install piper-tts` (ARM-Build) |
| Linux | `pip install piper-tts` oder `apt install piper-tts` |

**Pfad-Suche implementiert:**
- `/opt/homebrew/bin/piper` (Apple Silicon Homebrew)
- `/usr/local/bin/piper` (Intel Mac Homebrew)
- `~/.local/bin/piper` (pip install --user)

**Deutsche Stimme:** `de_DE-thorsten-high`

### 3. eSpeak TTS (Lokal)
**Status: macOS-kompatibel mit Homebrew**

| Plattform | Installation |
|-----------|--------------|
| macOS | `brew install espeak` oder `brew install espeak-ng` |
| Linux | `apt install espeak` oder `apt install espeak-ng` |

**Pfad-Suche implementiert:**
- `/opt/homebrew/bin/espeak` (Apple Silicon)
- `/opt/homebrew/bin/espeak-ng`
- `/usr/local/bin/espeak` (Intel Mac)
- `/usr/local/bin/espeak-ng`

**Deutsche Stimme:** `de`

### 4. macOS Native TTS (`say` Befehl)
**Status: NEU implementiert - nur macOS**

Diese Implementierung wurde hinzugefügt als Fallback für macOS:
- Datei: `packages/voice-server/src/services/macos-say.ts`
- Nutzt den eingebauten `say` Befehl
- Keine zusätzliche Installation erforderlich

**Deutsche Stimmen auf macOS:**
- `Anna` (Standard, weiblich)
- `Markus` (männlich)
- Weitere über `say -v "?" | grep de` abrufbar

**Beispiel-Nutzung:**
```typescript
import { MacOSSayService } from './services/macos-say.js';

const tts = new MacOSSayService({ voice: 'Anna', rate: 180 });
await tts.speak('Hallo, ich bin Crafty!');
```

### 5. WebSpeech API (Browser)
**Status: Vollständig macOS-kompatibel**
- Verwendet `window.speechSynthesis`
- Safari: Native Unterstützung
- Chrome/Electron: Chromium-basierte Unterstützung
- Keine Installation erforderlich

## STT Provider

### 1. Whisper (whisper.cpp) - Lokal
**Status: macOS-kompatibel mit Installation**

| Plattform | Installation |
|-----------|--------------|
| macOS | `brew install whisper-cpp` |
| macOS (manuell) | Clone & compile whisper.cpp |
| Linux | Build from source oder Paketmanager |

**Pfad-Suche implementiert:**
- `/opt/homebrew/bin/whisper` (Apple Silicon)
- `/opt/homebrew/bin/whisper-cpp`
- `/usr/local/bin/whisper` (Intel Mac)
- `/usr/local/bin/whisper-cpp`

**Modelle:** Müssen separat heruntergeladen werden (`ggml-small.bin` etc.)

### 2. WebSpeech API (Browser)
**Status: Vollständig macOS-kompatibel**
- Verwendet `window.SpeechRecognition` oder `window.webkitSpeechRecognition`
- Safari: Native Unterstützung mit macOS Diktierfunktion
- Chrome/Electron: Google-basierte Erkennung
- Keine Installation erforderlich

### 3. LiveKit STT (Cloud-basiert)
**Status: Vollständig macOS-kompatibel**
- WebSocket-basierte Kommunikation
- Keine plattformspezifischen Abhängigkeiten

## Architektur-Übersicht

```
┌─────────────────────────────────────────────────────────────┐
│                    Electron Renderer                         │
│              (WebSpeech API - Browser-nativ)                │
└────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              Electron Main Process (IPC)                     │
│                                                               │
│  TTS Handlers:              STT Handlers:                    │
│  ├─ OpenAI (Cloud)          ├─ LiveKit (Cloud)              │
│  └─ WebSpeech               └─ WebSpeech                    │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              Voice Server (Port 3847)                        │
│                                                               │
│  TTS Services:              STT Services:                    │
│  ├─ Piper      ────────►    └─ Whisper ◄────────            │
│  ├─ eSpeak     Subprocess       Subprocess                  │
│  └─ macOS say  (NEU)                                        │
└─────────────────────────────────────────────────────────────┘
```

## Implementierte Änderungen

### 1. macOS Homebrew Pfade
Alle Services suchen jetzt nach Binaries in:
- `/opt/homebrew/bin/` (Apple Silicon)
- `/usr/local/bin/` (Intel Mac)

### 2. Neuer macOS TTS Service
`packages/voice-server/src/services/macos-say.ts`:
- Nutzt nativen `say` Befehl
- Keine externe Abhängigkeit
- Deutsche Stimmen-Unterstützung

### 3. espeak-ng Unterstützung
Der eSpeak-Service erkennt nun auch `espeak-ng`, das auf macOS via Homebrew verfügbar ist.

### 4. Funktionale Tests
`packages/voice-server/src/services/platform-compatibility.test.ts`:
- Prüft alle TTS/STT Services
- Generiert Kompatibilitätsbericht
- Plattform-spezifische Empfehlungen

## Installation auf macOS

### Minimal (nur Browser-APIs)
```bash
# Keine zusätzliche Installation erforderlich
# WebSpeech API wird vom Browser bereitgestellt
npm install
npm run dev
```

### Empfohlen (mit lokalen Services)
```bash
# TTS Option 1: eSpeak (leichtgewichtig)
brew install espeak

# TTS Option 2: Piper (hochwertige Stimmen)
pip install piper-tts

# STT: Whisper
brew install whisper-cpp

# Whisper-Modelle herunterladen
# https://huggingface.co/ggerganov/whisper.cpp

npm install
npm run dev
```

### Voice-Server starten
```bash
cd packages/voice-server
npm run dev
```

## Tests ausführen

```bash
# Alle Tests
npm test

# Nur Voice-Server Tests
cd packages/voice-server
npm test

# Plattform-Kompatibilitätsbericht
npm test -- --grep "platform-compatibility"
```

## Bekannte Einschränkungen

### macOS-spezifisch
1. **Whisper-Modelle**: Müssen manuell heruntergeladen werden
2. **Piper ARM**: Möglicherweise Performance-Unterschiede auf Apple Silicon
3. **Safari STT**: Erfordert Diktierfunktion in Systemeinstellungen

### Allgemein
1. **Offline-STT**: Whisper benötigt Modell-Dateien (~150MB - 1.5GB)
2. **Latenz**: Lokale TTS/STT haben höhere Latenz als Cloud-Services

## Empfohlene Konfiguration für macOS

```typescript
// packages/ipc-contracts/src/defaults.ts
export const MACOS_RECOMMENDED_SETTINGS = {
  tts: {
    // Primär: WebSpeech (keine Installation)
    provider: "webspeech",
    // Alternativ: macOS say
    fallback: "macos-say"
  },
  stt: {
    // Primär: WebSpeech (keine Installation)
    provider: "webspeech",
    // Alternativ: Whisper (erfordert Installation)
    fallback: "whisper"
  }
};
```

## Fazit

Das Projekt ist **vollständig macOS-kompatibel** mit folgenden Optionen:

| Funktion | Ohne Installation | Mit Installation |
|----------|-------------------|------------------|
| TTS | WebSpeech, macOS `say` | + Piper, eSpeak |
| STT | WebSpeech | + Whisper |

Die WebSpeech API bietet die einfachste Lösung ohne zusätzliche Abhängigkeiten. Für Offline-Nutzung können Piper/eSpeak (TTS) und Whisper (STT) installiert werden.
