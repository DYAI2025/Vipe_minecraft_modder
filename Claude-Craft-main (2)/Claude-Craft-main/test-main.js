const { app, BrowserWindow } = require('electron');
const path = require('path');

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  
  // Lade Test-Seite
  win.loadFile('test-simple.html');
  
  // Öffne DevTools
  win.webContents.openDevTools();
  
  console.log('Window created!');
});

app.on('window-all-closed', () => {
  app.quit();
});