# 🎮 Claude-Craft Export Guide - So bekommst du deine Mods ins Spiel!

## 📦 **Was sind die Export-Formate?**

### 1. **.mcreator** (MCreator Projekt)
- **Was ist das?** Ein Projekt-Format für MCreator
- **Nutzen:** Zum Weiterbearbeiten in MCreator
- **Import:** Datei → Open Workspace → .mcreator Datei wählen

### 2. **.jar** (Java Archive - Das fertige Mod!)
- **Was ist das?** Die fertige Mod-Datei für Minecraft
- **Nutzen:** Direkt in Minecraft spielbar
- **Das ist deine fertige Mod!** 🎉

### 3. **Source Code** (Java-Dateien)
- **Was ist das?** Der Programmier-Code
- **Nutzen:** Für Entwickler zum Anpassen

---

## 🚀 **SCHRITT-FÜR-SCHRITT: Von Claude-Craft zu Minecraft**

### **Option A: Direkt JAR exportieren (Schnellster Weg)**

1. **In Claude-Craft:**
   - Erstelle dein Item/Block
   - Stelle Eigenschaften ein (Herzen, Schaden, etc.)
   - Klicke auf **"Export"**
   - Wähle **"JAR (Minecraft Ready)"**
   - Speichere die .jar Datei

2. **JAR in Minecraft installieren:**
   ```
   1. Öffne deinen Minecraft Ordner:
      - Windows: %appdata%\.minecraft
      - Oder: Win+R → %appdata% → .minecraft
   
   2. Gehe in den "mods" Ordner
      - Falls nicht vorhanden: Erstelle ihn
   
   3. Kopiere deine .jar Datei hier rein
   
   4. Starte Minecraft mit Forge/Fabric
   ```

### **Option B: Über MCreator (Mehr Kontrolle)**

1. **Export aus Claude-Craft:**
   - Export → MCreator Format
   - Speichere als .mcreator

2. **In MCreator öffnen:**
   - Starte MCreator
   - File → Open Workspace
   - Wähle deine .mcreator Datei

3. **In MCreator kompilieren:**
   - Klicke auf **"Build & Run"** (grüner Play-Button)
   - MCreator erstellt automatisch die JAR

4. **JAR finden:**
   - Im MCreator Workspace Ordner
   - Unter: `build/libs/deine-mod.jar`

---

## ⚙️ **WICHTIG: Minecraft vorbereiten**

### **Du brauchst Minecraft Forge oder Fabric:**

#### **Forge installieren (Empfohlen für Mods):**
1. Gehe zu https://files.minecraftforge.net/
2. Wähle deine Minecraft Version (z.B. 1.20.1)
3. Download "Installer"
4. Doppelklick → Install Client
5. Starte Minecraft Launcher
6. Wähle "Forge" Profil

#### **Mod installieren:**
```
Minecraft Ordner
└── mods/
    └── claude-craft-mod.jar  ← Hier deine JAR reinlegen!
```

---

## 🎯 **MVP Beispiel: Diamantblock mit +10 Herzen**

### **1. In Claude-Craft erstellen:**
```javascript
Name: Magischer Diamantblock
Type: Block
Eigenschaften:
- Extra Herzen: 10
- Leuchtend: Ja
- Unzerstörbar: Ja
```

### **2. Export-Prozess:**
```
Claude-Craft → Export → JAR
         ↓
Speichern als: magic_diamond.jar
         ↓
Kopieren nach: .minecraft/mods/
         ↓
Minecraft mit Forge starten
         ↓
✅ Mod ist im Spiel!
```

### **3. Im Spiel finden:**
- Kreativ-Inventar → Suche "Magischer Diamantblock"
- Oder: `/give @p claudecraft:magic_diamond`

---

## 🔧 **Fehlerbehebung**

### **"Mod wird nicht geladen"**
- ✅ Richtige Minecraft Version? (Mod und Forge müssen passen)
- ✅ Forge installiert?
- ✅ JAR im mods Ordner?
- ✅ Minecraft neu gestartet?

### **"Item nicht im Spiel"**
- Kreativ-Modus aktiviert?
- In der Suche nach dem Namen suchen
- Konsole: `/give @p modid:itemname`

### **"Crash beim Start"**
- Mod-Version passt nicht zu Minecraft
- Andere Mods inkompatibel
- Lösung: Nur diese Mod testen

---

## 📝 **Zusammenfassung**

```
Claude-Craft IDE
      ↓
[Erstelle & Designe]
      ↓
Export als JAR
      ↓
.minecraft/mods/
      ↓
Minecraft + Forge
      ↓
🎮 SPIELEN!
```

## 💡 **Pro-Tipps:**

1. **Teste erst mit einem Item** bevor du viele machst
2. **Backup deinen mods Ordner** vor neuen Mods
3. **Nutze gleiche Minecraft & Forge Version** wie die Mod
4. **F3+H im Spiel** zeigt Item-IDs an
5. **JEI Mod** hilft Items zu finden (Just Enough Items)

---

## 🚀 **Los geht's!**

1. Erstelle deinen ersten Block in Claude-Craft
2. Exportiere als JAR
3. Installiere in Minecraft
4. Viel Spaß mit deiner eigenen Mod!

**Du bist jetzt ein echter Minecraft Modder!** 🎉