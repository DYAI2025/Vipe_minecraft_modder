# 🚀 Claude-Mod-Creator Entwicklungsplan

## 📊 Projekt-Analyse

### Aktueller Zustand
- **Basis-Funktionalität:** ✅ Vorhanden (3D-Viewer, Block-Erstellung)
- **Server:** Express.js auf Port 8080
- **Frontend:** Vanilla JavaScript + Three.js
- **KI-Integration:** ❌ Noch nicht implementiert
- **Sprachsteuerung:** ⚠️ Teilweise vorbereitet
- **MCreator Export:** ❌ Fehlt

## 🎯 Entwicklungsziele

### Phase 1: KI-Integration (Woche 1)
```javascript
// Neue Datei: ai-service.js
class AIService {
    constructor() {
        this.apiKey = process.env.OPENAI_API_KEY;
        this.model = 'gpt-3.5-turbo';
    }
    
    async parseCommand(command) {
        // Natürliche Sprache → Item-Eigenschaften
        // "Erstelle ein Feuerschwert mit 100 Schaden"
        return {
            type: 'sword',
            properties: {
                damage: 100,
                fire: true,
                durability: 1000
            }
        };
    }
}
```

#### Implementierungs-Schritte:
1. **API-Integration einrichten**
   - OpenAI API Key aus .env laden
   - Fallback zu lokaler Mustererkennung
   - Prompt-Engineering für Minecraft-Items

2. **Kommando-Parser entwickeln**
   - Regex für Zahlen und Eigenschaften
   - Keyword-Mapping (Feuer→fire, Schaden→damage)
   - Multi-Language Support (DE/EN)

3. **Response-Handler**
   - JSON-Validierung
   - Error-Recovery
   - User-Feedback

### Phase 2: Sprachsteuerung (Woche 2)
```javascript
// Erweiterte voice-control.js
class VoiceController {
    constructor() {
        this.recognition = new webkitSpeechRecognition();
        this.recognition.lang = 'de-DE';
        this.recognition.continuous = true;
        this.commands = new Map();
    }
    
    registerCommand(pattern, handler) {
        // "Erstelle [item]" → createItem()
        // "Setze Schaden auf [number]" → setDamage()
    }
}
```

#### Features:
1. **Wake-Word Detection**
   - "Hey Claude" aktiviert Zuhören
   - Visual Feedback (Mikrofon-Animation)
   - Auto-Timeout nach 10 Sekunden

2. **Kommando-Erkennung**
   - Fuzzy-Matching für Variationen
   - Bestätigungs-Dialoge
   - Undo-Funktionalität

3. **Feedback-System**
   - Text-to-Speech Antworten
   - Visuelle Bestätigungen
   - Error-Handling mit Vorschlägen

### Phase 3: Item-Eigenschaften System (Woche 3)
```javascript
// item-properties.js
class ItemProperty {
    constructor(name, icon, minValue, maxValue) {
        this.name = name;
        this.icon = icon;
        this.value = minValue;
        this.range = [minValue, maxValue];
    }
}

class ItemCreator {
    properties = {
        health: new ItemProperty('Gesundheit', '❤️', 0, 100),
        damage: new ItemProperty('Schaden', '⚔️', 0, 200),
        speed: new ItemProperty('Geschwindigkeit', '💨', 0, 10),
        jump: new ItemProperty('Sprungkraft', '🦘', 0, 10),
        fire: new ItemProperty('Feuer', '🔥', 0, 10),
        durability: new ItemProperty('Haltbarkeit', '🔧', 100, 10000)
    };
    
    calculatePowerLevel() {
        // Algorithmus für Macht-Stufe
        // NORMAL → UNGEWÖHNLICH → SELTEN → EPISCH → LEGENDÄR
    }
}
```

#### Eigenschaften-Matrix:

| Item-Typ | Basis-Eigenschaften | Spezial-Fähigkeiten |
|----------|-------------------|-------------------|
| Schwert | Schaden, Haltbarkeit | Feuer, Blitz, Gift |
| Rüstung | Schutz, Haltbarkeit | Heilung, Geschwindigkeit |
| Block | Härte, Lichtlevel | Explosion, Teleport |
| Trank | Effekt-Stärke, Dauer | Mehrfach-Effekte |
| Bogen | Schaden, Reichweite | Explosive Pfeile |

### Phase 4: MCreator Export (Woche 4)
```javascript
// mcreator-exporter.js
class MCreatorExporter {
    async exportToMCreator(item) {
        const modElement = {
            name: item.name,
            type: this.mapItemType(item.type),
            compiles: true,
            registry_name: item.name.toLowerCase(),
            metadata: {
                files: [],
                dependencies: []
            }
        };
        
        // Generate Java code
        const javaCode = this.generateJavaCode(item);
        
        // Create mod structure
        return {
            'elements/': modElement,
            'src/main/java/': javaCode,
            'assets/': this.generateAssets(item)
        };
    }
    
    generateJavaCode(item) {
        // Template-basierte Java-Generierung
        return `
        public class ${item.name} extends Item {
            public ${item.name}() {
                super(new Item.Properties()
                    .tab(CreativeModeTab.TAB_COMBAT)
                    .durability(${item.properties.durability}));
            }
            
            @Override
            public InteractionResultHolder<ItemStack> use(...) {
                // Effekte anwenden
                ${this.generateEffects(item.properties)}
            }
        }`;
    }
}
```

#### Export-Pipeline:
1. **Validierung**
   - Item-Eigenschaften prüfen
   - Minecraft-Version kompatibilität
   - Namens-Konventionen

2. **Code-Generierung**
   - Java-Klassen erstellen
   - JSON-Metadaten
   - Texturen-Referenzen

3. **Workspace-Integration**
   - Direkt in MCreator-Ordner
   - Auto-Import Trigger
   - Build-Verification

## 🛠️ Technische Architektur

### Backend-Struktur
```
C:\Claude-mod-creator\
├── server\
│   ├── api\
│   │   ├── ai-router.js      # KI-Endpoints
│   │   ├── item-router.js    # Item-Management
│   │   └── export-router.js  # Export-Funktionen
│   ├── services\
│   │   ├── ai-service.js     # OpenAI Integration
│   │   ├── voice-service.js  # Spracherkennung
│   │   └── mcreator-service.js # MCreator Bridge
│   └── server.js              # Express Server
├── client\
│   ├── js\
│   │   ├── ai-client.js      # KI-Interface
│   │   ├── voice-control.js  # Sprach-UI
│   │   ├── item-creator.js   # Item-Builder
│   │   └── 3d-viewer.js      # Three.js Viewer
│   └── index.html             # Hauptseite
└── shared\
    ├── models\               # Datenmodelle
    ├── templates\            # Code-Templates
    └── constants\            # Konstanten
```

### API-Endpoints
```javascript
// KI-Integration
POST /api/ai/parse        // Text → Item-Eigenschaften
POST /api/ai/suggest      // Vorschläge generieren
POST /api/ai/enhance      // Item verbessern

// Item-Management
GET  /api/items           // Alle Items laden
POST /api/items           // Neues Item erstellen
PUT  /api/items/:id       // Item aktualisieren
DELETE /api/items/:id     // Item löschen

// Export
POST /api/export/mcreator // MCreator Export
POST /api/export/command  // Minecraft Command
POST /api/export/datapack // Datapack Export
```

## 📅 Zeitplan

### Woche 1: KI-Integration
- [ ] OpenAI API Setup
- [ ] Prompt-Engineering
- [ ] Fallback-Parser
- [ ] Testing & Debugging

### Woche 2: Sprachsteuerung
- [ ] WebSpeech API Integration
- [ ] Kommando-Erkennung
- [ ] Feedback-System
- [ ] Multi-Language Support

### Woche 3: Item-System
- [ ] Eigenschaften-Framework
- [ ] Power-Level Berechnung
- [ ] UI-Components
- [ ] Animations & Effects

### Woche 4: MCreator Export
- [ ] Java Code-Generator
- [ ] MCreator Workspace API
- [ ] Auto-Import Feature
- [ ] Testing & Validation

## 🔧 Setup-Anleitung

### 1. Dependencies installieren
```bash
cd C:\Claude-mod-creator
npm install
npm install openai dotenv cors
```

### 2. Environment Variables
```env
# .env Datei erstellen
OPENAI_API_KEY=sk-...
MCREATOR_PATH=C:\Program Files\Pylo\MCreator
WORKSPACE_PATH=C:\Users\User\MCreatorWorkspaces
```

### 3. Server starten
```bash
npm run dev  # Development mit Hot-Reload
npm start    # Production
```

### 4. Testing
```bash
npm test     # Unit Tests
npm run e2e  # End-to-End Tests
```

## 🎯 Erfolgs-Kriterien

### Must-Have
- ✅ KI versteht natürliche Sprache
- ✅ Sprachsteuerung funktioniert
- ✅ Items haben alle Eigenschaften
- ✅ Export zu MCreator möglich

### Nice-to-Have
- ⭐ Texture-Generator
- ⭐ Multiplayer-Support
- ⭐ Cloud-Speicherung
- ⭐ Mobile App

## 📝 Notizen

- **Priorität:** KI-Integration ist wichtigster Teil
- **Testing:** Jede Phase braucht User-Testing
- **Documentation:** API-Docs mit Swagger
- **Security:** API-Keys sicher speichern

---

**Start:** 22.08.2025
**Ziel:** Voll funktionsfähige Minecraft Mod IDE mit KI
**Team:** Claude + User