# Workspace Setup Guide

## Was ist ein Workspace?

Dein **Workspace** ist der Ordner, in dem KidModStudio alle deine Minecraft Mods speichert. Hier werden deine Projekte, exportierten Mods und Konfigurationen gespeichert.

## Erstmaliges Setup

Beim ersten Start von KidModStudio wird automatisch ein Workspace für dich erstellt:

**Standard-Ordner:**
- **Windows**: `C:\Users\DeinName\Documents\KidModStudio\workspace`
- **Mac**: `/Users/DeinName/Documents/KidModStudio/workspace`
- **Linux**: `/home/deinname/Documents/KidModStudio/workspace`

KidModStudio erstellt diesen Ordner automatisch, wenn er noch nicht existiert.

## Workspace manuell ändern

Du kannst deinen Workspace jederzeit ändern:

### Option 1: Beim Start (wenn Workspace nicht gefunden wird)

Wenn dein Workspace-Ordner nicht gefunden wird, zeigt KidModStudio automatisch einen Dialog an:

1. Wähle einen bestehenden Ordner ODER
2. Erstelle einen neuen Ordner
3. Klicke auf "Wählen"

### Option 2: Über die Einstellungen (geplant)

In zukünftigen Versionen kannst du den Workspace in den Einstellungen ändern.

## Workspace-Struktur

Dein Workspace enthält folgende Unterordner:

```
KidModStudio/
└── workspace/
    ├── export/          # Exportierte Mod-Projekte
    │   └── kid_custom_mod/
    │       ├── src/
    │       ├── build.gradle
    │       └── ...
    └── projects/        # Gespeicherte Projekte
        └── mein_erster_mod.json
```

## Wichtige Hinweise

### ✅ Gute Workspace-Orte
- Dein Benutzer-Ordner (z.B. `Documents`, `Desktop`)
- Eine externe Festplatte
- Ein Cloud-Sync-Ordner (Dropbox, OneDrive, etc.)

### ❌ Vermeiden
- **Niemals** System-Ordner wie:
  - Windows: `C:\Windows`, `C:\Program Files`
  - Mac: `/System`, `/Library`
  - Linux: `/usr`, `/bin`, `/etc`
- **Root-Verzeichnis** (`C:\` oder `/`)

KidModStudio verhindert automatisch die Auswahl dieser gefährlichen Orte!

## Probleme?

### Workspace wurde gelöscht
Kein Problem! KidModStudio erstellt automatisch einen neuen Standard-Workspace beim nächsten Start.

### Workspace auf anderem Computer
Kopiere einfach deinen gesamten `KidModStudio/workspace` Ordner auf den neuen Computer und wähle ihn beim Start aus.

### Fehlermeldung: "Workspace konnte nicht erstellt werden"
- Prüfe, ob du Schreibrechte für den Ordner hast
- Versuche einen anderen Ordner in deinem Benutzerverzeichnis
- Kontaktiere einen Erwachsenen, wenn es nicht funktioniert

## Technische Details (für Entwickler)

Der Workspace-Pfad wird in der Datei `settings.json` gespeichert:
- **Windows**: `%APPDATA%\KidModStudio\settings.json`
- **Mac**: `~/Library/Application Support/KidModStudio/settings.json`
- **Linux**: `~/.config/KidModStudio/settings.json`

Schema:
```json
{
  "workspace": {
    "rootPath": "/pfad/zum/workspace",
    "autoCreate": true,
    "templatePath": null
  }
}
```
