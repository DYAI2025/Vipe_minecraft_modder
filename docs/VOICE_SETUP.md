# Spracherkennung Setup Guide

## Übersicht

KidModStudio unterstützt **zwei Spracherkennungs-Modi**:

1. **WebSpeech** (Browser, Online) - Einfach, funktioniert sofort
2. **Voice Server** (Python/Whisper, Offline) - Privater, keine Internet-Verbindung nötig

---

## Option 1: WebSpeech (Empfohlen für Start)

### ✅ Vorteile
- Funktioniert sofort ohne Setup
- Keine zusätzliche Software nötig
- Gute Erkennungsqualität

### ❌ Nachteile
- Benötigt Internet-Verbindung
- Nur in Chromium-Browsern (Chrome, Edge, Electron)
- Daten werden zu Google gesendet

### Setup

**1. Settings öffnen:**
- Klicke auf ⚙️ in der App

**2. STT Provider wählen:**
- Standard ist `webspeech`
- Keine weitere Konfiguration nötig!

**3. Erste Nutzung:**
- Klicke auf 🎤 "Sprich mit mir!"
- Browser fragt nach Mikrofon-Zugriff
- Klicke "Erlauben"
- Sprich einfach drauf los!

### Fehlerbehebung

**"Mikrofonzugriff verweigert"**
- Browser-Einstellungen → Datenschutz → Mikrofon
- Erlaube Zugriff für KidModStudio

**"Netzwerkfehler"**
- Prüfe deine Internet-Verbindung
- WebSpeech benötigt Internet!

**"Keine Sprache erkannt"**
- Sprich lauter und deutlicher
- Prüfe ob Mikrofon funktioniert (z.B. in Sound-Einstellungen)

---

## Option 2: Voice Server (Offline Whisper)

### ✅ Vorteile
- Funktioniert **offline** (keine Internet-Verbindung nötig)
- **Privat** - Deine Stimme bleibt auf deinem Computer
- Sehr genaue Erkennung (Whisper AI)
- Mehrsprachig

### ❌ Nachteile
- Erfordert Python Installation
- Benötigt mehr CPU (für AI-Modell)
- Initiales Setup nötig

### Setup

**1. Python installieren:**
```bash
# Python 3.10 oder neuer nötig
python3 --version  # Sollte 3.10+ sein
```

**2. Voice Server Dependencies installieren:**
```bash
cd packages/voice-server-py
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**3. Voice Server testen:**
```bash
python3 src/main.py
# Server sollte starten auf http://127.0.0.1:3850
```

**4. KidModStudio konfigurieren:**
- Öffne Settings (⚙️)
- STT Provider: `livekit` (nutzt Voice Server)
- Starte App neu

**5. Erste Nutzung:**
- Voice Server wird automatisch beim App-Start gestartet
- Klicke auf 🎤
- Sprich - Erkennung läuft offline!

### Fehlerbehebung

**"Voice Server antwortet nicht"**
- Prüfe ob Voice Server läuft: `ps aux | grep python`
- Prüfe Logs in KidModStudio (DevTools → Console)
- Starte App neu

**"Whisper Modell nicht gefunden"**
- Beim ersten Start lädt Whisper das Modell (kann 5-10 Minuten dauern)
- Warte ab, es wird nur einmal heruntergeladen

**"Zu langsam"**
- Nutze kleineres Modell: `model="tiny"` in `stt_engine.py`
- Oder wechsle zu WebSpeech für bessere Performance

---

## Provider-Vergleich

| Feature | WebSpeech | Voice Server |
|---------|-----------|--------------|
| **Setup** | ✅ Keine | ⚠️ Python + Dependencies |
| **Internet nötig** | ✅ Ja | ❌ Nein (offline) |
| **Datenschutz** | ⚠️ Daten zu Google | ✅ Lokal |
| **Genauigkeit** | 🟢 Gut | 🟢 Sehr gut |
| **Performance** | ✅ Schnell | ⚠️ CPU-intensiv |
| **Sprachen** | 🟡 Viele | ✅ 99+ Sprachen |
| **Kosten** | ✅ Kostenlos | ✅ Kostenlos |

---

## Empfehlungen

**Für Anfänger:**
→ Nutze **WebSpeech** (Standard)
- Funktioniert sofort
- Keine technischen Kenntnisse nötig

**Für Datenschutz-Bewusste:**
→ Nutze **Voice Server**
- Deine Stimme bleibt lokal
- Keine Cloud-Verbindung

**Für beste Performance:**
→ **WebSpeech** auf schnellem Internet
- Oder **Voice Server** auf Gaming-PC

---

## Technische Details

### WebSpeech API
- Nutzt `window.SpeechRecognition`
- Läuft im Renderer-Prozess
- Audio wird direkt im Browser verarbeitet
- Events: `start`, `result`, `end`, `error`

### Voice Server
- Python FastAPI Server auf Port 3850
- WebSocket Protokoll: Jarvis Events
- STT Engine: RealtimeSTT (Whisper)
- Binary Audio Stream (PCM 16-bit mono 16kHz)

### Settings Schema
```json
{
  "stt": {
    "provider": "webspeech",  // or "livekit"
    "language": "de-DE",
    "sampleRateHz": 16000,
    "interimResults": true,
    "providerConfig": {
      "provider": "webspeech"
    }
  }
}
```

---

## Häufige Fragen

**Q: Welcher Provider ist besser?**
A: Für die meisten Nutzer ist WebSpeech einfacher. Voice Server ist besser für Offline-Nutzung und Datenschutz.

**Q: Kann ich zwischen Providern wechseln?**
A: Ja! Ändere einfach die Settings und starte die App neu.

**Q: Funktioniert es auf Deutsch?**
A: Ja! Beide Provider unterstützen Deutsch. WebSpeech erkennt die Sprache automatisch, Voice Server nutzt `language: "de"`.

**Q: Was passiert mit meiner Stimme?**
A:
- WebSpeech: Wird zu Google gesendet für Erkennung
- Voice Server: Bleibt auf deinem Computer

**Q: Brauche ich ein gutes Mikrofon?**
A: Ein normales Headset oder Laptop-Mikrofon reicht aus. Je besser das Mikrofon, desto genauer die Erkennung.

---

**Noch Fragen?** Schau in die Developer-Docs oder frage im Issue Tracker!
