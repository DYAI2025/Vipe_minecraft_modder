# 🎮 Claude-Craft - Minecraft Mod Creator

## ✅ STABILE BASIS-VERSION

Diese Version funktioniert **GARANTIERT** ohne KI-Integration. Alle Grundfunktionen laufen!

## 🚀 So startest du:

1. **Server starten** (falls noch nicht läuft):
   ```
   npm start
   ```

2. **Öffne im Browser**:
   http://localhost:8080/index.html

## ✨ Was funktioniert:

### 🧱 Block-Erstellung
- Klicke die Buttons links um verschiedene Blöcke zu erstellen:
  - ⛰️ Stein
  - 🌿 Gras  
  - 💎 Diamant (leuchtet!)
  - 🪟 Glas (transparent)
  - 🧨 TNT

### ⚔️ Item-Erstellung
- Erstelle Minecraft-Items:
  - 🗡️ Schwert
  - ⛏️ Spitzhacke
  - 🏹 Bogen

### ✨ Animationen
- 🔄 Rotieren
- ☁️ Schweben
- 💗 Pulsieren

### 🎮 3D-Viewer Controls
- **Maus gedrückt halten + ziehen** = Kamera drehen
- **Mausrad** = Zoom
- **Reset-Button** = Kamera zurücksetzen
- **Wireframe-Button** = Gitter-Ansicht

### 💾 Export & Speichern
- **Export** = Speichert als JSON-Datei
- **Speichern** = Speichert lokal im Browser

## 📊 Eigenschaften

Jedes Objekt hat echte Minecraft-Eigenschaften:
- **Härte** (wie lange zum Abbauen)
- **Tool** (welches Werkzeug benötigt)
- **Lichtlevel** (0-15)

## 🔧 Technische Details

- **Three.js r128** für 3D-Rendering
- **Vanilla JavaScript** (keine Frameworks)
- **LocalStorage** für Speicherung
- **Responsive Design**

## 📁 Dateien

- `index.html` - Hauptdatei (alles in einer Datei!)
- `server.js` - Einfacher HTTP-Server
- `.env` - Moonshot API Key (für spätere KI-Integration)

## 🐛 Troubleshooting

**3D-Viewer zeigt nichts?**
- Warte 1-2 Sekunden nach dem Laden
- Drücke F5 für Reload
- Öffne Konsole (F12) für Fehler

**Buttons funktionieren nicht?**
- Stelle sicher dass der Server läuft (`npm start`)
- Nutze Chrome oder Edge (nicht Firefox)

**Export funktioniert nicht?**
- Erstelle erst ein Objekt
- Browser-Popups erlauben

## 🎯 Nächste Schritte

1. **KI-Integration** mit Moonshot API
2. **MCP Integration** für echte MCreator-Anbindung
3. **Spracherkennung** verbessern
4. **Mehr Block-Typen** hinzufügen

## 📝 Notizen

Diese Version ist die **stabile Basis** ohne KI. Alle Funktionen sind getestet und funktionieren. Die KI-Integration kommt als nächstes!

---
**Version**: 1.0.0-stable
**Status**: ✅ Funktioniert
**Getestet**: Chrome, Edge
