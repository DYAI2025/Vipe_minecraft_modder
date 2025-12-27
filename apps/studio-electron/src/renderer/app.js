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
  if (!statusEl) return; // Element doesn't exist
  statusEl.className = 'status-item ' + status;
  const textEl = statusEl.querySelector('.status-text');
  if (textEl) textEl.textContent = text;
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

// ==================== WEBSPEECH TTS ====================
let webSpeechVoices = [];
let useWebSpeechTTS = true; // Default to WebSpeech (no API key needed)

function initWebSpeechTTS() {
  if ('speechSynthesis' in window) {
    // Load voices
    const loadVoices = () => {
      webSpeechVoices = speechSynthesis.getVoices();
      populateVoiceSelect();
    };

    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
    return true;
  }
  return false;
}

// OpenAI TTS voices
const OPENAI_VOICES = [
  { id: 'nova', name: 'Nova', desc: 'Freundlich & warm' },
  { id: 'alloy', name: 'Alloy', desc: 'Neutral & klar' },
  { id: 'echo', name: 'Echo', desc: 'Männlich & ruhig' },
  { id: 'fable', name: 'Fable', desc: 'Erzähler-Stimme' },
  { id: 'onyx', name: 'Onyx', desc: 'Tief & kräftig' },
  { id: 'shimmer', name: 'Shimmer', desc: 'Hell & freundlich' },
];

// ElevenLabs default voices
const ELEVENLABS_VOICES = [
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', desc: 'Weiblich, sanft' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', desc: 'Männlich, freundlich' },
  { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli', desc: 'Weiblich, jung' },
  { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', desc: 'Männlich, tief' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', desc: 'Männlich, klar' },
];

// LLM Provider URLs
const LLM_PROVIDERS = {
  ollama: { url: 'http://127.0.0.1:11434/v1', needsKey: false },
  openai: { url: 'https://api.openai.com/v1', needsKey: true },
  anthropic: { url: 'https://api.anthropic.com/v1', needsKey: true },
};

function populateVoiceSelect(provider = 'webspeech') {
  const voiceSelect = document.getElementById('tts-voice');
  if (!voiceSelect) return;

  voiceSelect.innerHTML = '';

  if (provider === 'openai') {
    OPENAI_VOICES.forEach(voice => {
      const option = document.createElement('option');
      option.value = voice.id;
      option.textContent = `🤖 ${voice.name} - ${voice.desc}`;
      voiceSelect.appendChild(option);
    });
  } else if (provider === 'elevenlabs') {
    ELEVENLABS_VOICES.forEach(voice => {
      const option = document.createElement('option');
      option.value = voice.id;
      option.textContent = `🎭 ${voice.name} - ${voice.desc}`;
      voiceSelect.appendChild(option);
    });
  } else {
    // WebSpeech voices
    const germanVoices = webSpeechVoices.filter(v => v.lang.startsWith('de'));
    const otherVoices = webSpeechVoices.filter(v => !v.lang.startsWith('de'));

    if (germanVoices.length === 0 && otherVoices.length === 0) {
      const option = document.createElement('option');
      option.value = 'default';
      option.textContent = '🌐 Standard-Stimme';
      voiceSelect.appendChild(option);
    } else {
      [...germanVoices, ...otherVoices].forEach((voice, i) => {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `${voice.name} (${voice.lang})`;
        if (voice.lang.startsWith('de')) option.textContent = '🇩🇪 ' + option.textContent;
        voiceSelect.appendChild(option);
      });
    }
  }
}

// Fetch Ollama models
async function fetchOllamaModels() {
  try {
    const response = await fetch('http://127.0.0.1:11434/api/tags');
    if (!response.ok) throw new Error('Ollama nicht erreichbar');
    const data = await response.json();
    return data.models || [];
  } catch (e) {
    console.error('Ollama fetch error:', e);
    return [];
  }
}

async function populateLlmModels() {
  const modelSelect = document.getElementById('llm-model');
  const provider = document.getElementById('llm-provider')?.value;
  if (!modelSelect) return;

  modelSelect.innerHTML = '<option value="">Lade...</option>';

  if (provider === 'ollama') {
    const models = await fetchOllamaModels();
    modelSelect.innerHTML = '';
    if (models.length === 0) {
      modelSelect.innerHTML = '<option value="">Keine Modelle gefunden</option>';
    } else {
      models.forEach(model => {
        const option = document.createElement('option');
        option.value = model.name;
        option.textContent = `🦙 ${model.name}`;
        modelSelect.appendChild(option);
      });
    }
  } else if (provider === 'openai') {
    modelSelect.innerHTML = `
      <option value="gpt-4o">🤖 GPT-4o</option>
      <option value="gpt-4o-mini">🤖 GPT-4o-mini</option>
      <option value="gpt-4-turbo">🤖 GPT-4-turbo</option>
      <option value="gpt-3.5-turbo">🤖 GPT-3.5-turbo</option>
    `;
  } else if (provider === 'anthropic') {
    modelSelect.innerHTML = `
      <option value="claude-sonnet-4-20250514">🧠 Claude Sonnet 4</option>
      <option value="claude-3-5-sonnet-20241022">🧠 Claude 3.5 Sonnet</option>
      <option value="claude-3-haiku-20240307">🧠 Claude 3 Haiku</option>
    `;
  }
}

function speakWithWebSpeech(text) {
  if (!('speechSynthesis' in window)) return false;

  // Cancel any ongoing speech
  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  // Get selected voice
  const voiceSelect = document.getElementById('tts-voice');
  const speedSlider = document.getElementById('tts-speed');

  if (voiceSelect && webSpeechVoices.length > 0) {
    const voiceIndex = parseInt(voiceSelect.value) || 0;
    utterance.voice = webSpeechVoices[voiceIndex];
  }

  // Find a German voice as fallback
  if (!utterance.voice) {
    utterance.voice = webSpeechVoices.find(v => v.lang.startsWith('de')) || webSpeechVoices[0];
  }

  utterance.rate = speedSlider ? parseFloat(speedSlider.value) : 0.9;
  utterance.lang = 'de-DE';

  // Animation callbacks
  utterance.onstart = () => setCraftyState('talking');
  utterance.onend = () => setCraftyState('');

  speechSynthesis.speak(utterance);
  return true;
}

// ==================== SETTINGS ====================
function setupSettings() {
  const settingsBtn = document.querySelector('.settings-btn');
  const settingsModal = document.getElementById('settings-modal');
  const closeBtn = document.getElementById('btn-close-settings');
  const saveBtn = document.getElementById('btn-save-settings');
  const testTtsBtn = document.getElementById('btn-test-tts');
  const ttsProvider = document.getElementById('tts-provider');
  const ttsSpeed = document.getElementById('tts-speed');
  const ttsSpeedValue = document.getElementById('tts-speed-value');

  // Open settings
  settingsBtn?.addEventListener('click', async () => {
    settingsModal.style.display = 'flex';
    await loadSettingsToUI();
  });

  // Close settings
  closeBtn?.addEventListener('click', () => {
    settingsModal.style.display = 'none';
  });

  // Click outside to close
  settingsModal?.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      settingsModal.style.display = 'none';
    }
  });

  // Speed slider
  ttsSpeed?.addEventListener('input', () => {
    ttsSpeedValue.textContent = ttsSpeed.value + 'x';
  });

  // Test TTS
  testTtsBtn?.addEventListener('click', async () => {
    const text = 'Ssssalut! Ich bin Crafty, dein Minecraft Helfer!';
    const provider = ttsProvider?.value;
    const voiceSelect = document.getElementById('tts-voice');
    const voice = voiceSelect?.value;

    testTtsBtn.disabled = true;
    testTtsBtn.textContent = '🔊 Spiele...';

    try {
      if (provider === 'webspeech') {
        speakWithWebSpeech(text);
        // Re-enable after estimated speech duration
        setTimeout(() => {
          testTtsBtn.disabled = false;
          testTtsBtn.textContent = '🔊 Testen';
        }, 3000);
      } else {
        // OpenAI TTS via IPC
        const apiKey = document.getElementById('tts-api-key')?.value;
        if (!apiKey) {
          alert('Bitte gib zuerst deinen OpenAI API-Key ein!');
          testTtsBtn.disabled = false;
          testTtsBtn.textContent = '🔊 Testen';
          return;
        }

        // Check if kidmod bridge is available
        if (!window.kidmod) {
          alert('Fehler: Bridge nicht verfügbar');
          testTtsBtn.disabled = false;
          testTtsBtn.textContent = '🔊 Testen';
          return;
        }

        if (!window.kidmod.tts) {
          alert('Fehler: TTS nicht verfügbar');
          testTtsBtn.disabled = false;
          testTtsBtn.textContent = '🔊 Testen';
          return;
        }

        // Save settings first to apply API key
        console.log('[TTS Test] Saving settings...');
        await saveSettingsFromUI();
        console.log('[TTS Test] Settings saved, calling TTS...');

        const result = await window.kidmod.tts.speak({
          requestId: 'test-' + Date.now(),
          text,
          settingsOverride: {
            provider: 'openai',
            voice: voice || 'nova',
          }
        });

        console.log('[TTS Test] Result:', result);

        if (!result?.ok) {
          alert('TTS Fehler: ' + (result?.error?.message || 'Unbekannter Fehler - Result: ' + JSON.stringify(result)));
        }

        testTtsBtn.disabled = false;
        testTtsBtn.textContent = '🔊 Testen';
      }
    } catch (e) {
      console.error('TTS test error:', e);
      alert('TTS Test fehlgeschlagen: ' + e.message);
      testTtsBtn.disabled = false;
      testTtsBtn.textContent = '🔊 Testen';
    }
  });

  // Save settings
  saveBtn?.addEventListener('click', async () => {
    await saveSettingsFromUI();
    settingsModal.style.display = 'none';
    setCraftyMessage('Einstellungen gespeichert! 💾');
  });

  // TTS Provider change - show/hide API key field and update voices
  ttsProvider?.addEventListener('change', () => {
    const provider = ttsProvider.value;
    useWebSpeechTTS = provider === 'webspeech';

    const apiKeyRow = document.getElementById('tts-api-key-row');
    if (apiKeyRow) {
      apiKeyRow.style.display = useWebSpeechTTS ? 'none' : 'flex';
    }

    // Update voice options for the selected provider
    populateVoiceSelect(provider);
  });

  // LLM Provider change
  const llmProvider = document.getElementById('llm-provider');
  const llmApiKeyRow = document.getElementById('llm-api-key-row');
  const llmHint = document.getElementById('llm-hint');
  const llmUrl = document.getElementById('llm-url');

  llmProvider?.addEventListener('change', async () => {
    const provider = llmProvider.value;
    const config = LLM_PROVIDERS[provider];

    // Update URL
    if (llmUrl && config) {
      llmUrl.value = config.url;
    }

    // Show/hide API key
    if (llmApiKeyRow) {
      llmApiKeyRow.style.display = config?.needsKey ? 'flex' : 'none';
    }
    if (llmHint) {
      llmHint.textContent = config?.needsKey ? '🔑 API-Key erforderlich' : '💡 Ollama braucht keinen API-Key';
    }

    // Update models
    await populateLlmModels();
  });

  // Refresh models button
  const refreshModelsBtn = document.getElementById('btn-refresh-models');
  refreshModelsBtn?.addEventListener('click', async () => {
    refreshModelsBtn.textContent = '⏳';
    await populateLlmModels();
    refreshModelsBtn.textContent = '🔄';
  });

  // Test LLM connection
  const testLlmBtn = document.getElementById('btn-test-llm');
  testLlmBtn?.addEventListener('click', async () => {
    testLlmBtn.disabled = true;
    testLlmBtn.textContent = '🔄 Teste...';

    try {
      if (window.kidmod) {
        const result = await window.kidmod.llm.healthCheck({});
        if (result.ok) {
          alert(`✅ Verbindung OK!\nModell: ${result.model}\nLatenz: ${result.latencyMs}ms`);
        } else {
          alert(`❌ Verbindung fehlgeschlagen: ${result.message}`);
        }
      } else {
        // Direct test for Ollama
        const url = document.getElementById('llm-url')?.value || 'http://127.0.0.1:11434/v1';
        const response = await fetch(url.replace('/v1', '/api/tags'));
        if (response.ok) {
          alert('✅ Ollama erreichbar!');
        } else {
          alert('❌ Ollama nicht erreichbar');
        }
      }
    } catch (e) {
      alert('❌ Fehler: ' + e.message);
    }

    testLlmBtn.disabled = false;
    testLlmBtn.textContent = '🧪 Verbindung testen';
  });

  // Validate TTS API key
  const validateTtsKeyBtn = document.getElementById('btn-validate-tts-key');
  validateTtsKeyBtn?.addEventListener('click', async () => {
    const apiKey = document.getElementById('tts-api-key')?.value;
    const provider = ttsProvider?.value;

    if (!apiKey) {
      alert('Bitte API-Key eingeben');
      return;
    }

    validateTtsKeyBtn.textContent = '⏳';

    try {
      if (provider === 'openai') {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        if (response.ok) {
          alert('✅ OpenAI API-Key gültig!');
        } else {
          alert('❌ OpenAI API-Key ungültig');
        }
      } else if (provider === 'elevenlabs') {
        const response = await fetch('https://api.elevenlabs.io/v1/user', {
          headers: { 'xi-api-key': apiKey }
        });
        if (response.ok) {
          alert('✅ ElevenLabs API-Key gültig!');
        } else {
          alert('❌ ElevenLabs API-Key ungültig');
        }
      }
    } catch (e) {
      alert('❌ Fehler: ' + e.message);
    }

    validateTtsKeyBtn.textContent = '✓';
  });

  // Validate LLM API key
  const validateLlmKeyBtn = document.getElementById('btn-validate-llm-key');
  validateLlmKeyBtn?.addEventListener('click', async () => {
    const apiKey = document.getElementById('llm-api-key')?.value;
    const provider = llmProvider?.value;

    if (!apiKey) {
      alert('Bitte API-Key eingeben');
      return;
    }

    validateLlmKeyBtn.textContent = '⏳';

    try {
      if (provider === 'openai') {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        alert(response.ok ? '✅ OpenAI API-Key gültig!' : '❌ API-Key ungültig');
      } else if (provider === 'anthropic') {
        // Anthropic doesn't have a simple validation endpoint, so we'll just check format
        if (apiKey.startsWith('sk-ant-')) {
          alert('✅ Anthropic API-Key Format korrekt');
        } else {
          alert('⚠️ Anthropic API-Key sollte mit sk-ant- beginnen');
        }
      }
    } catch (e) {
      alert('❌ Fehler: ' + e.message);
    }

    validateLlmKeyBtn.textContent = '✓';
  });
}

async function loadSettingsToUI() {
  // Load Ollama models even without bridge
  await populateLlmModels();

  // Initialize voice select
  populateVoiceSelect('webspeech');

  if (!window.kidmod) {
    console.log('Bridge not available, using defaults');
    return;
  }

  try {
    const settings = await window.kidmod.settings.get();

    document.getElementById('llm-url').value = settings.llm?.providerConfig?.baseUrl || 'http://127.0.0.1:11434/v1';
    document.getElementById('tts-speed').value = settings.tts?.providerConfig?.speed || 0.9;
    document.getElementById('tts-speed-value').textContent = (settings.tts?.providerConfig?.speed || 0.9) + 'x';

    const ttsProvider = document.getElementById('tts-provider');
    const ttsApiKeyRow = document.getElementById('tts-api-key-row');
    const provider = settings.tts?.providerConfig?.provider || 'webspeech';

    // Set TTS provider
    if (provider === 'openai' || provider === 'elevenlabs') {
      ttsProvider.value = provider;
      useWebSpeechTTS = false;
      if (ttsApiKeyRow) ttsApiKeyRow.style.display = 'flex';
    } else {
      ttsProvider.value = 'webspeech';
      useWebSpeechTTS = true;
      if (ttsApiKeyRow) ttsApiKeyRow.style.display = 'none';
    }

    // Update voice options for the selected provider
    populateVoiceSelect(provider);

    // Select the current voice if set
    const voiceSelect = document.getElementById('tts-voice');
    const currentVoice = settings.tts?.providerConfig?.voice;
    if (voiceSelect && currentVoice) {
      voiceSelect.value = currentVoice;
    }

    // Set LLM model after models are loaded
    const modelSelect = document.getElementById('llm-model');
    const currentModel = settings.llm?.providerConfig?.model;
    if (modelSelect && currentModel) {
      // Wait a bit for models to load
      setTimeout(() => {
        modelSelect.value = currentModel;
      }, 500);
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
}

async function saveSettingsFromUI() {
  if (!window.kidmod) return;

  try {
    const ttsProviderValue = document.getElementById('tts-provider').value;
    useWebSpeechTTS = ttsProviderValue === 'webspeech';

    const ttsApiKey = document.getElementById('tts-api-key')?.value;
    const llmApiKey = document.getElementById('llm-api-key')?.value;
    const voiceSelect = document.getElementById('tts-voice');
    const selectedVoice = voiceSelect?.value;

    const patch = {
      llm: {
        providerConfig: {
          provider: 'openai_compatible',
          baseUrl: document.getElementById('llm-url').value,
          model: document.getElementById('llm-model').value,
        }
      },
      tts: {
        providerConfig: {
          provider: ttsProviderValue,
          speed: parseFloat(document.getElementById('tts-speed').value),
          voice: selectedVoice,
        }
      }
    };

    // Store API keys if provided (for OpenAI TTS)
    if (ttsApiKey && ttsProviderValue === 'openai') {
      // Store via secret store
      if (window.kidmod.secrets?.set) {
        await window.kidmod.secrets.set('openai_api_key', ttsApiKey);
      }
      patch.tts.providerConfig.apiKeyRef = 'secret:openai_api_key';
    }

    // LLM API key (optional for Ollama)
    if (llmApiKey) {
      if (window.kidmod.secrets?.set) {
        await window.kidmod.secrets.set('llm_api_key', llmApiKey);
      }
      patch.llm.providerConfig.apiKeyRef = 'secret:llm_api_key';
    }

    await window.kidmod.settings.update(patch);
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

// ==================== INITIALISIERUNG ====================
async function init() {
  // Setup UI
  setupTabs();
  setupCraftingSlots();
  renderInventory('blocks');
  startIdleMessages();
  setupSettings();

  // Initialize WebSpeech TTS
  initWebSpeechTTS();

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
    // Override speak to use WebSpeech when enabled
    const originalSpeak = window.craftyBrain.speak.bind(window.craftyBrain);
    window.craftyBrain.speak = async (text) => {
      if (useWebSpeechTTS) {
        speakWithWebSpeech(text);
      } else {
        await originalSpeak(text);
      }
    };
    // Set initial greeting
    setCraftyMessage(window.craftyBrain.getGreeting());
  }

  // Initialize chat panel
  if (window.chatPanel) {
    window.chatPanel.init();
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
