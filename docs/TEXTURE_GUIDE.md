# Texture Guide - Eigene Texturen für deine Blöcke!

**KidModStudio** ermöglicht es dir, eigene Texturen für deine Minecraft-Blöcke zu verwenden. Du hast zwei Möglichkeiten:

1. **Vorlagen-Texturen** - 16 fertige Texturen zum Auswählen
2. **Eigene Texturen** - Lade deine eigenen Bilder hoch

---

## Vorlagen-Texturen verwenden

### Schritt 1: Textur-Modal öffnen

Klicke in der Werkbank auf den Button **"🎨 Textur wählen"**.

### Schritt 2: Vorlage auswählen

Im Textur-Modal siehst du 16 verschiedene Vorlagen:

- **Stein** - Grauer Stein
- **Erde** - Braune Erde
- **Gras** - Grünes Gras
- **Holz** - Braunes Holz
- **Fels** - Dunkler Fels
- **Sand** - Gelber Sand
- **Ziegel** - Roter Ziegel
- **Kohle** - Schwarze Kohle
- **Eisen** - Graues Eisen
- **Gold** - Goldenes Erz
- **Diamant** - Hellblauer Diamant
- **Smaragd** - Grüner Smaragd
- **Obsidian** - Schwarzer Obsidian
- **Glas** - Transparentes Glas
- **Schnee** - Weißer Schnee
- **Eis** - Hellblaues Eis

Klicke einfach auf eine Vorlage, um sie auszuwählen.

### Schritt 3: Vorschau ansehen

Die ausgewählte Textur wird sofort in der Vorschau angezeigt.

### Schritt 4: Übernehmen

Klicke auf **"✅ Übernehmen"**, um die Textur zu speichern.

---

## Eigene Textur hochladen

### Schritt 1: Textur-Modal öffnen

Klicke in der Werkbank auf **"🎨 Textur wählen"**.

### Schritt 2: Datei auswählen

Klicke auf **"📤 Textur hochladen"** und wähle eine Bilddatei von deinem Computer.

### Unterstützte Formate

- **PNG** (empfohlen)
- **JPEG**

### Anforderungen

- **Maximale Dateigröße**: 1 MB
- **Empfohlene Größe**: 16x16 Pixel (Minecraft-Standard)
- **Hinweis**: Größere Bilder werden automatisch auf 16x16 verkleinert

### Schritt 3: Vorschau prüfen

Die hochgeladene Textur wird automatisch in der Vorschau angezeigt (vergrößert auf 64x64 Pixel).

### Schritt 4: Übernehmen

Klicke auf **"✅ Übernehmen"**, um die Textur zu speichern.

---

## Mod mit Textur erstellen

Nachdem du eine Textur ausgewählt hast:

1. Ziehe einen Block in die Werkbank
2. Klicke auf **"⚒️ Mod bauen!"**
3. Deine Textur wird automatisch im exportierten Mod verwendet

Der fertige Mod enthält deine Textur im Ordner:
```
export/<mod_name>/src/main/resources/assets/<mod_id>/textures/block/
```

---

## Tipps & Tricks

### 🎨 Textur-Design

- **16x16 Pixel** ist die Standardgröße für Minecraft-Texturen
- Verwende klare Farben und einfache Muster
- Teste deine Textur im Spiel, um zu sehen wie sie wirkt

### 📂 Texturen verwalten

- Vorlagen-Texturen sind immer verfügbar
- Hochgeladene Texturen gelten nur für die aktuelle Sitzung
- Pro Block kannst du eine Textur auswählen

### 🔄 Textur ändern

Du kannst die Textur jederzeit ändern:

1. Öffne das Textur-Modal erneut
2. Wähle eine neue Textur
3. Erstelle deinen Mod neu

---

## Häufige Fragen (FAQ)

### Warum wird meine Textur nicht angezeigt?

**Problem**: Datei zu groß
**Lösung**: Stelle sicher, dass deine Datei kleiner als 1 MB ist

**Problem**: Falsches Format
**Lösung**: Verwende PNG oder JPEG Dateien

### Kann ich mehrere Texturen hochladen?

Aktuell kannst du nur eine Textur gleichzeitig auswählen. Für mehrere Blöcke musst du die Textur pro Block neu auswählen.

### Wo werden hochgeladene Texturen gespeichert?

Hochgeladene Texturen werden nur im Browser-Speicher (RAM) gehalten und gehen verloren wenn du die App schließt. Im exportierten Mod sind sie aber enthalten!

### Kann ich animierte Texturen verwenden?

Aktuell werden nur statische Texturen unterstützt. Animierte Texturen sind für zukünftige Versionen geplant.

---

## Fehlerbehebung

### "Fehler beim Hochladen: Ungültiges Bild"

- Prüfe das Dateiformat (PNG oder JPEG)
- Stelle sicher, dass die Datei nicht beschädigt ist
- Versuche es mit einem einfacheren Bild

### "Fehler beim Hochladen: Datei zu groß!"

- Komprimiere deine Bilddatei
- Verwende ein kleineres Bild
- Reduziere die Bildauflösung

### Textur sieht verpixelt aus

Das ist normal! Minecraft-Texturen sind absichtlich im Pixel-Art-Stil gehalten. Die 16x16 Pixel werden im Spiel vergrößert.

---

## Weiterführende Informationen

### Minecraft Textur-Ressourcen

- [Minecraft Wiki - Textures](https://minecraft.fandom.com/wiki/Resource_Pack#Textures)
- [Piskel](https://www.piskelapp.com/) - Kostenloser Pixel-Art Editor
- [Paint.NET](https://www.getpaint.net/) - Kostenlose Bildbearbeitung

### KidModStudio Dokumentation

- [Sprint 1: Workspace Setup](./WORKSPACE_SETUP.md)
- [Sprint 2: Voice Features](./VOICE_SETUP.md)
- [Sprint 3: Texture System](./SPRINT3_CHANGES.md) (technische Details)

---

**Viel Spaß beim Erstellen deiner eigenen Texturen!** 🎨✨
