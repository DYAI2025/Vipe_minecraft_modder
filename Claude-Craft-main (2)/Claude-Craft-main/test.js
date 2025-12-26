// Test-Runner für Claude-Craft
const { app, BrowserWindow } = require('electron');
const path = require('path');

let testWindow;

function runTests() {
    testWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        show: true
    });

    testWindow.loadFile('src/index.html');
    
    // Auto-Demo nach dem Laden
    testWindow.webContents.on('did-finish-load', () => {
        console.log('✅ App geladen!');
        
        // Test 1: Block Creation
        setTimeout(() => {
            testWindow.webContents.executeJavaScript(`
                window.viewer3D.createBlock({ texture: 'stone' });
                console.log('✅ Stein-Block erstellt');
            `);
        }, 1000);

        // Test 2: Texture Change
        setTimeout(() => {
            testWindow.webContents.executeJavaScript(`
                window.viewer3D.createBlock({ texture: 'grass' });
                console.log('✅ Gras-Block erstellt');
            `);
        }, 3000);

        // Test 3: Animation
        setTimeout(() => {
            testWindow.webContents.executeJavaScript(`
                window.viewer3D.createBlock({ texture: 'diamond' });
                window.viewer3D.startRotation();
                window.viewer3D.startFloating();
                console.log('✅ Animierter Diamant-Block');
            `);
        }, 5000);
    });
}

app.whenReady().then(runTests);

app.on('window-all-closed', () => {
    console.log('🏁 Test abgeschlossen!');
    app.quit();
});