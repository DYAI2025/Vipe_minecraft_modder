const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Claude-Craft files...\n');

const requiredFiles = [
  'package.json',
  'main.js',
  'src/index.html',
  'src/styles.css',
  'src/js/app.js',
  'src/js/voice-control.js',
  'src/js/3d-viewer.js',
  'src/js/minecraft-textures.js',
  'src/js/mcreator-bridge.js'
];

let allGood = true;

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`✅ ${file} (${stats.size} bytes)`);
  } else {
    console.log(`❌ ${file} - MISSING!`);
    allGood = false;
  }
});

console.log('\n' + '='.repeat(50));

if (allGood) {
  console.log('✅ All files present! Starting Electron...\n');
  
  // Starte Electron
  const { spawn } = require('child_process');
  const electron = spawn('npx', ['electron', '.'], {
    stdio: 'inherit',
    shell: true
  });
  
  electron.on('close', (code) => {
    console.log(`Electron exited with code ${code}`);
  });
} else {
  console.log('❌ Some files are missing! Please check installation.');
}