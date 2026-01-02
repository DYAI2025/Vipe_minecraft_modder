/**
 * WebSpeech STT Integration (Renderer Process)
 *
 * This module handles WebSpeech API in the renderer process.
 * When settings.stt.provider === 'webspeech', the renderer uses this instead of streaming to Main.
 *
 * Flow:
 * 1. User clicks microphone → startWebSpeechRecognition()
 * 2. Browser asks for mic permission
 * 3. SpeechRecognition starts listening
 * 4. Results come in → update UI + send to Crafty Brain
 * 5. Stop button → stop recognition
 */

class WebSpeechSTT {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.onTranscriptCallback = null;
    this.onFinalCallback = null;
    this.onErrorCallback = null;
    this.onStateChangeCallback = null;
    this.interimTranscript = '';
    this.finalTranscript = '';
  }

  /**
   * Check if WebSpeech is available in this browser
   */
  static isAvailable() {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  /**
   * Initialize Web Speech Recognition
   */
  init(language = 'de-DE') {
    if (!WebSpeechSTT.isAvailable()) {
      console.error('[WebSpeechSTT] Not available in this browser');
      return false;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();

    // Configuration
    this.recognition.lang = language;
    this.recognition.continuous = false; // Stop after one utterance
    this.recognition.interimResults = true; // Get partial results
    this.recognition.maxAlternatives = 1;

    // Event handlers
    this.recognition.onstart = () => {
      console.log('[WebSpeechSTT] Started listening');
      this.isListening = true;
      this.interimTranscript = '';
      this.finalTranscript = '';
      this.onStateChangeCallback?.('listening');
    };

    this.recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence;

        if (event.results[i].isFinal) {
          final += transcript;
          console.log(`[WebSpeechSTT] Final: "${transcript}" (confidence: ${confidence})`);
        } else {
          interim += transcript;
        }
      }

      if (interim) {
        this.interimTranscript = interim;
        this.onTranscriptCallback?.(interim, false, 0.8);
      }

      if (final) {
        this.finalTranscript += final;
        this.onTranscriptCallback?.(this.finalTranscript, true, 0.95);
        this.onFinalCallback?.(this.finalTranscript);
      }
    };

    this.recognition.onerror = (event) => {
      console.error('[WebSpeechSTT] Error:', event.error);

      let userMessage = 'Spracherkennung fehlgeschlagen';

      switch (event.error) {
        case 'no-speech':
          userMessage = 'Keine Sprache erkannt. Versuch es nochmal!';
          break;
        case 'audio-capture':
          userMessage = 'Mikrofon nicht gefunden oder Zugriff verweigert';
          break;
        case 'not-allowed':
          userMessage = 'Mikrofonzugriff wurde verweigert. Bitte erlaube den Zugriff!';
          break;
        case 'network':
          userMessage = 'Netzwerkfehler. WebSpeech benötigt Internet!';
          break;
        case 'aborted':
          userMessage = 'Spracherkennung abgebrochen';
          break;
      }

      this.onErrorCallback?.(userMessage, event.error);
      this.isListening = false;
      this.onStateChangeCallback?.('error');
    };

    this.recognition.onend = () => {
      console.log('[WebSpeechSTT] Stopped');
      this.isListening = false;
      this.onStateChangeCallback?.('done');
    };

    console.log('[WebSpeechSTT] Initialized');
    return true;
  }

  /**
   * Start listening
   */
  async start() {
    if (!this.recognition) {
      throw new Error('WebSpeechSTT not initialized. Call init() first.');
    }

    if (this.isListening) {
      console.warn('[WebSpeechSTT] Already listening');
      return;
    }

    try {
      this.recognition.start();
    } catch (error) {
      console.error('[WebSpeechSTT] Failed to start:', error);
      throw error;
    }
  }

  /**
   * Stop listening
   */
  stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  /**
   * Abort listening (cancel without results)
   */
  abort() {
    if (this.recognition && this.isListening) {
      this.recognition.abort();
    }
  }

  /**
   * Set callback for transcript updates
   */
  onTranscript(callback) {
    this.onTranscriptCallback = callback;
  }

  /**
   * Set callback for final transcript
   */
  onFinal(callback) {
    this.onFinalCallback = callback;
  }

  /**
   * Set callback for errors
   */
  onError(callback) {
    this.onErrorCallback = callback;
  }

  /**
   * Set callback for state changes
   */
  onStateChange(callback) {
    this.onStateChangeCallback = callback;
  }

  /**
   * Get current transcript
   */
  getTranscript() {
    return this.finalTranscript || this.interimTranscript;
  }
}

// Export for use in app.js
if (typeof window !== 'undefined') {
  window.WebSpeechSTT = WebSpeechSTT;
}
