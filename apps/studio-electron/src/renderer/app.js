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
