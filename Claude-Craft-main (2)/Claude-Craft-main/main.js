const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  console.log('Creating window...');
  
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    },
    show: true, // Zeige Fenster sofort
    backgroundColor: '#1e1e2e'
  });

  // Lade die HTML Datei
  const htmlPath = path.join(__dirname, 'src', 'index.html');
  console.log('Loading:', htmlPath);
  
  mainWindow.loadFile(htmlPath);
  
  // Öffne DevTools automatisch für Debugging
  mainWindow.webContents.openDevTools();
  
  // Log Fehler
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorDescription);
  });
  
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('✅ App successfully loaded!');
  });
  
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App Events
app.whenReady().then(() => {
  console.log('Electron is ready!');
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
// IPC Handler
ipcMain.on('minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('close', () => {
  app.quit();
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

console.log('Main process started successfully!');