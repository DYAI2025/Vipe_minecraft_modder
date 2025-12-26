# KidModStudio Kinderfreundliches UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** Redesign the KidModStudio Electron app with a child-friendly Minecraft-themed UI for 9-11 year olds, featuring a friendly Creeper helper "Crafty", German language, and a crafting-table inspired layout.

**Architecture:** Single-page HTML/CSS renderer with Minecraft-style visuals. CSS animations for Crafty interactions. Event-driven JavaScript for IPC communication. All text in German with encouraging feedback messages.

**Tech Stack:** HTML5, CSS3 (animations, gradients), Vanilla JavaScript, Electron IPC

---

## Task 1: Create CSS Variables and Base Styles

**Files:**
- Create: `apps/studio-electron/src/renderer/styles.css`
- Modify: `apps/studio-electron/src/renderer/index.html`

**Step 1: Create the CSS file with Minecraft color palette**

Create `apps/studio-electron/src/renderer/styles.css`:

```css
/* KidModStudio - Kinderfreundliches Minecraft-Theme */

:root {
  /* Minecraft Farbpalette */
  --grass-dark: #2d5a27;
  --grass-light: #5d8a4a;
  --grass-hover: #7ab366;
  --dirt-brown: #8b5a2b;
  --wood-brown: #a0522d;
  --stone-gray: #7f7f7f;
  --stone-dark: #4a4a4a;
  --sky-blue: #87ceeb;
  --gold: #ffcc00;
  --white: #ffffff;
  --black: #1a1a1a;
  --error-red: #ff6b6b;
  --success-green: #4ade80;

  /* Schriften */
  --font-main: 'Segoe UI', system-ui, sans-serif;
  --font-minecraft: 'Courier New', monospace; /* Fallback für Minecraft-Feeling */

  /* Abstände */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  /* Schatten */
  --shadow-block: 4px 4px 0px rgba(0,0,0,0.3);
  --shadow-hover: 6px 6px 0px rgba(0,0,0,0.4);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-main);
  background: linear-gradient(180deg, var(--sky-blue) 0%, var(--grass-dark) 100%);
  min-height: 100vh;
  color: var(--white);
  overflow-x: hidden;
}

/* Minecraft-Style Button */
.mc-button {
  background: linear-gradient(180deg, var(--stone-gray) 0%, var(--stone-dark) 100%);
  border: 3px solid var(--black);
  border-top-color: #a0a0a0;
  border-left-color: #a0a0a0;
  padding: var(--spacing-sm) var(--spacing-md);
  color: var(--white);
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: var(--shadow-block);
  transition: all 0.1s ease;
  text-shadow: 2px 2px 0px var(--black);
}

.mc-button:hover {
  background: linear-gradient(180deg, #909090 0%, #606060 100%);
  box-shadow: var(--shadow-hover);
  transform: translate(-1px, -1px);
}

.mc-button:active {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0px rgba(0,0,0,0.3);
}

.mc-button.primary {
  background: linear-gradient(180deg, var(--grass-light) 0%, var(--grass-dark) 100%);
  border-top-color: var(--grass-hover);
  border-left-color: var(--grass-hover);
}

.mc-button.gold {
  background: linear-gradient(180deg, var(--gold) 0%, #cc9900 100%);
  border-top-color: #ffdd44;
  border-left-color: #ffdd44;
  color: var(--black);
  text-shadow: none;
}
```

**Step 2: Update index.html to link the CSS**

In `apps/studio-electron/src/renderer/index.html`, replace the `<style>` block with a link:

```html
<link rel="stylesheet" href="styles.css">
```

**Step 3: Copy CSS to dist and verify**

```bash
cp apps/studio-electron/src/renderer/styles.css apps/studio-electron/dist/renderer/
```

**Step 4: Commit**

```bash
git add apps/studio-electron/src/renderer/styles.css
git commit -m "feat(ui): add Minecraft-themed CSS variables and base styles"
```

---

## Task 2: Update Build Script for CSS Assets

**Files:**
- Modify: `apps/studio-electron/package.json`

**Step 1: Update copy-assets script to include CSS**

In `apps/studio-electron/package.json`, update the copy-assets script:

```json
"copy-assets": "mkdir -p dist/renderer && cp src/renderer/*.html src/renderer/*.css dist/renderer/ 2>/dev/null || cp src/renderer/*.html dist/renderer/"
```

**Step 2: Test the build**

```bash
cd apps/studio-electron && npm run build && ls dist/renderer/
```

Expected: Both `index.html` and `styles.css` present.

**Step 3: Commit**

```bash
git add apps/studio-electron/package.json
git commit -m "chore: include CSS files in build assets"
```

---

## Task 3: Create Main Layout Structure

**Files:**
- Modify: `apps/studio-electron/src/renderer/index.html`

**Step 1: Replace index.html with new layout**

Replace entire content of `apps/studio-electron/src/renderer/index.html`:

```html
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'">
  <title>KidModStudio - Baue deinen eigenen Minecraft Mod!</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <!-- Header -->
  <header class="header">
    <div class="header-title">
      <span class="logo">⛏️</span>
      <h1>KidModStudio</h1>
    </div>
    <p class="header-subtitle">Baue deinen eigenen Minecraft Mod!</p>
    <button class="mc-button settings-btn" title="Einstellungen">⚙️</button>
  </header>

  <!-- Main Content -->
  <main class="main-container">
    <!-- Left: Inventar -->
    <aside class="inventory-panel">
      <h2>📦 Inventar</h2>
      <div class="inventory-tabs">
        <button class="inv-tab active" data-tab="blocks">🧱 Blöcke</button>
        <button class="inv-tab" data-tab="items">⚔️ Items</button>
        <button class="inv-tab" data-tab="mobs">🐷 Kreaturen</button>
      </div>
      <div class="inventory-grid" id="inventory-grid">
        <!-- Items werden per JS geladen -->
      </div>
    </aside>

    <!-- Center: Werkbank -->
    <section class="workbench">
      <h2>🔨 Werkbank</h2>
      <div class="crafting-area">
        <div class="crafting-grid">
          <div class="craft-slot" data-slot="0"></div>
          <div class="craft-slot" data-slot="1"></div>
          <div class="craft-slot" data-slot="2"></div>
          <div class="craft-slot" data-slot="3"></div>
          <div class="craft-slot center-slot" data-slot="4">
            <span class="slot-hint">Hauptblock</span>
          </div>
          <div class="craft-slot" data-slot="5"></div>
          <div class="craft-slot" data-slot="6"></div>
          <div class="craft-slot" data-slot="7"></div>
          <div class="craft-slot" data-slot="8"></div>
        </div>
        <div class="crafting-arrow">➡️</div>
        <div class="crafting-result">
          <div class="result-slot" id="result-slot">
            <span class="slot-hint">Dein Mod</span>
          </div>
        </div>
      </div>
      <div class="action-buttons">
        <button class="mc-button primary" id="btn-create">⚒️ Mod bauen!</button>
        <button class="mc-button" id="btn-clear">🗑️ Leeren</button>
      </div>
    </section>

    <!-- Right: Crafty Helper -->
    <aside class="helper-panel">
      <div class="crafty-container">
        <div class="crafty" id="crafty">
          <div class="crafty-face">
            <div class="crafty-eyes">
              <div class="eye left"></div>
              <div class="eye right"></div>
            </div>
            <div class="crafty-mouth">◡</div>
          </div>
          <div class="crafty-hat">🎓</div>
        </div>
        <div class="speech-bubble" id="speech-bubble">
          <p id="crafty-message">Hallo! Ich bin Crafty! 🎮 Lass uns zusammen einen Mod bauen!</p>
        </div>
      </div>

      <!-- Status Anzeigen -->
      <div class="status-container">
        <div class="status-item" id="llm-status">
          <span class="status-icon">🧠</span>
          <span class="status-text">Bereit zum Denken!</span>
        </div>
        <div class="status-item" id="stt-status">
          <span class="status-icon">🎤</span>
          <span class="status-text">Bereit zum Zuhören!</span>
        </div>
      </div>
    </aside>
  </main>

  <!-- Footer: Spracheingabe -->
  <footer class="voice-footer">
    <button class="mc-button gold voice-btn" id="btn-voice">
      <span class="mic-icon">🎤</span>
      <span class="voice-text">Sprich mit mir!</span>
    </button>
    <div class="voice-feedback" id="voice-feedback">
      <div class="sound-wave"></div>
      <p class="voice-transcript" id="voice-transcript"></p>
    </div>
  </footer>

  <script src="app.js"></script>
</body>
</html>
```

**Step 2: Commit**

```bash
git add apps/studio-electron/src/renderer/index.html
git commit -m "feat(ui): add Minecraft workbench layout with German text"
```

---

## Task 4: Add Layout CSS Styles

**Files:**
- Modify: `apps/studio-electron/src/renderer/styles.css`

**Step 1: Add layout styles to styles.css**

Append to `apps/studio-electron/src/renderer/styles.css`:

```css
/* ==================== LAYOUT ==================== */

/* Header */
.header {
  background: linear-gradient(180deg, var(--dirt-brown) 0%, var(--wood-brown) 100%);
  border-bottom: 4px solid var(--black);
  padding: var(--spacing-md);
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4px 0 rgba(0,0,0,0.3);
}

.header-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.header-title .logo {
  font-size: 32px;
}

.header-title h1 {
  font-size: 28px;
  text-shadow: 3px 3px 0px var(--black);
  color: var(--gold);
}

.header-subtitle {
  font-size: 14px;
  color: var(--white);
  opacity: 0.9;
}

.settings-btn {
  font-size: 20px;
  padding: var(--spacing-sm);
}

/* Main Container - 3 Spalten */
.main-container {
  display: grid;
  grid-template-columns: 250px 1fr 280px;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  min-height: calc(100vh - 180px);
}

/* Panels */
.inventory-panel,
.helper-panel {
  background: rgba(0, 0, 0, 0.5);
  border: 3px solid var(--dirt-brown);
  border-radius: 8px;
  padding: var(--spacing-md);
}

.inventory-panel h2,
.helper-panel h2,
.workbench h2 {
  font-size: 18px;
  margin-bottom: var(--spacing-md);
  text-shadow: 2px 2px 0px var(--black);
}

/* Inventar Tabs */
.inventory-tabs {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-md);
}

.inv-tab {
  background: var(--stone-dark);
  border: 2px solid var(--stone-gray);
  padding: var(--spacing-sm);
  color: var(--white);
  cursor: pointer;
  text-align: left;
  font-size: 14px;
  transition: all 0.2s;
}

.inv-tab:hover,
.inv-tab.active {
  background: var(--grass-dark);
  border-color: var(--grass-light);
}

/* Inventar Grid */
.inventory-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-xs);
}

.inv-item {
  aspect-ratio: 1;
  background: var(--stone-dark);
  border: 2px solid var(--stone-gray);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  cursor: grab;
  transition: all 0.2s;
}

.inv-item:hover {
  background: var(--grass-dark);
  border-color: var(--gold);
  transform: scale(1.1);
}

/* Werkbank */
.workbench {
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect fill="%238B4513" width="32" height="32"/><rect fill="%23A0522D" x="0" y="0" width="16" height="16"/><rect fill="%23A0522D" x="16" y="16" width="16" height="16"/></svg>');
  border: 4px solid var(--black);
  border-radius: 8px;
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.crafting-area {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  margin: var(--spacing-lg) 0;
}

.crafting-grid {
  display: grid;
  grid-template-columns: repeat(3, 64px);
  gap: 4px;
  background: var(--stone-dark);
  padding: var(--spacing-sm);
  border: 3px solid var(--black);
}

.craft-slot {
  width: 64px;
  height: 64px;
  background: var(--stone-gray);
  border: 2px dashed rgba(255,255,255,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  position: relative;
}

.craft-slot.center-slot {
  background: var(--grass-dark);
  border: 2px solid var(--gold);
}

.slot-hint {
  font-size: 10px;
  color: rgba(255,255,255,0.5);
  text-align: center;
}

.craft-slot.filled {
  border-style: solid;
  border-color: var(--grass-light);
  animation: slot-glow 1s ease-in-out infinite alternate;
}

@keyframes slot-glow {
  from { box-shadow: 0 0 5px var(--grass-light); }
  to { box-shadow: 0 0 15px var(--gold); }
}

.crafting-arrow {
  font-size: 48px;
  animation: arrow-pulse 1s ease-in-out infinite;
}

@keyframes arrow-pulse {
  0%, 100% { transform: translateX(0); opacity: 0.7; }
  50% { transform: translateX(5px); opacity: 1; }
}

.result-slot {
  width: 80px;
  height: 80px;
  background: var(--gold);
  border: 3px solid var(--black);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
}

.action-buttons {
  display: flex;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
}

/* Footer */
.voice-footer {
  background: rgba(0, 0, 0, 0.7);
  border-top: 4px solid var(--dirt-brown);
  padding: var(--spacing-md);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-lg);
}

.voice-btn {
  font-size: 18px;
  padding: var(--spacing-md) var(--spacing-xl);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.voice-btn.recording {
  animation: recording-pulse 0.5s ease-in-out infinite alternate;
}

@keyframes recording-pulse {
  from { box-shadow: 0 0 10px var(--error-red); }
  to { box-shadow: 0 0 25px var(--error-red); }
}

.voice-feedback {
  flex: 1;
  max-width: 400px;
  background: var(--stone-dark);
  border: 2px solid var(--stone-gray);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: 4px;
  min-height: 40px;
}

.voice-transcript {
  font-size: 14px;
  color: var(--gold);
}
```

**Step 2: Commit**

```bash
git add apps/studio-electron/src/renderer/styles.css
git commit -m "feat(ui): add layout styles for 3-column workbench design"
```

---

## Task 5: Add Crafty Helper CSS

**Files:**
- Modify: `apps/studio-electron/src/renderer/styles.css`

**Step 1: Add Crafty helper styles**

Append to `apps/studio-electron/src/renderer/styles.css`:

```css
/* ==================== CRAFTY HELPER ==================== */

.helper-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.crafty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
}

/* Crafty Creeper */
.crafty {
  width: 80px;
  height: 100px;
  background: var(--grass-light);
  border: 3px solid var(--grass-dark);
  border-radius: 8px;
  position: relative;
  animation: crafty-bounce 2s ease-in-out infinite;
}

@keyframes crafty-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.crafty-face {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
}

.crafty-eyes {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.eye {
  width: 12px;
  height: 16px;
  background: var(--black);
  animation: blink 4s ease-in-out infinite;
}

@keyframes blink {
  0%, 95%, 100% { transform: scaleY(1); }
  97% { transform: scaleY(0.1); }
}

.crafty-mouth {
  font-size: 24px;
  text-align: center;
  margin-top: 5px;
  color: var(--black);
}

.crafty-hat {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 24px;
}

/* Crafty States */
.crafty.thinking {
  animation: crafty-think 0.5s ease-in-out infinite;
}

@keyframes crafty-think {
  0%, 100% { transform: rotate(-5deg); }
  50% { transform: rotate(5deg); }
}

.crafty.happy {
  animation: crafty-dance 0.3s ease-in-out infinite;
}

@keyframes crafty-dance {
  0%, 100% { transform: translateY(0) rotate(0); }
  25% { transform: translateY(-10px) rotate(-5deg); }
  75% { transform: translateY(-10px) rotate(5deg); }
}

/* Speech Bubble */
.speech-bubble {
  background: var(--white);
  color: var(--black);
  padding: var(--spacing-md);
  border-radius: 12px;
  border: 3px solid var(--grass-dark);
  position: relative;
  max-width: 220px;
  font-size: 14px;
  line-height: 1.4;
  box-shadow: var(--shadow-block);
}

.speech-bubble::before {
  content: '';
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  border: 10px solid transparent;
  border-bottom-color: var(--grass-dark);
}

.speech-bubble::after {
  content: '';
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  border: 8px solid transparent;
  border-bottom-color: var(--white);
}

#crafty-message {
  margin: 0;
}

/* Status Container */
.status-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-top: auto;
}

.status-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  background: var(--stone-dark);
  padding: var(--spacing-sm);
  border-radius: 4px;
  font-size: 12px;
}

.status-item.success {
  border-left: 3px solid var(--success-green);
}

.status-item.error {
  border-left: 3px solid var(--error-red);
}

.status-item.loading {
  border-left: 3px solid var(--gold);
}

.status-icon {
  font-size: 16px;
}
```

**Step 2: Commit**

```bash
git add apps/studio-electron/src/renderer/styles.css
git commit -m "feat(ui): add Crafty helper character with animations"
```

---

## Task 6: Create JavaScript App Logic

**Files:**
- Create: `apps/studio-electron/src/renderer/app.js`

**Step 1: Create app.js with inventory and interactions**

Create `apps/studio-electron/src/renderer/app.js`:

```javascript
// KidModStudio - Kinderfreundliche App Logik

// ==================== INVENTAR ITEMS ====================
const INVENTORY = {
  blocks: [
    { id: 'stone', icon: '🪨', name: 'Stein', desc: 'Ein fester Steinblock' },
    { id: 'dirt', icon: '🟫', name: 'Erde', desc: 'Weiche Erde zum Graben' },
    { id: 'wood', icon: '🪵', name: 'Holz', desc: 'Holz von Bäumen' },
    { id: 'glass', icon: '🔲', name: 'Glas', desc: 'Durchsichtiges Glas' },
    { id: 'gold', icon: '🟨', name: 'Gold', desc: 'Glänzendes Goldblock' },
    { id: 'diamond', icon: '💎', name: 'Diamant', desc: 'Seltener Diamantblock' },
    { id: 'redstone', icon: '🔴', name: 'Redstone', desc: 'Magischer roter Stein' },
    { id: 'emerald', icon: '💚', name: 'Smaragd', desc: 'Grüner Edelstein' },
  ],
  items: [
    { id: 'sword', icon: '⚔️', name: 'Schwert', desc: 'Zum Kämpfen' },
    { id: 'pickaxe', icon: '⛏️', name: 'Spitzhacke', desc: 'Zum Abbauen' },
    { id: 'bow', icon: '🏹', name: 'Bogen', desc: 'Schießt Pfeile' },
    { id: 'shield', icon: '🛡️', name: 'Schild', desc: 'Zum Verteidigen' },
    { id: 'apple', icon: '🍎', name: 'Apfel', desc: 'Gibt Hunger zurück' },
    { id: 'potion', icon: '🧪', name: 'Trank', desc: 'Magischer Trank' },
  ],
  mobs: [
    { id: 'pig', icon: '🐷', name: 'Schwein', desc: 'Friedliches Tier' },
    { id: 'cow', icon: '🐄', name: 'Kuh', desc: 'Gibt Milch' },
    { id: 'chicken', icon: '🐔', name: 'Huhn', desc: 'Legt Eier' },
    { id: 'wolf', icon: '🐺', name: 'Wolf', desc: 'Kann gezähmt werden' },
    { id: 'bee', icon: '🐝', name: 'Biene', desc: 'Macht Honig' },
    { id: 'cat', icon: '🐱', name: 'Katze', desc: 'Verscheucht Creeper' },
  ]
};

// ==================== CRAFTY NACHRICHTEN ====================
const CRAFTY_MESSAGES = {
  welcome: 'Hallo! Ich bin Crafty! 🎮 Lass uns zusammen einen Mod bauen!',
  emptyGrid: 'Zieh einen Block aus dem Inventar in die Werkbank!',
  blockPlaced: 'Super! 👍 Was soll dein Mod noch können?',
  centerFilled: 'Toll! Der Hauptblock ist platziert! ⭐',
  thinking: 'Hmm, lass mich nachdenken... 🤔',
  listening: 'Ich höre dir zu... erzähl mir von deinem Mod! 👂',
  success: 'WOOHOO! 🎉 Dein Mod ist fertig!',
  error: 'Hmm, das hat nicht geklappt. Versuch es nochmal! 💪',
  idle: [
    'Klick auf einen Block im Inventar! 📦',
    'Du kannst auch mit mir sprechen! 🎤',
    'Jeder Block hat besondere Kräfte! ✨',
    'Was möchtest du heute erschaffen? 🛠️'
  ]
};

// ==================== APP STATE ====================
let currentTab = 'blocks';
let craftingSlots = Array(9).fill(null);
let isRecording = false;
let idleTimer = null;

// ==================== DOM ELEMENTS ====================
const inventoryGrid = document.getElementById('inventory-grid');
const craftyMessage = document.getElementById('crafty-message');
const crafty = document.getElementById('crafty');
const btnVoice = document.getElementById('btn-voice');
const btnCreate = document.getElementById('btn-create');
const btnClear = document.getElementById('btn-clear');
const voiceTranscript = document.getElementById('voice-transcript');
const llmStatus = document.getElementById('llm-status');
const sttStatus = document.getElementById('stt-status');

// ==================== INVENTAR FUNKTIONEN ====================
function renderInventory(category) {
  const items = INVENTORY[category] || [];
  inventoryGrid.innerHTML = '';

  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'inv-item';
    div.textContent = item.icon;
    div.title = `${item.name}: ${item.desc}`;
    div.dataset.id = item.id;
    div.dataset.icon = item.icon;
    div.dataset.name = item.name;

    div.draggable = true;
    div.addEventListener('dragstart', handleDragStart);
    div.addEventListener('click', () => handleItemClick(item));

    inventoryGrid.appendChild(div);
  });
}

function handleItemClick(item) {
  setCraftyMessage(`${item.icon} ${item.name}: ${item.desc}`);
  resetIdleTimer();
}

// ==================== DRAG & DROP ====================
let draggedItem = null;

function handleDragStart(e) {
  draggedItem = {
    id: e.target.dataset.id,
    icon: e.target.dataset.icon,
    name: e.target.dataset.name
  };
  e.dataTransfer.effectAllowed = 'copy';
}

function setupCraftingSlots() {
  document.querySelectorAll('.craft-slot').forEach(slot => {
    slot.addEventListener('dragover', e => {
      e.preventDefault();
      slot.style.background = 'var(--grass-hover)';
    });

    slot.addEventListener('dragleave', e => {
      slot.style.background = '';
    });

    slot.addEventListener('drop', e => {
      e.preventDefault();
      slot.style.background = '';

      if (draggedItem) {
        const slotIndex = parseInt(slot.dataset.slot);
        craftingSlots[slotIndex] = draggedItem;
        slot.textContent = draggedItem.icon;
        slot.classList.add('filled');
        slot.querySelector('.slot-hint')?.remove();

        if (slotIndex === 4) {
          setCraftyMessage(CRAFTY_MESSAGES.centerFilled);
          setCraftyState('happy');
        } else {
          setCraftyMessage(CRAFTY_MESSAGES.blockPlaced);
        }

        resetIdleTimer();
        draggedItem = null;
      }
    });
  });
}

// ==================== CRAFTY FUNKTIONEN ====================
function setCraftyMessage(msg) {
  craftyMessage.textContent = msg;
}

function setCraftyState(state) {
  crafty.className = 'crafty';
  if (state) {
    crafty.classList.add(state);
    setTimeout(() => crafty.classList.remove(state), 2000);
  }
}

function startIdleMessages() {
  resetIdleTimer();
}

function resetIdleTimer() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    const randomMsg = CRAFTY_MESSAGES.idle[Math.floor(Math.random() * CRAFTY_MESSAGES.idle.length)];
    setCraftyMessage(randomMsg);
  }, 30000);
}

// ==================== STATUS FUNKTIONEN ====================
function updateStatus(element, status, text) {
  const statusEl = document.getElementById(element);
  statusEl.className = 'status-item ' + status;
  statusEl.querySelector('.status-text').textContent = text;
}

// ==================== VOICE FUNKTIONEN ====================
async function toggleVoice() {
  if (!window.kidmod) {
    setCraftyMessage('Sprachsteuerung wird geladen...');
    return;
  }

  if (isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
}

async function startRecording() {
  isRecording = true;
  btnVoice.classList.add('recording');
  btnVoice.querySelector('.voice-text').textContent = 'Ich höre...';
  setCraftyMessage(CRAFTY_MESSAGES.listening);
  updateStatus('stt-status', 'loading', 'Höre zu...');

  try {
    const streamId = 'stream-' + Date.now();

    window.kidmod.stt.onStreamEvent((ev) => {
      if (ev.type === 'interim') {
        voiceTranscript.textContent = ev.text + '...';
      } else if (ev.type === 'final') {
        voiceTranscript.textContent = ev.text;
        processVoiceInput(ev.text);
      }
    });

    await window.kidmod.stt.streamStart({ streamId });

    // Simulate some chunks for the echo provider
    for (let i = 0; i < 12; i++) {
      setTimeout(() => {
        if (isRecording) {
          const chunk = new Uint8Array(640);
          window.kidmod.stt.streamPush({ streamId, chunkIndex: i, pcm16le: chunk });
        }
      }, i * 100);
    }

  } catch (error) {
    setCraftyMessage(CRAFTY_MESSAGES.error);
    updateStatus('stt-status', 'error', 'Fehler beim Zuhören');
    stopRecording();
  }
}

function stopRecording() {
  isRecording = false;
  btnVoice.classList.remove('recording');
  btnVoice.querySelector('.voice-text').textContent = 'Sprich mit mir!';
  updateStatus('stt-status', 'success', 'Bereit zum Zuhören!');
}

async function processVoiceInput(text) {
  setCraftyMessage(CRAFTY_MESSAGES.thinking);
  setCraftyState('thinking');
  updateStatus('llm-status', 'loading', 'Crafty denkt nach...');

  try {
    const res = await window.kidmod.llm.completeJSON({
      requestId: 'voice-' + Date.now(),
      jsonSchema: {
        type: 'object',
        properties: {
          action: { type: 'string' },
          blockId: { type: 'string' }
        }
      }
    });

    if (res.ok) {
      setCraftyMessage(CRAFTY_MESSAGES.success);
      setCraftyState('happy');
      updateStatus('llm-status', 'success', 'Idee gefunden!');
    } else {
      setCraftyMessage(CRAFTY_MESSAGES.error);
      updateStatus('llm-status', 'error', 'Noch keine Idee...');
    }
  } catch (error) {
    setCraftyMessage(CRAFTY_MESSAGES.error);
    updateStatus('llm-status', 'error', 'Fehler beim Denken');
  }

  stopRecording();
}

// ==================== MOD ERSTELLEN ====================
async function createMod() {
  const filledSlots = craftingSlots.filter(s => s !== null);

  if (filledSlots.length === 0) {
    setCraftyMessage(CRAFTY_MESSAGES.emptyGrid);
    return;
  }

  setCraftyMessage(CRAFTY_MESSAGES.thinking);
  setCraftyState('thinking');
  updateStatus('llm-status', 'loading', 'Erstelle Mod...');

  // Simulate mod creation
  await new Promise(resolve => setTimeout(resolve, 1500));

  setCraftyMessage(CRAFTY_MESSAGES.success);
  setCraftyState('happy');
  updateStatus('llm-status', 'success', 'Mod erstellt!');

  // Show result
  const resultSlot = document.getElementById('result-slot');
  resultSlot.textContent = '🎁';
  resultSlot.querySelector('.slot-hint')?.remove();
}

function clearWorkbench() {
  craftingSlots = Array(9).fill(null);
  document.querySelectorAll('.craft-slot').forEach(slot => {
    const slotIndex = parseInt(slot.dataset.slot);
    slot.textContent = '';
    slot.classList.remove('filled');
    if (slotIndex === 4) {
      const hint = document.createElement('span');
      hint.className = 'slot-hint';
      hint.textContent = 'Hauptblock';
      slot.appendChild(hint);
    }
  });

  const resultSlot = document.getElementById('result-slot');
  resultSlot.innerHTML = '<span class="slot-hint">Dein Mod</span>';

  setCraftyMessage(CRAFTY_MESSAGES.emptyGrid);
}

// ==================== TAB WECHSEL ====================
function setupTabs() {
  document.querySelectorAll('.inv-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.inv-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentTab = tab.dataset.tab;
      renderInventory(currentTab);
    });
  });
}

// ==================== INITIALISIERUNG ====================
async function init() {
  // Setup UI
  setupTabs();
  setupCraftingSlots();
  renderInventory('blocks');
  startIdleMessages();

  // Event Listeners
  btnVoice.addEventListener('click', toggleVoice);
  btnCreate.addEventListener('click', createMod);
  btnClear.addEventListener('click', clearWorkbench);

  // Initial health check
  if (window.kidmod) {
    try {
      const health = await window.kidmod.llm.healthCheck({});
      if (health.ok) {
        updateStatus('llm-status', 'success', 'Bereit zum Denken!');
      }
    } catch (e) {
      updateStatus('llm-status', 'error', 'Nicht verbunden');
    }
  }

  console.log('KidModStudio initialized!');
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', init);
```

**Step 2: Commit**

```bash
git add apps/studio-electron/src/renderer/app.js
git commit -m "feat(ui): add interactive JavaScript with German messages"
```

---

## Task 7: Update Build Script for JS Assets

**Files:**
- Modify: `apps/studio-electron/package.json`

**Step 1: Update copy-assets to include JS**

In `apps/studio-electron/package.json`:

```json
"copy-assets": "mkdir -p dist/renderer && cp src/renderer/*.html src/renderer/*.css src/renderer/*.js dist/renderer/ 2>/dev/null || cp src/renderer/*.html dist/renderer/"
```

**Step 2: Commit**

```bash
git add apps/studio-electron/package.json
git commit -m "chore: include JS files in build assets"
```

---

## Task 8: Update HTML to Use External Script

**Files:**
- Modify: `apps/studio-electron/src/renderer/index.html`

**Step 1: Update CSP and script reference**

In `index.html`, update the CSP meta tag:

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'">
```

And ensure the script tag at the bottom is:

```html
<script src="app.js"></script>
```

**Step 2: Commit**

```bash
git add apps/studio-electron/src/renderer/index.html
git commit -m "fix(ui): update CSP for external script loading"
```

---

## Task 9: Build and Test

**Step 1: Run full build**

```bash
cd apps/studio-electron
npm run build
ls -la dist/renderer/
```

Expected: `index.html`, `styles.css`, `app.js` all present.

**Step 2: Run the app**

```bash
npm run dev
```

Expected: App opens with Minecraft-themed UI, Crafty helper visible, German text throughout.

**Step 3: Verify functionality**

- [ ] Inventory tabs switch categories
- [ ] Drag and drop items to crafting grid
- [ ] Crafty shows different messages
- [ ] Voice button changes state
- [ ] Mod erstellen button works

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete kinderfreundliches Minecraft-themed UI

- Werkbank-style 3-column layout
- Crafty the friendly Creeper helper with animations
- German language throughout
- Minecraft color palette (grass green, dirt brown, sky blue)
- Interactive inventory with drag & drop
- Child-friendly status messages and feedback"
```

---

**Plan complete and saved to `docs/plans/2025-12-26-kidmodstudio-kinderfreundliches-ui.md`.**

**Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
