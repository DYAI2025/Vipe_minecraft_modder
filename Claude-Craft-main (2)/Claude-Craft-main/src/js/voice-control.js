// Claude-Craft Voice Control System - Version 2.0
// Mit Claude als interaktivem Lehrer!

class VoiceControl {
    constructor() {
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.isListening = false;
        this.currentObject = null;
        this.claudePersonality = {
            name: "Claude",
            voice: null,
            enthusiasm: 1.2  // Extra enthusiastisch für Kinder!
        };
        this.initializeRecognition();
        this.initializeClaude();
    }

    initializeClaude() {
        // Wähle die beste deutsche Stimme
        setTimeout(() => {
            const voices = this.synthesis.getVoices();
            this.claudePersonality.voice = voices.find(v => 
                v.lang.includes('de') && v.name.includes('Google')
            ) || voices.find(v => v.lang.includes('de')) || voices[0];
            
            // Begrüßung
            this.claudeSays(
                "Hallo! Ich bin Claude, dein Minecraft-Mod-Assistent! " +
                "Ich helfe dir, coole Sachen zu bauen und erkläre dir dabei, wie alles funktioniert!"
            );
        }, 1000);
    }
    initializeRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.lang = 'de-DE';
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
            this.recognition.maxAlternatives = 3;

            this.recognition.onstart = () => {
                this.isListening = true;
                document.getElementById('voice-btn').classList.add('recording');
                document.getElementById('voice-status').textContent = 'Ich höre zu...';
                this.playSound('listening');
            };

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                document.getElementById('voice-status').textContent = `"${transcript}"`;
                
                if (event.results[0].isFinal) {
                    console.log('Verstanden:', transcript);
                    this.processCommand(transcript);
                }
            };

            this.recognition.onerror = (event) => {
                console.error('Fehler:', event.error);
                this.claudeSays("Oh, ich konnte dich nicht verstehen. Versuch es nochmal!");
                this.stopListening();
            };
            this.recognition.onend = () => {
                this.stopListening();
            };
        } else {
            alert('Dein Browser unterstützt keine Spracherkennung. Verwende Chrome oder Edge!');
        }
    }

    processCommand(command) {
        const cmd = command.toLowerCase();
        
        // Erkenne Befehle mit KI-ähnlicher Flexibilität
        const commandPatterns = {
            create: ['erstelle', 'mache', 'baue', 'zeige', 'ich möchte', 'ich will'],
            block: ['block', 'box', 'würfel', 'kubus', 'klotz'],
            item: ['item', 'werkzeug', 'schwert', 'axt', 'spitzhacke', 'waffe'],
            color: ['farbe', 'färbe', 'male', 'mache.*bunt', 'regenbogen'],
            animate: ['bewege', 'drehe', 'rotiere', 'schwebe', 'fliege', 'pulsiere', 'wackle'],
            property: ['eigenschaft', 'härte', 'transparent', 'durchsichtig', 'leucht', 'hell'],
            size: ['größe', 'größer', 'kleiner', 'groß', 'klein', 'riesen', 'mini'],
            texture: ['textur', 'aussehen', 'material', 'stein', 'holz', 'gras', 'diamant'],
            help: ['hilfe', 'was kannst du', 'erkläre', 'zeig mir', 'tutorial']
        };

        // Analysiere den Befehl
        let action = null;
        let target = null;
        let properties = {};
        
        // Finde Aktion und Ziel
        for (const [key, patterns] of Object.entries(commandPatterns)) {
            if (patterns.some(p => new RegExp(p).test(cmd))) {
                if (!action && ['create', 'animate', 'property'].includes(key)) {
                    action = key;
                } else if (!target && ['block', 'item'].includes(key)) {
                    target = key;
                }
            }
        }
        // Extrahiere Eigenschaften aus dem Befehl
        properties = this.extractAdvancedProperties(cmd);

        // Führe passende Aktion aus
        if (cmd.includes('hilfe')) {
            this.showInteractiveHelp();
        } else if (action === 'create' || target) {
            this.handleCreation(target || 'block', properties, cmd);
        } else if (action === 'animate') {
            this.handleAnimation(cmd);
        } else if (action === 'property' || cmd.includes('eigenschaft')) {
            this.handlePropertyChange(cmd);
        } else {
            this.claudeSays(
                "Hmm, das verstehe ich noch nicht ganz. " +
                "Versuch es mal so: 'Erstelle einen Block' oder 'Mache ihn blau'!"
            );
        }
    }

    extractAdvancedProperties(cmd) {
        const props = {
            name: 'MeinBlock',
            texture: 'stone',
            color: null,
            size: 1,
            hardness: 1,
            transparent: false,
            luminance: 0,
            gravity: false,
            breakable: true
        };

        // Textur-Erkennung
        if (cmd.includes('stein')) props.texture = 'stone';
        if (cmd.includes('holz')) props.texture = 'wood';
        if (cmd.includes('gras')) props.texture = 'grass';
        if (cmd.includes('diamant')) props.texture = 'diamond';
        if (cmd.includes('glas')) {
            props.texture = 'glass';
            props.transparent = true;
        }
        // Farb-Erkennung
        const colors = {
            'rot': '#ff0000', 'blau': '#0000ff', 'grün': '#00ff00',
            'gelb': '#ffff00', 'lila': '#ff00ff', 'orange': '#ff8800',
            'pink': '#ff69b4', 'schwarz': '#000000', 'weiß': '#ffffff',
            'türkis': '#00ffff', 'braun': '#8B4513'
        };
        
        for (const [colorName, colorCode] of Object.entries(colors)) {
            if (cmd.includes(colorName)) {
                props.color = colorCode;
                props.texture = null; // Farbe überschreibt Textur
            }
        }

        // Spezial-Eigenschaften
        if (cmd.includes('leucht') || cmd.includes('hell') || cmd.includes('licht')) {
            props.luminance = 15;
        }
        if (cmd.includes('transparent') || cmd.includes('durchsichtig')) {
            props.transparent = true;
        }
        if (cmd.includes('unzerstörbar') || cmd.includes('unkaputtbar')) {
            props.breakable = false;
            props.hardness = -1;
        }
        if (cmd.includes('schwer')) props.gravity = true;
        
        // Größen-Erkennung
        if (cmd.includes('riesen') || cmd.includes('sehr groß')) props.size = 3;
        else if (cmd.includes('groß')) props.size = 2;
        else if (cmd.includes('klein')) props.size = 0.5;
        else if (cmd.includes('mini') || cmd.includes('winzig')) props.size = 0.25;

        // Härte-Level
        if (cmd.includes('sehr hart')) props.hardness = 10;
        else if (cmd.includes('hart')) props.hardness = 5;
        else if (cmd.includes('weich')) props.hardness = 0.5;

        return props;
    }
    handleCreation(type, properties, originalCommand) {
        // Claude erklärt was er macht
        let explanation = `Super! Ich ${type === 'block' ? 'baue einen Block' : 'erstelle ein Item'} für dich. `;
        
        // Erkläre die Eigenschaften
        if (properties.texture) {
            explanation += `Ich verwende die ${properties.texture}-Textur, genau wie in Minecraft! `;
        }
        if (properties.color) {
            explanation += `Mit deiner Lieblingsfarbe! `;
        }
        if (properties.luminance > 0) {
            explanation += `Der Block leuchtet sogar im Dunkeln! Das ist toll für Höhlen. `;
        }
        if (properties.transparent) {
            explanation += `Er ist durchsichtig, man kann hindurchschauen! `;
        }
        if (!properties.breakable) {
            explanation += `Wow, unzerstörbar wie Bedrock! `;
        }
        if (properties.size !== 1) {
            const sizeText = properties.size > 1 ? 'extra groß' : 'klein';
            explanation += `Ich mache ihn ${sizeText} für dich! `;
        }

        this.claudeSays(explanation);

        // Erstelle das Objekt
        if (type === 'block') {
            window.viewer3D.createBlock(properties);
            this.currentObject = { type: 'block', properties };
        } else {
            window.viewer3D.createItem(properties);
            this.currentObject = { type: 'item', properties };
        }

        // Update Properties Panel mit Erklärungen
        this.updatePropertiesWithExplanations(properties);
        
        // Speichere in MCreator
        if (window.mcreatorBridge) {
            if (type === 'block') {
                window.mcreatorBridge.createBlock(properties);
            } else {
                window.mcreatorBridge.createItem(properties);
            }
        }

        // Lern-Tipp
        setTimeout(() => {
            this.giveLearningTip(type, properties);
        }, 3000);
    }
    handlePropertyChange(command) {
        if (!this.currentObject) {
            this.claudeSays("Du musst erst etwas erstellen, bevor du es verändern kannst!");
            return;
        }

        const props = this.extractAdvancedProperties(command);
        let changed = [];

        // Erkenne was geändert werden soll
        if (command.includes('größer')) {
            this.currentObject.properties.size *= 1.5;
            changed.push('größer');
        }
        if (command.includes('kleiner')) {
            this.currentObject.properties.size *= 0.75;
            changed.push('kleiner');
        }
        if (command.includes('härter')) {
            this.currentObject.properties.hardness += 2;
            changed.push('härter');
        }
        if (props.color && props.color !== this.currentObject.properties.color) {
            this.currentObject.properties.color = props.color;
            changed.push('die Farbe');
        }
        if (props.luminance > 0 && this.currentObject.properties.luminance === 0) {
            this.currentObject.properties.luminance = props.luminance;
            changed.push('leuchtend');
        }

        if (changed.length > 0) {
            // Wende Änderungen an
            if (this.currentObject.type === 'block') {
                window.viewer3D.createBlock(this.currentObject.properties);
            }
            
            // Claude erklärt die Änderung
            this.claudeSays(
                `Ich habe ${changed.join(' und ')} gemacht! ` +
                `In Minecraft nennt man das "Block-Properties". ` +
                `Jeder Block hat Eigenschaften die bestimmen, wie er sich verhält!`
            );
            
            this.updatePropertiesWithExplanations(this.currentObject.properties);
        } else {
            this.claudeSays("Sag mir genauer, was ich ändern soll! Zum Beispiel: 'Mache ihn größer' oder 'Mache ihn blau'");
        }
    }
    handleAnimation(command) {
        const animations = [];
        
        if (command.includes('dreh') || command.includes('rotier')) {
            window.viewer3D.startRotation();
            animations.push('Rotation');
        }
        if (command.includes('schweb') || command.includes('flieg')) {
            window.viewer3D.startFloating();
            animations.push('Schweben');
        }
        if (command.includes('pulsier') || command.includes('pump')) {
            window.viewer3D.startPulsing();
            animations.push('Pulsieren');
        }
        if (command.includes('regenbogen') || command.includes('bunt')) {
            window.viewer3D.applyRainbowEffect();
            animations.push('Regenbogen-Effekt');
        }
        if (command.includes('wackel') || command.includes('zitter')) {
            window.viewer3D.startShaking();
            animations.push('Wackeln');
        }

        if (animations.length > 0) {
            this.claudeSays(
                `Cool! Ich habe ${animations.join(' und ')} aktiviert! ` +
                `Animationen machen deine Mods lebendiger. ` +
                `In echten Minecraft-Mods kannst du solche Effekte mit Code programmieren!`
            );
        } else {
            this.claudeSays("Welche Animation möchtest du? Sag zum Beispiel: 'Lass es schweben' oder 'Drehe den Block'");
        }
    }

    giveLearningTip(type, properties) {
        const tips = [
            `Wusstest du? In Minecraft hat jeder Block eine Härte von 0 bis 50. Obsidian hat 50!`,
            `Tipp: Leuchtende Blöcke haben einen Licht-Level von 1 bis 15. Glowstone hat 15!`,
            `Fun Fact: Transparente Blöcke lassen Licht durch und Monster können nicht darauf spawnen!`,
            `Minecraft-Wissen: Die meisten Blöcke sind 1x1x1 Meter groß in der echten Welt!`,
            `Cool: Mit Redstone kannst du Blöcke zum Leben erwecken und Maschinen bauen!`,
            `Profi-Tipp: Verschiedene Werkzeuge brechen verschiedene Blöcke schneller ab!`
        ];

        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        
        setTimeout(() => {
            this.claudeSays(randomTip);
        }, 2000);
    }
    updatePropertiesWithExplanations(properties) {
        const panel = document.getElementById('properties-content');
        panel.innerHTML = `
            <div class="property-group">
                <h4>🎨 Aussehen</h4>
                <div class="property-item">
                    <label>Textur:</label>
                    <select onchange="voiceControl.updateProperty('texture', this.value)">
                        <option value="stone" ${properties.texture === 'stone' ? 'selected' : ''}>Stein</option>
                        <option value="wood" ${properties.texture === 'wood' ? 'selected' : ''}>Holz</option>
                        <option value="grass" ${properties.texture === 'grass' ? 'selected' : ''}>Gras</option>
                        <option value="diamond" ${properties.texture === 'diamond' ? 'selected' : ''}>Diamant</option>
                    </select>
                    <span class="property-help">Bestimmt das Aussehen</span>
                </div>
                ${properties.color ? `
                <div class="property-item">
                    <label>Farbe:</label>
                    <input type="color" value="${properties.color}" 
                           onchange="voiceControl.updateProperty('color', this.value)">
                    <span class="property-help">Deine gewählte Farbe</span>
                </div>` : ''}
            </div>

            <div class="property-group">
                <h4>⚙️ Eigenschaften</h4>
                <div class="property-item">
                    <label>Größe:</label>
                    <input type="range" min="0.25" max="3" step="0.25" 
                           value="${properties.size}" 
                           onchange="voiceControl.updateProperty('size', this.value)">
                    <span class="value">${properties.size}x</span>
                </div>
                <div class="property-item">
                    <label>Härte:</label>
                    <input type="range" min="0" max="10" step="0.5" 
                           value="${properties.hardness}" 
                           onchange="voiceControl.updateProperty('hardness', this.value)">
                    <span class="value">${properties.hardness}</span>
                    <span class="property-help">Wie schwer zu zerstören</span>
                </div>
                <div class="property-item">
                    <label>Leuchtkraft:</label>
                    <input type="range" min="0" max="15" 
                           value="${properties.luminance}" 
                           onchange="voiceControl.updateProperty('luminance', this.value)">
                    <span class="value">${properties.luminance}</span>
                    <span class="property-help">0 = dunkel, 15 = hell wie Glowstone</span>
                </div>
            </div>

            <div class="property-group">
                <h4>🎮 Spezial</h4>
                <div class="property-item">
                    <label>
                        <input type="checkbox" ${properties.transparent ? 'checked' : ''}
                               onchange="voiceControl.updateProperty('transparent', this.checked)">
                        Transparent
                    </label>
                    <span class="property-help">Man kann durchschauen</span>
                </div>
                <div class="property-item">
                    <label>
                        <input type="checkbox" ${properties.gravity ? 'checked' : ''}
                               onchange="voiceControl.updateProperty('gravity', this.checked)">
                        Gravitation
                    </label>
                    <span class="property-help">Fällt wie Sand herunter</span>
                </div>
                <div class="property-item">
                    <label>
                        <input type="checkbox" ${!properties.breakable ? 'checked' : ''}
                               onchange="voiceControl.updateProperty('breakable', !this.checked)">
                        Unzerstörbar
                    </label>
                    <span class="property-help">Wie Bedrock!</span>
                </div>
            </div>

            <button onclick="voiceControl.explainCurrentObject()" class="explain-btn">
                🎓 Claude, erkläre mir das!
            </button>
        `;
    }
    updateProperty(property, value) {
        if (!this.currentObject) return;
        
        // Konvertiere Werte
        if (property === 'size' || property === 'hardness' || property === 'luminance') {
            value = parseFloat(value);
        }
        
        this.currentObject.properties[property] = value;
        
        // Update 3D View
        if (this.currentObject.type === 'block') {
            window.viewer3D.createBlock(this.currentObject.properties);
        }
        
        // Claude kommentiert die Änderung
        const comments = {
            'texture': `Die Textur wurde zu ${value} geändert!`,
            'color': `Schöne Farbe! Das macht deinen Block einzigartig!`,
            'size': value > 1 ? `Wow, richtig groß!` : `Klein aber fein!`,
            'hardness': value > 5 ? `Super hart! Fast unzerstörbar!` : `Leicht zu brechen!`,
            'luminance': value > 0 ? `Es leuchtet! Perfekt für dunkle Höhlen!` : `Kein Licht mehr.`,
            'transparent': value ? `Jetzt kann man durchschauen!` : `Nicht mehr transparent.`,
            'gravity': value ? `Pass auf, es fällt jetzt runter!` : `Bleibt jetzt in der Luft!`,
            'breakable': !value ? `Unzerstörbar wie Bedrock!` : `Kann wieder zerstört werden.`
        };
        
        if (comments[property]) {
            this.claudeSays(comments[property]);
        }
    }

    explainCurrentObject() {
        if (!this.currentObject) {
            this.claudeSays("Erstelle erst etwas, dann erkläre ich es dir!");
            return;
        }

        const props = this.currentObject.properties;
        let explanation = `Lass mich dir deinen ${this.currentObject.type} erklären! `;
        
        explanation += `Er hat eine Härte von ${props.hardness}. `;
        if (props.hardness < 1) {
            explanation += "Das ist sehr weich, wie Erde. Du kannst ihn mit der Hand abbauen! ";
        } else if (props.hardness < 5) {
            explanation += "Das ist mittelfest, wie Stein. Du brauchst eine Spitzhacke! ";  
        } else {
            explanation += "Das ist super hart, wie Obsidian. Das dauert lange zum Abbauen! ";
        }
        
        if (props.luminance > 0) {
            explanation += `Er leuchtet mit Stärke ${props.luminance}. `;
            if (props.luminance === 15) {
                explanation += "Das ist so hell wie Glowstone - das hellste in Minecraft! ";
            }
        }
        
        if (props.transparent) {
            explanation += "Er ist durchsichtig. Monster können nicht darauf spawnen! ";
        }
        
        if (props.gravity) {
            explanation += "Er fällt herunter wie Sand oder Kies. Pass auf beim Bauen! ";
        }
        
        this.claudeSays(explanation);
    }
    showInteractiveHelp() {
        const helpText = `
            Ich bin Claude und kann dir helfen, tolle Minecraft-Mods zu bauen! 
            Hier ist was du sagen kannst:
            
            BLÖCKE ERSTELLEN: 'Erstelle einen Stein-Block', 'Mache eine leuchtende Box'
            
            ITEMS MACHEN: 'Zeige mir ein Schwert', 'Baue eine Axt'
            
            FARBEN: 'Mache ihn blau', 'Färbe es rot', 'Regenbogenfarben'
            
            EIGENSCHAFTEN: 'Mache ihn größer', 'Härter machen', 'Lass es leuchten'
            
            ANIMATIONEN: 'Lass es schweben', 'Drehe den Block', 'Pulsieren lassen'
            
            SPEZIAL: 'Mache ihn unzerstörbar', 'Transparent wie Glas', 'Mit Gravitation'
            
            Sag einfach was du dir vorstellst und ich helfe dir dabei!
        `;
        
        this.claudeSays(helpText);
        
        // Zeige auch visuell
        this.showVisualHelp();
    }

    showVisualHelp() {
        // Erstelle ein Hilfe-Overlay
        const overlay = document.createElement('div');
        overlay.className = 'help-overlay';
        overlay.innerHTML = `
            <div class="help-content">
                <h2>🎮 Claude's Minecraft Mod-Schule</h2>
                <div class="help-examples">
                    <div class="example-card">
                        <span class="example-icon">🗣️</span>
                        <span class="example-text">"Erstelle einen leuchtenden Diamantblock"</span>
                    </div>
                    <div class="example-card">
                        <span class="example-icon">🗣️</span>
                        <span class="example-text">"Mache ihn regenbogenfarben und lass ihn schweben"</span>
                    </div>
                    <div class="example-card">
                        <span class="example-icon">🗣️</span>
                        <span class="example-text">"Zeige mir ein riesiges Schwert"</span>
                    </div>
                </div>
                <button onclick="this.parentElement.parentElement.remove()">Verstanden! 👍</button>
            </div>
        `;
        document.body.appendChild(overlay);
        
        setTimeout(() => overlay.classList.add('show'), 100);
    }

    claudeSays(text) {
        // Text-to-Speech mit Claude's Stimme
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'de-DE';
        utterance.rate = 0.95;
        utterance.pitch = 1.1;
        utterance.volume = 1.0;
        
        if (this.claudePersonality.voice) {
            utterance.voice = this.claudePersonality.voice;
        }
        
        // Zeige auch visuell
        this.showClaudeMessage(text);
        
        // Spreche
        this.synthesis.speak(utterance);
    }

    showClaudeMessage(text) {
        const claudeStatus = document.getElementById('claude-status');
        claudeStatus.innerHTML = `🤖 Claude: ${text}`;
        claudeStatus.classList.add('speaking');
        
        setTimeout(() => {
            claudeStatus.classList.remove('speaking');
        }, 3000);
    }

    playSound(type) {
        // Füge Sound-Effekte hinzu (später)
        console.log(`Sound: ${type}`);
    }

    startListening() {
        if (this.recognition && !this.isListening) {
            this.recognition.start();
        }
    }

    stopListening() {
        this.isListening = false;
        document.getElementById('voice-btn').classList.remove('recording');
        document.getElementById('voice-status').textContent = 'Bereit für neue Befehle...';
        if (this.recognition) {
            this.recognition.stop();
        }
    }
}

// Initialisierung
const voiceControl = new VoiceControl();