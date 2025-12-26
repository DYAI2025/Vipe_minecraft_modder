const express = require('express');
const path = require('path');
const app = express();
const PORT = 8080;

// Statische Dateien servieren
app.use(express.static(__dirname));
app.use('/src', express.static(path.join(__dirname, 'src')));

// CORS Headers für Speech API
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Permissions-Policy', 'microphone=*');
    next();
});

// Hauptroute
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'index.html'));
});

// Server starten
app.listen(PORT, () => {
    console.log(`
    ========================================
    🚀 Claude-Craft Server läuft!
    ========================================
    
    Öffne im Browser:
    http://localhost:${PORT}
    
    Speech API sollte jetzt funktionieren!
    ========================================
    `);
    
    // Automatisch im Browser öffnen
    const { exec } = require('child_process');
    exec(`start http://localhost:${PORT}`);
});

// Fehlerbehandlung
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Etwas ist schiefgelaufen!');
});