# Implementierungsplan: Crafty Realtime Voice (Qwen 2.5 Edition)

> Status: Geplant
> Datum: 01.01.2026
> Zielhardware: NVIDIA GeForce 1080 Ti (11 GB VRAM)

## 1. Übersicht

Integration eines "Voice Intelligence Centers" in das KidModStudio. Ziel ist eine flüssige, latenzarme Sprachinteraktion mit dem Assistenten "Crafty", der über eine hochwertige, anpassbare Stimme verfügt.

## 2. Komponenten-Architektur

### 2.1 Intelligence Core (LLM)

* **Modell:** **Qwen 2.5 7B Instruct** (Quantisierung: Q5_K_M)
* **Begründung:** Bietet das beste Verhältnis aus Coding-Kompetenz (für Modding-Fragen) und Ressourceneffizienz. Belegt nur ca. 5.5 GB VRAM, was Raum für TTS lässt.
* **Prompting:** Angepasster System-Prompt, der Qwen in die Rolle von "Crafty" zwingt (hilfsbereit, kindgerecht, aber technisch präzise).

### 2.2 Voice Synthesis (TTS)

* **Engine:** **Coqui XTTSv2**
* **Feature:** Voice Cloning. Ermöglicht das Abspeichern von "Stimm-Profilen" (10s WAV-Dateien), mit denen Crafty sprechen soll.
* **Optimierung:** Load-on-Demand. Das TTS-Modell wird im VRAM gehalten, solange Voice-Chat aktiv ist.
* **Streaming:** Nutzung von `RealtimeTTS` für sofortige Audio-Ausgabe (Start der Wiedergabe während Qwen noch generiert).

### 2.3 Speech Recognition (STT)

* **Engine:** **Faster-Whisper** (`small` oder `base` Modell)
* **Laufzeit:** CPU oder GPU (Low VRAM Mode). Da STT nur kurzzeitig aktiv ist (beim Sprechen des Users), ist die Last vernachlässigbar.
* **VAD:** Silero VAD für präzise Erkennung von Sprechpausen (Turn Detection).

## 3. Datenfluss & Latenz-Optimierung

1. **User Spricht** → Mikrofon (Electron) → Stream zu Python-Server.
2. **VAD/STT** → Erkennt Satzende → Whisper transkribiert → Text an LLM.
3. **LLM (Qwen)** → Generiert Token-Stream ("Ah", " lass", " mich", " mal", " schauen")...
4. **Satz-Puffer** → Sobald ein Satzzeichen (. ! ?) kommt → Text an TTS.
5. **TTS (XTTS)** → Generiert Audio → Stream an Electron.
6. **Electron** → Spielt Audio ab.

**Erwartete Latenz (TTFA - Time to First Audio):** < 800ms

## 4. Implementierungsschritte

### Phase 1: Python Voice Service (`packages/voice-server-py`)

Erstellung eines neuen Microservices, der die Logik aus `RealtimeVoiceChat` kapselt.
* [ ] Setup `FastAPI` Server mit WebSockets.
* [ ] Integration `realtimestt` & `realtimetts`.
* [ ] Anbindung an lokales Ollama (Qwen 2.5).
* [ ] Endpoint `/v1/voice/profile` zum Hochladen/Wählen von Stimmen.

### Phase 2: Electron Integration

- [ ] `VoiceClient`-Klasse im Renderer für WebSocket-Management.
* [ ] Audio-Worklet für ruckelfreies Abspielen des PCM-Streams.
* [ ] UI-Komponente "Voice Settings":
  * Mikrofon-Auswahl.
  * Stimm-Rekorder (10s Aufnahme für Cloning).
  * Profil-Liste (gespeicherte Stimmen).

### Phase 3: Hardware-Tuning

- [ ] VRAM-Monitoring einbauen (Warnung wenn >10GB belegt).
* [ ] "Low Performance Mode"-Toggle: Schaltet TTS auf "System-Stimme" (espeak/Browser) um, falls GPU überlastet ist, behält aber Qwen bei.

## 5. VRAM-Budget (Geschätzt)

| Komponente | VRAM Bedarf | Status |
| :--- | :--- | :--- |
| **Qwen 2.5 7B (Q5)** | ~5.5 GB | Dauerhaft |
| **Coqui XTTSv2** | ~3.0 GB | Während Voice-Chat |
| **Whisper (small)** | ~0.5 GB | Temporär |
| **System/Electron** | ~1.5 - 2.0 GB | Dauerhaft |
| **SUMME** | **~10.5 - 11.0 GB** | **Kritisch, aber machbar** |

## 6. Nächste Schritte

1. Verzeichnis `packages/voice-server-py` anlegen.
2. `requirements.txt` definieren (torch, realtimetts, fastify...).
3. Basis-Server aus `RealtimeVoiceChat` portieren.
