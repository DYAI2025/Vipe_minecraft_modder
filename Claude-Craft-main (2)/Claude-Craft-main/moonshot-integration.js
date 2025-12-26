// Enhanced Moonshot AI Integration für Claude-Craft
// Verbesserte Version mit Error-Handling und Fallback

// Lade Environment-Variablen (falls verfügbar)
const MOONSHOT_CONFIG = {
    apiKey: process.env?.MOONSHOT_API_KEY || localStorage.getItem('moonshot_api_key') || '',
    model: process.env?.MOONSHOT_MODEL || 'moonshot-v1-8k',
    endpoint: process.env?.MOONSHOT_ENDPOINT || 'https://api.moonshot.cn/v1/chat/completions'
};

// Status-Anzeige für KI-Verbindung
function updateAIStatus(connected = false, message = '') {
    const statusElement = document.querySelector('.ai-status');
    if (statusElement) {
        if (connected) {
            statusElement.classList.add('connected');
            statusElement.innerHTML = `
                <div class="ai-indicator"></div>
                <span>KI Aktiv: ${message}</span>
            `;
        } else {
            statusElement.classList.remove('connected');
            statusElement.innerHTML = `
                <div class="ai-indicator" style="background: #ff4444;"></div>
                <span>KI Offline: ${message}</span>
            `;
        }
    }
}

// Verbesserte AI-gestützte Sprachverarbeitung
async function processWithMoonshot(userInput) {
    // Check ob API Key vorhanden
    if (!MOONSHOT_CONFIG.apiKey || MOONSHOT_CONFIG.apiKey === 'your_moonshot_api_key_here') {
        console.warn('Kein Moonshot API Key konfiguriert, nutze lokale Verarbeitung');
        updateAIStatus(false, 'Kein API Key');
        return fallbackProcessing(userInput);
    }

    try {
        updateAIStatus(true, 'Verarbeite...');
        
        const response = await fetch(MOONSHOT_CONFIG.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MOONSHOT_CONFIG.apiKey}`
            },
            body: JSON.stringify({
                model: MOONSHOT_CONFIG.model,
                messages: [
                    {
                        role: 'system',
                        content: `Du bist ein Minecraft Mod-Assistent für Kinder. 
                        Interpretiere Benutzerwünsche und konvertiere sie in Minecraft-Block/Item-Eigenschaften.
                        
                        WICHTIG: Antworte NUR mit einem JSON-Objekt, keine Erklärung!
                        
                        Beispiel-Ausgaben:
                        {
                            "name": "Magischer Diamantblock",
                            "type": "block",
                            "material": "diamond",
                            "properties": {
                                "lightLevel": 15,
                                "hardness": 5.0,
                                "resistance": 6.0,
                                "color": "#00ffff",
                                "effects": ["glowing", "particles"],
                                "drops": "diamond",
                                "tool": "pickaxe"
                            },
                            "animations": ["float", "pulse"],
                            "special": {
                                "unbreakable": false,
                                "extraHearts": 10,
                                "damage": 0
                            }
                        }`
                    },
                    {
                        role: 'user',
                        content: userInput
                    }
                ],
                temperature: 0.7,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;
        
        // Parse AI response
        try {
            const properties = JSON.parse(aiResponse);
            updateAIStatus(true, 'Erfolgreich');
            console.log('✅ KI-Antwort:', properties);
            return properties;
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            // Versuche aus Text zu extrahieren
            return extractPropertiesFromText(aiResponse);
        }
        
    } catch (error) {
        console.error('Moonshot AI Error:', error);
        updateAIStatus(false, error.message);
        // Fallback zu lokaler Verarbeitung
        return fallbackProcessing(userInput);
    }
}

// Extrahiere Properties aus KI-Text falls JSON fehlschlägt
function extractPropertiesFromText(text) {
    const properties = {
        name: 'Magisches Item',
        type: 'block',
        properties: {}
    };
    
    // Versuche JSON aus Text zu finden
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        try {
            return JSON.parse(jsonMatch[0]);
        } catch (e) {
            // Continue with text extraction
        }
    }
    
    // Extrahiere Eigenschaften aus Text
    if (text.includes('leucht') || text.includes('Licht')) {
        properties.properties.lightLevel = 15;
    }
    if (text.includes('unzerstörbar')) {
        properties.special = { unbreakable: true };
    }
    
    return properties;
}

// Erweiterte Fallback-Verarbeitung ohne KI
function fallbackProcessing(text) {
    const lower = text.toLowerCase();
    
    const result = {
        name: generateName(text),
        type: detectType(lower),
        properties: {},
        animations: [],
        special: {}
    };
    
    // Material erkennen
    const materials = {
        'diamant': { material: 'diamond', color: '#00ffff', hardness: 5.0 },
        'gold': { material: 'gold', color: '#ffd700', hardness: 3.0 },
        'eisen': { material: 'iron', color: '#c0c0c0', hardness: 4.0 },
        'smaragd': { material: 'emerald', color: '#00ff00', hardness: 5.0 },
        'rubin': { material: 'ruby', color: '#ff0000', hardness: 5.0 },
        'glas': { material: 'glass', color: '#ffffff', hardness: 0.5, transparent: true },
        'holz': { material: 'wood', color: '#8b4513', hardness: 2.0 },
        'stein': { material: 'stone', color: '#808080', hardness: 3.0 }
    };
    
    for (const [key, props] of Object.entries(materials)) {
        if (lower.includes(key)) {
            Object.assign(result.properties, props);
            break;
        }
    }
    
    // Effekte erkennen
    if (lower.includes('leucht') || lower.includes('licht')) {
        result.properties.lightLevel = 15;
    }
    if (lower.includes('explosion') || lower.includes('tnt')) {
        result.properties.explosive = true;
        result.properties.explosionPower = 4.0;
    }
    if (lower.includes('unzerstörbar')) {
        result.special.unbreakable = true;
        result.properties.hardness = -1;
    }
    
    // Animationen
    if (lower.includes('schweb') || lower.includes('flieg')) {
        result.animations.push('float');
    }
    if (lower.includes('rotier') || lower.includes('dreh')) {
        result.animations.push('rotate');
    }
    if (lower.includes('pulsier')) {
        result.animations.push('pulse');
    }
    
    // Spezielle Eigenschaften
    const heartsMatch = text.match(/(\d+)\s*(herz|heart)/i);
    if (heartsMatch) {
        result.special.extraHearts = parseInt(heartsMatch[1]);
    }
    
    const damageMatch = text.match(/(\d+)\s*(schaden|damage)/i);
    if (damageMatch) {
        result.special.damage = parseInt(damageMatch[1]);
    }
    
    return result;
}

// Hilfsfunktionen
function generateName(text) {
    // Generiere einen passenden Namen
    const words = text.split(' ').filter(w => w.length > 2);
    if (words.length > 0) {
        return words.slice(0, 3).join(' ');
    }
    return 'Magisches Item';
}

function detectType(text) {
    if (text.includes('schwert') || text.includes('waffe')) return 'sword';
    if (text.includes('spitzhacke') || text.includes('pickaxe')) return 'pickaxe';
    if (text.includes('axt') || text.includes('axe')) return 'axe';
    if (text.includes('bogen') || text.includes('bow')) return 'bow';
    if (text.includes('rüstung') || text.includes('armor')) return 'armor';
    return 'block';
}

// Integration in die App
function initAI() {
    // Prüfe API Key Status
    if (MOONSHOT_CONFIG.apiKey && MOONSHOT_CONFIG.apiKey !== 'your_moonshot_api_key_here') {
        updateAIStatus(true, 'Bereit');
        console.log('✅ Moonshot AI Integration aktiv!');
    } else {
        updateAIStatus(false, 'Konfiguration fehlt');
        console.log('⚠️ Moonshot API Key nicht konfiguriert - Nutze lokale Verarbeitung');
    }
    
    // API Key Setup Dialog
    if (!MOONSHOT_CONFIG.apiKey) {
        const setupBtn = document.createElement('button');
        setupBtn.className = 'ai-setup-btn';
        setupBtn.innerHTML = '🔧 KI Konfigurieren';
        setupBtn.onclick = () => {
            const key = prompt('Bitte gib deinen Moonshot API Key ein:');
            if (key) {
                localStorage.setItem('moonshot_api_key', key);
                MOONSHOT_CONFIG.apiKey = key;
                location.reload();
            }
        };
        document.querySelector('.header')?.appendChild(setupBtn);
    }
}

// Auto-Initialize
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', initAI);
}

// Export für Module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        processWithMoonshot,
        fallbackProcessing,
        MOONSHOT_CONFIG,
        initAI
    };
}