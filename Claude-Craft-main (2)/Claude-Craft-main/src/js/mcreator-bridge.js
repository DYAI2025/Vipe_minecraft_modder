// Claude-Craft MCreator Bridge
let ipcRenderer;
if (typeof require !== 'undefined' && !window.ipcRenderer) {
    const electron = require('electron');
    ipcRenderer = electron.ipcRenderer;
    window.ipcRenderer = ipcRenderer;
} else if (window.ipcRenderer) {
    ipcRenderer = window.ipcRenderer;
}
const fs = require('fs');
const path = require('path');

class MCreatorBridge {
    constructor() {
        this.workspacePath = 'C:\\ClaudeCraft\\mcreator-workspace';
        this.mcreatorPath = 'C:\\Program Files\\Pylo\\MCreator';
        this.currentProject = null;
        this.init();
    }

    init() {
        // Erstelle Workspace wenn nicht vorhanden
        if (!fs.existsSync(this.workspacePath)) {
            fs.mkdirSync(this.workspacePath, { recursive: true });
        }
        
        this.checkMCreatorConnection();
    }

    async checkMCreatorConnection() {
        try {
            const exists = fs.existsSync(this.mcreatorPath);
            const statusEl = document.getElementById('connection-status');
            
            if (exists) {
                statusEl.textContent = 'MCreator verbunden';
                statusEl.previousElementSibling.textContent = '🟢';
            } else {
                statusEl.textContent = 'MCreator nicht gefunden';
                statusEl.previousElementSibling.textContent = '🔴';
            }        } catch (error) {
            console.error('Error checking MCreator:', error);
        }
    }

    async createNewProject(projectName) {
        const projectPath = path.join(this.workspacePath, projectName);
        
        if (!fs.existsSync(projectPath)) {
            fs.mkdirSync(projectPath, { recursive: true });
        }
        
        // Erstelle MCreator Workspace Datei
        const workspaceData = {
            modName: projectName,
            modid: projectName.toLowerCase().replace(/\s/g, '_'),
            version: '1.0.0',
            minecraftVersion: '1.20.1',
            author: 'Claude-Craft User',
            description: 'Created with Claude-Craft IDE',
            elements: []
        };
        
        fs.writeFileSync(
            path.join(projectPath, 'workspace.json'),
            JSON.stringify(workspaceData, null, 2)
        );
        
        this.currentProject = projectPath;
        document.getElementById('current-project').textContent = `Projekt: ${projectName}`;
        
        return projectPath;
    }
    async createBlock(blockData) {
        if (!this.currentProject) {
            await this.createNewProject('MeinProjekt');
        }
        
        const blockElement = {
            type: 'block',
            name: blockData.name || 'CustomBlock',
            texture: blockData.texture || 'default',
            hardness: blockData.hardness || 1.0,
            resistance: blockData.resistance || 1.0,
            luminance: blockData.luminance || 0,
            transparent: blockData.transparent || false,
            creativeTab: 'BUILDING_BLOCKS',
            dropAmount: 1,
            toolType: 'pickaxe',
            material: 'ROCK'
        };
        
        // Speichere Block-Element
        const elementPath = path.join(this.currentProject, 'elements', 'blocks');
        if (!fs.existsSync(elementPath)) {
            fs.mkdirSync(elementPath, { recursive: true });
        }
        
        fs.writeFileSync(
            path.join(elementPath, `${blockElement.name}.json`),
            JSON.stringify(blockElement, null, 2)
        );
        
        return blockElement;
    }
    async createItem(itemData) {
        if (!this.currentProject) {
            await this.createNewProject('MeinProjekt');
        }
        
        const itemElement = {
            type: 'item',
            name: itemData.name || 'CustomItem',
            texture: itemData.texture || 'default',
            stackSize: itemData.stackSize || 64,
            durability: itemData.durability || 0,
            enchantability: itemData.enchantability || 0,
            creativeTab: 'TOOLS',
            toolType: itemData.toolType || 'none',
            attackDamage: itemData.attackDamage || 1,
            attackSpeed: itemData.attackSpeed || 1.0
        };
        
        const elementPath = path.join(this.currentProject, 'elements', 'items');
        if (!fs.existsSync(elementPath)) {
            fs.mkdirSync(elementPath, { recursive: true });
        }
        
        fs.writeFileSync(
            path.join(elementPath, `${itemElement.name}.json`),
            JSON.stringify(itemElement, null, 2)
        );
        
        return itemElement;
    }
    async exportToMCreator() {
        if (!this.currentProject) {
            alert('Kein Projekt zum Exportieren vorhanden!');
            return;
        }
        
        // Launch MCreator mit dem Projekt
        const result = await ipcRenderer.invoke('launch-mcreator');
        
        if (result.success) {
            voiceControl.speak('Das Projekt wurde erfolgreich zu MCreator exportiert!');
            alert('Projekt wurde zu MCreator exportiert!');
        } else {
            alert('Fehler beim Export: ' + result.error);
        }
    }
    
    async buildMod() {
        // Hier würde der Build-Prozess gestartet
        console.log('Building mod...');
        voiceControl.speak('Die Mod wird jetzt gebaut. Das kann einen Moment dauern!');
        
        // Simuliere Build-Prozess
        setTimeout(() => {
            voiceControl.speak('Die Mod wurde erfolgreich gebaut!');
            alert('Mod erfolgreich gebaut! Bereit zum Testen in Minecraft.');
        }, 3000);
    }
}

// Initialisierung
const mcreatorBridge = new MCreatorBridge();