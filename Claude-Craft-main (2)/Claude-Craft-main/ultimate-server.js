// ULTIMATE Claude-Craft Server - Vollständige Implementation
// Alle Features in einem robusten Server

const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Import AI Integration
const AIIntegration = require('./ai-integration');

const app = express();
const PORT = 8085;  // Neuer Port
const ai = new AIIntegration();

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// CORS für alle Requests
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Permissions-Policy', 'microphone=*'); // Für Sprachsteuerung
    next();
});

// Workspace-Pfade
const MCREATOR_WORKSPACE = 'C:\\Users\\User\\MCreatorWorkspaces\\ClaudeCraftUltimate';
const MCREATOR_PATH = 'C:\\Program Files\\Pylo\\MCreator\\mcreator.exe';

// =========================
// API ENDPOINTS
// =========================

// 1. KI-Integration - Parse natürliche Sprache
app.post('/api/ai/parse', async (req, res) => {
    const { command } = req.body;
    console.log('📝 KI-Befehl erhalten:', command);
    
    try {
        const result = await ai.parseCommand(command);
        console.log('✅ KI-Ergebnis:', result);
        res.json({ 
            success: true, 
            result,
            suggestions: ai.generateSuggestions(result)
        });
    } catch (error) {
        console.error('❌ KI-Fehler:', error);
        // Fallback zu lokaler Analyse
        const fallback = ai.parseLocally(command);
        res.json({ 
            success: true, 
            result: fallback,
            fallback: true 
        });
    }
});

// 2. Item-Erstellung mit Eigenschaften
app.post('/api/items/create', async (req, res) => {
    const { name, type, properties } = req.body;
    console.log('🔨 Erstelle Item:', name);
    
    try {
        // Workspace vorbereiten
        await ensureWorkspace();
        
        // Mod-Element erstellen
        const modElement = {
            name: name.replace(/\s+/g, '_').toLowerCase(),
            type: type === 'block' ? 'Block' : 'Item',
            compiles: true,
            locked_code: false,
            registry_name: name.replace(/\s+/g, '_').toLowerCase(),
            metadata: {
                files: [],
                dependencies: []
            }
        };
        
        // Java-Code generieren
        const javaCode = generateJavaCode(name, type, properties);
        
        // Dateien speichern
        const modPath = path.join(MCREATOR_WORKSPACE, 'elements', `${modElement.name}.mod.json`);
        const javaPath = path.join(MCREATOR_WORKSPACE, 'src', 'main', 'java', 
            'net', 'mcreator', 'claudecraft', `${modElement.name}.java`);
        
        await fs.writeFile(modPath, JSON.stringify(modElement, null, 2));
        await fs.writeFile(javaPath, javaCode);
        
        res.json({ 
            success: true,
            message: `✅ ${name} wurde erfolgreich erstellt!`,
            paths: { modPath, javaPath }
        });
        
    } catch (error) {
        console.error('❌ Erstellungsfehler:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// 3. MCreator Export
app.post('/api/export/mcreator', async (req, res) => {
    const { items } = req.body;
    console.log('📦 Exportiere zu MCreator:', items.length, 'Items');
    
    try {
        await ensureWorkspace();
        
        // MCreator Workspace-Datei erstellen
        const workspace = {
            mod_elements: items.map(item => ({
                name: item.name.replace(/\s+/g, '_'),
                type: item.type === 'block' ? 'block' : 'item',
                compiles: true,
                locked_code: false,
                registry_name: item.name.replace(/\s+/g, '_').toLowerCase(),
                path: `~/items`
            })),
            workspaceSettings: {
                modid: 'claudecraftultimate',
                modName: 'Claude Craft Ultimate',
                version: '1.0.0',
                author: 'Claude AI',
                license: 'MIT',
                currentGenerator: 'neoforge-1.21.1',
                modElementsPackage: 'net.mcreator.claudecraft'
            },
            mcreatorVersion: 202500228610
        };
        
        const workspacePath = path.join(MCREATOR_WORKSPACE, 'ClaudeCraftUltimate.mcreator');
        await fs.writeFile(workspacePath, JSON.stringify(workspace, null, 2));
        
        // Alle Items als Java-Dateien generieren
        for (const item of items) {
            const javaCode = generateJavaCode(item.name, item.type, item.properties);
            const javaPath = path.join(MCREATOR_WORKSPACE, 'src', 'main', 'java',
                'net', 'mcreator', 'claudecraft', `${item.name.replace(/\s+/g, '')}.java`);
            await fs.writeFile(javaPath, javaCode);
        }
        
        res.json({ 
            success: true,
            message: `✅ ${items.length} Items nach MCreator exportiert!`,
            workspace: workspacePath
        });
        
    } catch (error) {
        console.error('❌ Export-Fehler:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// 4. Minecraft Command generieren
app.post('/api/export/command', async (req, res) => {
    const { name, type, properties } = req.body;
    
    try {
        const itemMap = {
            'sword': 'netherite_sword',
            'bow': 'bow',
            'pickaxe': 'netherite_pickaxe',
            'axe': 'netherite_axe',
            'armor': 'netherite_chestplate',
            'helmet': 'netherite_helmet',
            'block': 'diamond_block',
            'potion': 'potion'
        };
        
        let command = `/give @p ${itemMap[type] || 'stick'} 1 {`;
        
        // Attribute hinzufügen
        const attributes = [];
        if (properties.damage > 0) {
            attributes.push(`{AttributeName:"generic.attack_damage",Amount:${properties.damage},Operation:0}`);
        }
        if (properties.health > 0) {
            attributes.push(`{AttributeName:"generic.max_health",Amount:${properties.health * 2},Operation:0}`);
        }
        if (properties.speed > 0) {
            attributes.push(`{AttributeName:"generic.movement_speed",Amount:${properties.speed * 0.1},Operation:0}`);
        }
        
        if (attributes.length > 0) {
            command += `AttributeModifiers:[${attributes.join(',')}],`;
        }
        
        // Verzauberungen
        const enchantments = [];
        if (properties.fire > 0) {
            enchantments.push(`{id:"minecraft:fire_aspect",lvl:${properties.fire}}`);
        }
        if (properties.durability >= 10000) {
            enchantments.push(`{id:"minecraft:unbreaking",lvl:255}`);
            command += `Unbreakable:1b,`;
        }
        
        if (enchantments.length > 0) {
            command += `Enchantments:[${enchantments.join(',')}],`;
        }
        
        command += `display:{Name:'{"text":"${name}","color":"gold","bold":true}'}}`;
        
        res.json({ 
            success: true, 
            command 
        });
        
    } catch (error) {
        console.error('❌ Command-Fehler:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// 5. Status-Check
app.get('/api/status', async (req, res) => {
    try {
        // Check MCreator
        const { stdout } = await execPromise('tasklist /FI "IMAGENAME eq mcreator.exe"');
        const mcreatorRunning = stdout.toLowerCase().includes('mcreator.exe');
        
        // Check Workspace
        let workspaceExists = false;
        try {
            await fs.access(MCREATOR_WORKSPACE);
            workspaceExists = true;
        } catch {}
        
        res.json({
            server: true,
            mcreator: mcreatorRunning,
            workspace: workspaceExists,
            ai: ai.hasAPI,
            version: '2.0.0-ultimate'
        });
        
    } catch (error) {
        res.json({
            server: true,
            mcreator: false,
            workspace: false,
            ai: false,
            error: error.message
        });
    }
});

// =========================
// HELPER FUNCTIONS
// =========================

// Workspace sicherstellen
async function ensureWorkspace() {
    const dirs = [
        path.join(MCREATOR_WORKSPACE),
        path.join(MCREATOR_WORKSPACE, 'elements'),
        path.join(MCREATOR_WORKSPACE, 'src', 'main', 'java', 'net', 'mcreator', 'claudecraft'),
        path.join(MCREATOR_WORKSPACE, 'src', 'main', 'resources', 'assets', 'claudecraft')
    ];
    
    for (const dir of dirs) {
        await fs.mkdir(dir, { recursive: true });
    }
}

// Power Level lokal berechnen
function calculatePowerLevelLocal(properties) {
    const totalPower = 
        (properties.health || 0) * 2 +
        (properties.damage || 0) +
        (properties.speed || 0) * 10 +
        (properties.jump || 0) * 10 +
        (properties.fire || 0) * 5 +
        (properties.durability || 0) / 10;
    
    if (totalPower >= 500) return '⚡ GOTTGLEICH';
    if (totalPower >= 200) return '💎 LEGENDÄR';
    if (totalPower >= 100) return '💜 EPISCH';
    if (totalPower >= 50) return '🔵 SELTEN';
    if (totalPower >= 20) return '🌟 UNGEWÖHNLICH';
    return '⚪ NORMAL';
}

// Java-Code generieren
function generateJavaCode(name, type, properties) {
    const className = name.replace(/\s+/g, '');
    // Calculate power level locally if AI not available
    const powerLevel = calculatePowerLevelLocal(properties);
    
    return `package net.mcreator.claudecraft;

import net.minecraft.world.item.*;
import net.minecraft.world.level.Level;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.InteractionResultHolder;
import net.minecraft.world.InteractionHand;
import net.minecraft.world.effect.MobEffects;
import net.minecraft.world.effect.MobEffectInstance;
import net.minecraft.network.chat.Component;
import net.minecraft.ChatFormatting;
import net.minecraft.world.item.ItemStack;
import java.util.List;

/**
 * AI-Generated Minecraft ${type}
 * Power Level: ${powerLevel}
 * Generated by Claude-Craft Ultimate
 */
public class ${className} extends ${getBaseClass(type)} {
    
    // Item Properties
    private static final int HEALTH = ${properties.health || 0};
    private static final int DAMAGE = ${properties.damage || 0};
    private static final int SPEED = ${properties.speed || 0};
    private static final int JUMP = ${properties.jump || 0};
    private static final int FIRE = ${properties.fire || 0};
    private static final int DURABILITY = ${properties.durability || 100};
    
    public ${className}() {
        super(${getConstructorParams(type, properties)});
    }
    
    @Override
    public InteractionResultHolder<ItemStack> use(Level world, Player player, InteractionHand hand) {
        ItemStack itemstack = player.getItemInHand(hand);
        
        if (!world.isClientSide()) {
            // Apply all effects
            ${generateEffects(properties)}
            
            // Visual feedback
            player.displayClientMessage(
                Component.literal("${powerLevel} Aktiviert!").withStyle(ChatFormatting.GOLD),
                true
            );
        }
        
        return InteractionResultHolder.success(itemstack);
    }
    
    @Override
    public void appendHoverText(ItemStack stack, Level world, List<Component> tooltip, TooltipFlag flag) {
        tooltip.add(Component.literal("Power: ${powerLevel}").withStyle(ChatFormatting.YELLOW));
        ${properties.health > 0 ? `tooltip.add(Component.literal("❤ Heilt ${properties.health} HP").withStyle(ChatFormatting.RED));` : ''}
        ${properties.damage > 0 ? `tooltip.add(Component.literal("⚔ ${properties.damage} Schaden").withStyle(ChatFormatting.DARK_RED));` : ''}
        ${properties.speed > 0 ? `tooltip.add(Component.literal("💨 +${properties.speed} Geschwindigkeit").withStyle(ChatFormatting.AQUA));` : ''}
        ${properties.fire > 0 ? `tooltip.add(Component.literal("🔥 Feuer ${properties.fire}s").withStyle(ChatFormatting.GOLD));` : ''}
    }
    
    ${properties.durability >= 10000 ? `
    @Override
    public boolean isDamageable(ItemStack stack) {
        return false; // Unzerstörbar
    }` : ''}
}`;
}

// Basis-Klasse bestimmen
function getBaseClass(type) {
    const classes = {
        'sword': 'SwordItem',
        'bow': 'BowItem',
        'pickaxe': 'PickaxeItem',
        'axe': 'AxeItem',
        'armor': 'ArmorItem',
        'helmet': 'ArmorItem',
        'block': 'BlockItem',
        'potion': 'PotionItem'
    };
    return classes[type] || 'Item';
}

// Konstruktor-Parameter
function getConstructorParams(type, properties) {
    switch(type) {
        case 'sword':
            return `Tiers.NETHERITE, ${properties.damage || 3}, -2.4F, new Item.Properties().tab(CreativeModeTab.TAB_COMBAT)`;
        case 'bow':
            return `new Item.Properties().tab(CreativeModeTab.TAB_COMBAT).durability(${properties.durability || 384})`;
        case 'pickaxe':
        case 'axe':
            return `Tiers.NETHERITE, ${Math.floor((properties.damage || 1) / 2)}, -2.8F, new Item.Properties().tab(CreativeModeTab.TAB_TOOLS)`;
        default:
            return `new Item.Properties().tab(CreativeModeTab.TAB_MISC).stacksTo(64)`;
    }
}

// Effekte generieren
function generateEffects(properties) {
    const effects = [];
    
    if (properties.health > 0) {
        effects.push(`player.heal(${properties.health * 2}F);`);
        effects.push(`player.addEffect(new MobEffectInstance(MobEffects.HEALTH_BOOST, 6000, ${Math.floor(properties.health / 10)}));`);
    }
    
    if (properties.speed > 0) {
        effects.push(`player.addEffect(new MobEffectInstance(MobEffects.MOVEMENT_SPEED, 6000, ${properties.speed - 1}));`);
    }
    
    if (properties.jump > 0) {
        effects.push(`player.addEffect(new MobEffectInstance(MobEffects.JUMP, 6000, ${properties.jump - 1}));`);
    }
    
    if (properties.damage > 0) {
        effects.push(`player.addEffect(new MobEffectInstance(MobEffects.DAMAGE_BOOST, 6000, ${Math.floor(properties.damage / 10)}));`);
    }
    
    if (properties.fire > 0) {
        effects.push(`// Apply fire to nearby entities`);
        effects.push(`world.getEntitiesOfClass(LivingEntity.class, player.getBoundingBox().inflate(5.0D))`);
        effects.push(`    .forEach(entity -> { if (entity != player) entity.setSecondsOnFire(${properties.fire}); });`);
    }
    
    return effects.join('\n            ');
}

// Server starten
app.listen(PORT, async () => {
    console.log(`
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║     🚀 CLAUDE-CRAFT ULTIMATE SERVER                         ║
    ║                                                              ║
    ╠══════════════════════════════════════════════════════════════╣
    ║                                                              ║
    ║     📍 URL: http://localhost:${PORT}                            ║
    ║                                                              ║
    ║     ✅ Features:                                            ║
    ║     • KI-Integration (mit Fallback)                         ║
    ║     • Sprachsteuerung Ready                                 ║
    ║     • Item-Eigenschaften System                             ║
    ║     • MCreator Export                                       ║
    ║     • Minecraft Commands                                    ║
    ║     • Power-Level Berechnung                                ║
    ║                                                              ║
    ║     🎮 Commands:                                            ║
    ║     • "Erstelle ein Feuerschwert mit 100 Schaden"          ║
    ║     • "Legendäre Rüstung mit Geschwindigkeit"              ║
    ║     • "Ultimativer Bogen mit allen Effekten"               ║
    ║                                                              ║
    ╚══════════════════════════════════════════════════════════════╝
    `);
    
    // Workspace vorbereiten
    await ensureWorkspace();
    console.log('✅ Workspace bereit:', MCREATOR_WORKSPACE);
});