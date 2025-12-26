// KI-Integration für Claude-Mod-Creator
// Verbesserte Version mit Fallback und lokaler Mustererkennung

class AIIntegration {
    constructor() {
        this.apiKey = process.env.OPENAI_API_KEY || '';
        this.hasAPI = this.apiKey.length > 0;
    }

    // Hauptfunktion: Parse natürliche Sprache zu Item-Eigenschaften
    async parseCommand(command) {
        console.log('🤖 KI analysiert:', command);
        
        // Versuche API wenn verfügbar
        if (this.hasAPI) {
            try {
                return await this.parseWithAPI(command);
            } catch (error) {
                console.warn('API-Fehler, verwende Fallback:', error.message);
            }
        }
        
        // Fallback zu lokaler Analyse
        return this.parseLocally(command);
    }

    // Lokale Mustererkennung (funktioniert immer!)
    parseLocally(command) {
        const lower = command.toLowerCase();
        
        // Basis-Struktur
        let result = {
            name: 'Custom Item',
            type: 'sword',
            properties: {
                health: 0,
                damage: 10,
                speed: 0,
                jump: 0,
                fire: 0,
                durability: 100,
                special: []
            }
        };

        // === ITEM-TYP ERKENNUNG ===
        if (lower.includes('schwert') || lower.includes('sword')) {
            result.type = 'sword';
            result.name = 'Magisches Schwert';
            result.properties.damage = 30;
        } else if (lower.includes('bogen') || lower.includes('bow')) {
            result.type = 'bow';
            result.name = 'Verzauberter Bogen';
            result.properties.damage = 25;
        } else if (lower.includes('spitzhacke') || lower.includes('pickaxe')) {
            result.type = 'pickaxe';
            result.name = 'Super Spitzhacke';
            result.properties.damage = 15;
        } else if (lower.includes('axt') || lower.includes('axe')) {
            result.type = 'axe';
            result.name = 'Kampfaxt';
            result.properties.damage = 35;
        } else if (lower.includes('rüstung') || lower.includes('armor') || lower.includes('brustpanzer')) {
            result.type = 'armor';
            result.name = 'Legendäre Rüstung';
            result.properties.health = 30;
            result.properties.damage = 0;
        } else if (lower.includes('helm') || lower.includes('helmet')) {
            result.type = 'helmet';
            result.name = 'Magischer Helm';
            result.properties.health = 15;
        } else if (lower.includes('block') || lower.includes('diamant')) {
            result.type = 'block';
            result.name = 'Magischer Block';
            result.properties.health = 20;
        } else if (lower.includes('trank') || lower.includes('potion')) {
            result.type = 'potion';
            result.name = 'Zaubertrank';
            result.properties.health = 50;
        }

        // === EIGENSCHAFTEN ERKENNUNG ===
        
        // Schaden/Damage
        const damagePatterns = [
            /(\d+)\s*(schaden|damage|dmg)/i,
            /(schaden|damage):\s*(\d+)/i,
            /mit\s+(\d+)\s+schaden/i
        ];
        
        for (let pattern of damagePatterns) {
            const match = lower.match(pattern);
            if (match) {
                result.properties.damage = parseInt(match[1] || match[2]);
                break;
            }
        }

        // Gesundheit/Health
        const healthPatterns = [
            /(\d+)\s*(herz|hp|health|leben|gesundheit)/i,
            /(herz|health):\s*(\d+)/i,
            /heilt?\s+(\d+)/i
        ];
        
        for (let pattern of healthPatterns) {
            const match = lower.match(pattern);
            if (match) {
                result.properties.health = parseInt(match[1] || match[2] || match[3]);
                break;
            }
        }

        // Feuer
        if (lower.includes('feuer') || lower.includes('fire') || lower.includes('flamm') || lower.includes('brennen')) {
            const fireMatch = lower.match(/(\d+)\s*(feuer|fire|sekunden)/);
            result.properties.fire = fireMatch ? parseInt(fireMatch[1]) : 5;
            result.properties.special.push('🔥 Feuer-Aspekt');
            if (!result.name.includes('Feuer')) {
                result.name = 'Feuer-' + result.name;
            }
        }

        // Geschwindigkeit
        if (lower.includes('schnell') || lower.includes('speed') || lower.includes('geschwindigkeit')) {
            const speedMatch = lower.match(/(\d+)\s*(speed|geschwindigkeit)/);
            result.properties.speed = speedMatch ? parseInt(speedMatch[1]) : 5;
            result.properties.special.push('💨 Geschwindigkeits-Boost');
        }

        // Sprungkraft
        if (lower.includes('sprung') || lower.includes('jump') || lower.includes('hüpf') || lower.includes('springen')) {
            const jumpMatch = lower.match(/(\d+)\s*(sprung|jump)/);
            result.properties.jump = jumpMatch ? parseInt(jumpMatch[1]) : 5;
            result.properties.special.push('🦘 Sprungkraft');
        }

        // Haltbarkeit
        if (lower.includes('unzerstörbar') || lower.includes('unbreakable') || lower.includes('unkaputtbar')) {
            result.properties.durability = 10000;
            result.properties.special.push('♾️ Unzerstörbar');
        }

        // === SPEZIAL-KEYWORDS ===
        
        // Ultimativ
        if (lower.includes('ultimativ') || lower.includes('ultimate')) {
            result.properties.damage = Math.max(result.properties.damage, 100);
            result.properties.health = Math.max(result.properties.health, 50);
            result.properties.speed = 10;
            result.properties.jump = 10;
            result.properties.fire = 10;
            result.properties.durability = 10000;
            result.name = 'Ultimatives ' + result.name;
            result.properties.special.push('⚡ ULTIMATIV');
        }

        // Legendär
        if (lower.includes('legendär') || lower.includes('legendary') || lower.includes('episch')) {
            result.properties.damage = Math.max(result.properties.damage, 75);
            result.properties.durability = Math.max(result.properties.durability, 5000);
            if (!result.name.includes('Legendär')) {
                result.name = 'Legendäres ' + result.name;
            }
            result.properties.special.push('💎 LEGENDÄR');
        }

        // Magisch
        if (lower.includes('magisch') || lower.includes('magic') || lower.includes('verzaubert')) {
            result.properties.damage = Math.max(result.properties.damage, 40);
            result.properties.special.push('🔮 Magisch');
        }

        // Gift
        if (lower.includes('gift') || lower.includes('poison') || lower.includes('toxisch')) {
            result.properties.special.push('☠️ Gift-Effekt');
        }

        // Blitz
        if (lower.includes('blitz') || lower.includes('lightning') || lower.includes('donner')) {
            result.properties.special.push('⚡ Blitz-Schlag');
        }

        // Explosion
        if (lower.includes('explosion') || lower.includes('explodier') || lower.includes('tnt')) {
            result.properties.special.push('💥 Explosiv');
        }

        // === POWER LEVEL BERECHNUNG ===
        result.powerLevel = this.calculatePowerLevel(result.properties);

        return result;
    }

    // Power Level Berechnung
    calculatePowerLevel(properties) {
        let score = 0;
        
        score += properties.health * 2;
        score += properties.damage * 3;
        score += properties.speed * 10;
        score += properties.jump * 8;
        score += properties.fire * 5;
        score += properties.durability >= 10000 ? 100 : properties.durability / 100;
        score += properties.special.length * 20;
        
        if (score > 300) return '⚡ GOTTGLEICH';
        if (score > 200) return '💎 LEGENDÄR';
        if (score > 150) return '🔮 EPISCH';
        if (score > 100) return '✨ SELTEN';
        if (score > 50) return '🌟 UNGEWÖHNLICH';
        return '⚪ NORMAL';
    }

    // API-basierte Analyse (wenn API-Key vorhanden)
    async parseWithAPI(command) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: `Du bist ein Minecraft Item Creator. Analysiere den Befehl und gib ein JSON zurück:
                        {
                            "name": "Item Name",
                            "type": "sword|bow|pickaxe|axe|armor|helmet|block|potion",
                            "properties": {
                                "health": 0-100,
                                "damage": 0-200,
                                "speed": 0-10,
                                "jump": 0-10,
                                "fire": 0-10,
                                "durability": 100-10000,
                                "special": ["array of special effects"]
                            }
                        }`
                    },
                    {
                        role: 'user',
                        content: command
                    }
                ],
                temperature: 0.7,
                max_tokens: 300
            })
        });

        if (!response.ok) {
            throw new Error('API request failed');
        }

        const data = await response.json();
        const result = JSON.parse(data.choices[0].message.content);
        result.powerLevel = this.calculatePowerLevel(result.properties);
        
        return result;
    }

    // Generiere Vorschläge
    generateSuggestions(currentItem) {
        const suggestions = [];
        
        if (currentItem.properties.damage < 50) {
            suggestions.push('💡 Erhöhe den Schaden für mehr Power!');
        }
        
        if (!currentItem.properties.fire) {
            suggestions.push('🔥 Füge Feuer-Effekt hinzu!');
        }
        
        if (currentItem.properties.durability < 1000) {
            suggestions.push('🔧 Mache es unzerstörbar!');
        }
        
        if (currentItem.powerLevel === '⚪ NORMAL') {
            suggestions.push('⚡ Füge mehr Eigenschaften für höheres Power-Level hinzu!');
        }
        
        return suggestions;
    }
}

// Export für Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIIntegration;
}