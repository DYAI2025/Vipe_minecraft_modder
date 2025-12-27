// ChatPanel - WebSocket-based chat with Crafty
console.log('[ChatPanel] Script loaded');

class ChatPanel {
  constructor() {
    this.ws = null;
    this.messages = [];
    this.isConnected = false;
    this.currentStreamMessage = null;
    this.currentStreamText = '';
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;

    // TTS
    this.ttsEnabled = true;
    this.ttsVoice = null;
    this.initTTS();

    // STT
    this.recognition = null;
    this.isRecording = false;
    this.initSTT();
  }

  initTTS() {
    if ('speechSynthesis' in window) {
      // Load German voice with retry
      const loadVoices = () => {
        const voices = speechSynthesis.getVoices();
        if (voices.length === 0) {
          // Voices not loaded yet, retry
          setTimeout(loadVoices, 100);
          return;
        }
        // Prefer German, then English, then any
        this.ttsVoice = voices.find(v => v.lang.startsWith('de'))
          || voices.find(v => v.lang.startsWith('en'))
          || voices[0];
        console.log('[ChatPanel] TTS voice:', this.ttsVoice?.name, this.ttsVoice?.lang);
      };
      loadVoices();
      speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  initSTT() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'de-DE';
      this.recognition.continuous = false;
      this.recognition.interimResults = true;

      this.recognition.onresult = (event) => {
        const result = event.results[event.results.length - 1];
        const text = result[0].transcript;

        if (result.isFinal) {
          console.log('[ChatPanel] STT final:', text);
          this.input.value = text;
          this.sendMessage();
        } else {
          this.input.value = text + '...';
        }
      };

      this.recognition.onend = () => {
        this.isRecording = false;
        this.updateVoiceButton(false);
      };

      this.recognition.onerror = (e) => {
        console.error('[ChatPanel] STT error:', e.error);
        this.isRecording = false;
        this.updateVoiceButton(false);
      };

      console.log('[ChatPanel] STT initialized');
    } else {
      console.warn('[ChatPanel] STT not supported');
    }
  }

  speak(text) {
    if (!this.ttsEnabled) {
      console.log('[ChatPanel] TTS disabled');
      return;
    }
    if (!('speechSynthesis' in window)) {
      console.log('[ChatPanel] speechSynthesis not available');
      return;
    }

    console.log('[ChatPanel] Speaking:', text.substring(0, 50) + '...');

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Try to get a voice if not set
    if (!this.ttsVoice) {
      const voices = speechSynthesis.getVoices();
      this.ttsVoice = voices.find(v => v.lang.startsWith('de'))
        || voices.find(v => v.lang.startsWith('en'))
        || voices[0];
      console.log('[ChatPanel] Late voice load:', this.ttsVoice?.name);
    }

    if (this.ttsVoice) {
      utterance.voice = this.ttsVoice;
    }
    utterance.lang = 'de-DE';
    utterance.rate = 0.9;

    utterance.onstart = () => console.log('[ChatPanel] TTS started');
    utterance.onend = () => console.log('[ChatPanel] TTS ended');
    utterance.onerror = (e) => console.error('[ChatPanel] TTS error:', e);

    speechSynthesis.speak(utterance);
  }

  updateVoiceButton(recording) {
    if (this.voiceBtn) {
      this.voiceBtn.textContent = recording ? '⏹️' : '🎤';
      this.voiceBtn.title = recording ? 'Stoppen' : 'Sprechen';
      this.voiceBtn.classList.toggle('recording', recording);
    }
  }

  init() {
    console.log('[ChatPanel] Initializing...');
    this.container = document.getElementById('chat-panel');
    this.messageList = document.getElementById('chat-messages');
    this.input = document.getElementById('chat-input');
    this.sendBtn = document.getElementById('chat-send');
    this.voiceBtn = document.getElementById('chat-voice');

    console.log('[ChatPanel] Elements:', {
      container: !!this.container,
      messageList: !!this.messageList,
      input: !!this.input,
      sendBtn: !!this.sendBtn
    });

    if (!this.container || !this.messageList || !this.input) {
      console.warn('[ChatPanel] Required elements not found');
      return;
    }

    this.sendBtn?.addEventListener('click', () => this.sendMessage());
    this.input?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    this.voiceBtn?.addEventListener('click', () => this.toggleVoice());

    this.connect();
  }

  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('[ChatPanel] Already connected');
      return;
    }

    const wsUrl = 'ws://127.0.0.1:3847/chat';
    console.log('[ChatPanel] Connecting to', wsUrl);

    try {
      this.ws = new WebSocket(wsUrl);
      console.log('[ChatPanel] WebSocket created');
    } catch (e) {
      console.error('[ChatPanel] WebSocket creation failed:', e);
      return;
    }

    this.ws.onopen = () => {
      console.log('[ChatPanel] Connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.updateStatus('connected');
    };

    this.ws.onclose = () => {
      console.log('[ChatPanel] Disconnected');
      this.isConnected = false;
      this.updateStatus('disconnected');

      // Reconnect with backoff
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
        this.reconnectAttempts++;
        console.log(`[ChatPanel] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
        setTimeout(() => this.connect(), delay);
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        this.handleMessage(msg);
      } catch (e) {
        console.error('[ChatPanel] Parse error:', e);
      }
    };

    this.ws.onerror = (e) => {
      console.error('[ChatPanel] WebSocket error:', e);
    };
  }

  handleMessage(msg) {
    if (msg.type === 'assistant') {
      if (msg.streaming) {
        // Streaming chunk
        if (!this.currentStreamMessage) {
          this.currentStreamMessage = this.addMessage('assistant', '');
          this.currentStreamText = '';
        }
        const content = this.currentStreamMessage.querySelector('.message-content');
        if (content) {
          content.textContent += msg.content;
          this.currentStreamText += msg.content;
        }
        this.scrollToBottom();
      } else if (msg.done) {
        // Stream complete - speak the full response
        if (this.currentStreamText) {
          this.speak(this.currentStreamText);
        }
        this.currentStreamMessage = null;
        this.currentStreamText = '';
      } else {
        // Complete message (welcome, etc.)
        this.addMessage('assistant', msg.content);
        this.speak(msg.content);
      }
    } else if (msg.type === 'error') {
      this.addMessage('error', msg.content);
    }
  }

  addMessage(type, content) {
    const div = document.createElement('div');
    div.className = `chat-message ${type}`;

    const icon = type === 'assistant' ? '🤖' : type === 'error' ? '⚠️' : '👤';
    const name = type === 'assistant' ? 'Crafty' : type === 'error' ? 'Fehler' : 'Du';

    div.innerHTML = `
      <div class="message-header">
        <span class="message-icon">${icon}</span>
        <span class="message-name">${name}</span>
        <span class="message-time">${this.formatTime(new Date())}</span>
      </div>
      <div class="message-content">${this.escapeHtml(content)}</div>
    `;

    this.messageList.appendChild(div);
    this.messages.push({ type, content, timestamp: Date.now() });
    this.scrollToBottom();
    return div;
  }

  sendMessage() {
    const text = this.input.value.trim();
    if (!text || !this.isConnected) return;

    this.addMessage('user', text);
    this.input.value = '';

    this.ws.send(JSON.stringify({
      action: 'chat',
      payload: text
    }));
  }

  toggleVoice() {
    if (!this.recognition) {
      console.warn('[ChatPanel] STT not available');
      return;
    }

    if (this.isRecording) {
      this.recognition.stop();
      this.isRecording = false;
      this.updateVoiceButton(false);
    } else {
      try {
        this.recognition.start();
        this.isRecording = true;
        this.updateVoiceButton(true);
        console.log('[ChatPanel] Recording started');
      } catch (e) {
        console.error('[ChatPanel] Failed to start recording:', e);
      }
    }
  }

  scrollToBottom() {
    if (this.messageList) {
      this.messageList.scrollTop = this.messageList.scrollHeight;
    }
  }

  formatTime(date) {
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  updateStatus(status) {
    const indicator = document.getElementById('chat-status');
    if (indicator) {
      indicator.className = `chat-status ${status}`;
      indicator.title = status === 'connected' ? 'Verbunden' : 'Nicht verbunden';
    }
  }
}

// Export as global
window.chatPanel = new ChatPanel();
