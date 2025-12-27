// ChatPanel - WebSocket-based chat with Crafty
class ChatPanel {
  constructor() {
    this.ws = null;
    this.messages = [];
    this.isConnected = false;
    this.currentStreamMessage = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  init() {
    this.container = document.getElementById('chat-panel');
    this.messageList = document.getElementById('chat-messages');
    this.input = document.getElementById('chat-input');
    this.sendBtn = document.getElementById('chat-send');
    this.voiceBtn = document.getElementById('chat-voice');

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
      return;
    }

    console.log('[ChatPanel] Connecting...');
    this.ws = new WebSocket('ws://127.0.0.1:3847/chat');

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
        }
        const content = this.currentStreamMessage.querySelector('.message-content');
        if (content) {
          content.textContent += msg.content;
        }
        this.scrollToBottom();
      } else if (msg.done) {
        // Stream complete
        this.currentStreamMessage = null;
      } else {
        // Complete message (welcome, etc.)
        this.addMessage('assistant', msg.content);
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
    // TODO: Implement voice recording
    console.log('[ChatPanel] Voice toggle - not implemented yet');
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
