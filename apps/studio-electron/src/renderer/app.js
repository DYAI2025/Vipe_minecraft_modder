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

// ==================== VOICE FUNKTIONEN (mit VoiceController & CraftyBrain) ====================
async function toggleVoice() {
  if (!window.kidmod) {
    setCraftyMessage('Sprachsteuerung wird geladen...');
    return;
  }

  if (isRecording) {
    await stopRecording();
  } else {
    await startRecording();
  }
}

async function startRecording() {
  try {
    await window.voiceController.startRecording();
    isRecording = true;
    btnVoice.classList.add('recording');
    btnVoice.querySelector('.voice-text').textContent = 'Ich höre...';
    setCraftyMessage(CRAFTY_MESSAGES.listening);
    updateStatus('stt-status', 'loading', 'Höre zu...');
  } catch (error) {
    console.error('Recording error:', error);
    setCraftyMessage('Hmm, dein Mikrofon funktioniert nicht. Ist es angeschlossen?');
    updateStatus('stt-status', 'error', 'Mikrofon nicht gefunden');
  }
}

async function stopRecording() {
  try {
    await window.voiceController.stopRecording();
  } catch (error) {
    console.error('Stop recording error:', error);
  }
  isRecording = false;
  btnVoice.classList.remove('recording');
  btnVoice.querySelector('.voice-text').textContent = 'Sprich mit mir!';
  updateStatus('stt-status', 'success', 'Bereit zum Zuhören!');
}

async function processVoiceInput(text) {
  if (!text?.trim()) return;

  setCraftyMessage(CRAFTY_MESSAGES.thinking);
  setCraftyState('thinking');
  updateStatus('llm-status', 'loading', 'Crafty denkt nach...');

  try {
    const result = await window.craftyBrain.processInput(text);

    if (result) {
      setCraftyMessage(result.text);
      setCraftyState(result.emotion);
      updateStatus('llm-status', 'success', 'Antwort bereit!');

      // Handle suggested actions
      if (result.suggestedAction === 'show_tutorial') {
        // TODO: Show tutorial UI
      }
    } else {
      setCraftyMessage(CRAFTY_MESSAGES.error);
      updateStatus('llm-status', 'error', 'Keine Antwort...');
    }
  } catch (error) {
    console.error('Process voice error:', error);
    setCraftyMessage(CRAFTY_MESSAGES.error);
    updateStatus('llm-status', 'error', 'Fehler beim Denken');
  }
}

function setupVoiceCallbacks() {
  // VoiceController callbacks
  window.voiceController.onTranscriptUpdate = (text, isFinal) => {
    voiceTranscript.textContent = isFinal ? text : text + '...';
  };

  window.voiceController.onFinalTranscript = (text) => {
    stopRecording();
    processVoiceInput(text);
  };

  window.voiceController.onVolumeChange = (volume) => {
    // Update sound wave visualization
    const wave = document.querySelector('.sound-wave');
    if (wave) {
      wave.style.transform = `scaleY(${0.5 + volume * 2})`;
    }
  };

  window.voiceController.onPlaybackStateChange = (isPlaying) => {
    if (isPlaying) {
      setCraftyState('talking');
    } else {
      setCraftyState('');
    }
  };

  // CraftyBrain callbacks
  window.craftyBrain.onResponse = (response) => {
    setCraftyMessage(response.text);
    setCraftyState(response.emotion);
  };

  window.craftyBrain.onSpeaking = (isSpeaking) => {
    if (isSpeaking) {
      setCraftyState('talking');
    }
  };

  window.craftyBrain.onStateChange = (state) => {
    switch (state) {
      case 'thinking':
        updateStatus('llm-status', 'loading', 'Crafty denkt...');
        break;
      case 'speaking':
        updateStatus('llm-status', 'success', 'Crafty spricht!');
        break;
      case 'idle':
        updateStatus('llm-status', 'success', 'Bereit!');
        break;
      case 'error':
        updateStatus('llm-status', 'error', 'Ups, Fehler!');
        break;
    }
  };
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

  // Initialize voice modules
  if (window.voiceController) {
    await window.voiceController.init();
    setupVoiceCallbacks();
  }

  if (window.craftyBrain) {
    window.craftyBrain.init();
    // Set initial greeting
    setCraftyMessage(window.craftyBrain.getGreeting());
  }

  // Initial health check
  if (window.kidmod) {
    try {
      const health = await window.kidmod.llm.healthCheck({});
      if (health.ok) {
        updateStatus('llm-status', 'success', 'Bereit zum Denken!');
        updateStatus('stt-status', 'success', 'Bereit zum Zuhören!');
      }
    } catch (e) {
      updateStatus('llm-status', 'error', 'Nicht verbunden');
    }
  }

  console.log('KidModStudio initialized with Crafty Voice!');
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', init);
