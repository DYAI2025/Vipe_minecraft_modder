// Claude-Craft IDE - Main App Controller
let ipcRenderer;
if (typeof require !== 'undefined' && !window.ipcRenderer) {
    const electron = require('electron');
    ipcRenderer = electron.ipcRenderer;
    window.ipcRenderer = ipcRenderer;
} else if (window.ipcRenderer) {
    ipcRenderer = window.ipcRenderer;
}

// Window Controls
document.querySelector('.minimize').addEventListener('click', () => {
    ipcRenderer.send('minimize');
});

document.querySelector('.maximize').addEventListener('click', () => {
    ipcRenderer.send('maximize');
});

document.querySelector('.close').addEventListener('click', () => {
    ipcRenderer.send('close');
});

// Voice Button - Verbessert
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM geladen, verbinde Voice Button...');
    
    const voiceBtn = document.getElementById('voice-btn');
    if (voiceBtn) {
        // KLICK = Start/Stop (nicht gedrückt halten!)
        voiceBtn.addEventListener('click', () => {
            console.log('Voice Button geklickt!');
            if (window.voiceControl) {
                if (voiceControl.isListening) {
                    console.log('Stoppe Spracherkennung...');
                    voiceControl.stopListening();
                } else {
                    console.log('Starte Spracherkennung...');
                    voiceControl.startListening();
                }
            } else {
                console.error('voiceControl nicht verfügbar!');
                alert('Spracherkennung wird noch geladen...');
            }
        });
        
        // Zeige Anleitung
        voiceBtn.title = "EINMAL KLICKEN zum Starten/Stoppen (nicht halten!)";
    } else {
        console.error('Voice Button nicht gefunden!');
    }
});

// Tool Buttons - Global verfügbar machen
window.openBlockCreator = function() {
    console.log('Block Creator clicked!');
    if (window.voiceControl) {
        voiceControl.claudeSays('Lass uns einen neuen Block erstellen!');
    }
    const properties = {
        name: 'MeinBlock',
        texture: 'stone',
        color: '#4facfe',
        transparent: false
    };
    if (window.viewer3D) {
        window.viewer3D.createBlock(properties);
    } else {
        console.error('viewer3D nicht verfügbar!');
    }
    if (window.mcreatorBridge) {
        mcreatorBridge.createBlock(properties);
    }
}

window.openItemCreator = function() {
    console.log('Item Creator clicked!');
    if (window.voiceControl) {
        voiceControl.claudeSays('Super! Ein neues Item wird erstellt!');
    }
    const properties = {
        name: 'MeinSchwert',
        type: 'sword',
        attackDamage: 7
    };
    if (window.viewer3D) {
        window.viewer3D.createItem(properties);
    }
    if (window.mcreatorBridge) {
        mcreatorBridge.createItem(properties);
    }
}

window.openRecipeCreator = function() {
    console.log('Recipe Creator clicked!');
    if (window.voiceControl) {
        voiceControl.claudeSays('Rezepte machen das Spiel interessanter!');
    }
    alert('Rezept-Editor kommt bald!');
}

// 3D Viewer Controls - Global
window.resetCamera = function() {
    console.log('Reset Camera clicked!');
    if (window.viewer3D) {
        window.viewer3D.resetCamera();
    }
}

window.toggleWireframe = function() {
    console.log('Toggle Wireframe clicked!');
    if (window.viewer3D) {
        window.viewer3D.toggleWireframe();
    }
}

window.exportModel = function() {
    console.log('Export Model clicked!');
    if (window.mcreatorBridge) {
        mcreatorBridge.exportToMCreator();
    }
}

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    // Strg+S - Speichern
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveProject();
    }    
    // Strg+N - Neues Projekt
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        newProject();
    }
    
    // Strg+B - Build
    if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        mcreatorBridge.buildMod();
    }
    
    // Leertaste - Voice Control Toggle
    if (e.key === ' ' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        document.getElementById('voice-btn').click();
    }
});

function saveProject() {
    voiceControl.speak('Projekt wird gespeichert!');
    localStorage.setItem('claudecraft_project', JSON.stringify({
        name: mcreatorBridge.currentProject,
        timestamp: Date.now()
    }));
}

function newProject() {
    const projectName = prompt('Wie soll dein neues Projekt heißen?');
    if (projectName) {
        mcreatorBridge.createNewProject(projectName);
        voiceControl.speak(`Neues Projekt ${projectName} wurde erstellt!`);
    }
}
// Load saved project
window.addEventListener('load', () => {
    const savedProject = localStorage.getItem('claudecraft_project');
    if (savedProject) {
        const project = JSON.parse(savedProject);
        document.getElementById('current-project').textContent = 
            `Projekt: ${project.name}`;
    }
    
    // Welcome Message
    setTimeout(() => {
        voiceControl.speak(
            'Willkommen bei Claude-Craft! Ich bin Claude, dein Minecraft Mod-Assistent. ' +
            'Sag einfach was du bauen möchtest, oder klicke auf den Sprachbefehl-Button!'
        );
        
        // Zeige Claude Status
        document.getElementById('claude-status').textContent = 
            'Claude ist bereit zu helfen! 🤖 Sag "Hilfe" für Tipps!';
    }, 1000);
    
    // Demo: Erstelle einen Start-Block
    setTimeout(() => {
        voiceControl.speak('Hier ist ein Beispiel-Block zum Starten!');
        window.viewer3D.createBlock({
            name: 'Stein-Block',
            texture: 'stone'
        });
    }, 3000);
    
    // Demo: Zeige verschiedene Texturen
    setTimeout(() => {
        voiceControl.speak('Schau mal, ein Gras-Block!');
        window.viewer3D.createBlock({
            name: 'Gras-Block',
            texture: 'grass'
        });
        window.viewer3D.startRotation();
    }, 6000);
    
    setTimeout(() => {
        voiceControl.speak('Und hier ein Diamant-Block!');
        window.viewer3D.createBlock({
            name: 'Diamant-Block',
            texture: 'diamond'
        });
        window.viewer3D.startFloating();
        window.viewer3D.applyRainbowEffect();
    }, 9000);
});

console.log('Claude-Craft IDE loaded successfully!');