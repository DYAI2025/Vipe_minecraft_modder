// VoiceController - Sprachsteuerung mit WebSpeech API
// Verwendet browser-native SpeechRecognition (STT) und SpeechSynthesis (TTS)

class VoiceController {
  constructor() {
    // Speech Recognition (STT)
    this.recognition = null;
    this.isRecording = false;
    this.finalTranscript = '';

    // Callbacks
    this.onTranscriptUpdate = null;
    this.onFinalTranscript = null;
    this.onRecordingStateChange = null;
    this.onVolumeChange = null;
    this.onPlaybackStateChange = null;

    // Check for Web Speech API support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'de-DE';

      this.recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          this.finalTranscript += finalTranscript;
          this.onTranscriptUpdate?.(this.finalTranscript, true);
        } else if (interimTranscript) {
          this.onTranscriptUpdate?.(this.finalTranscript + interimTranscript, false);
        }

        // Simulate volume changes for visualization
        this.onVolumeChange?.(0.5 + Math.random() * 0.5);
      };

      this.recognition.onerror = (event) => {
        console.error('[VoiceController] Recognition error:', event.error);
        if (event.error !== 'no-speech') {
          this.stopRecording();
        }
      };

      this.recognition.onend = () => {
        if (this.isRecording) {
          // Auto-stopped - emit final transcript
          const transcript = this.finalTranscript.trim();
          if (transcript) {
            this.onFinalTranscript?.(transcript);
          }
          this.isRecording = false;
          this.onRecordingStateChange?.(false);
        }
      };
    }
  }

  async init() {
    if (!this.recognition) {
      console.warn('[VoiceController] Web Speech API not supported');
      return false;
    }
    console.log('[VoiceController] WebSpeech STT initialized');
    return true;
  }

  destroy() {
    this.stopRecording();
  }

  // ==================== RECORDING (STT) ====================

  async startRecording() {
    if (this.isRecording || !this.recognition) return;

    try {
      this.finalTranscript = '';
      this.recognition.start();
      this.isRecording = true;
      this.onRecordingStateChange?.(true);
      console.log('[VoiceController] Recording started');
    } catch (error) {
      console.error('[VoiceController] Start recording error:', error);
      throw error;
    }
  }

  async stopRecording() {
    if (!this.isRecording || !this.recognition) return;

    try {
      this.recognition.stop();
      // onend handler will emit final transcript and update state
      console.log('[VoiceController] Recording stopped');
    } catch (error) {
      console.error('[VoiceController] Stop recording error:', error);
      this.isRecording = false;
      this.onRecordingStateChange?.(false);
    }
  }

  // ==================== TOGGLE ====================

  async toggle() {
    if (this.isRecording) {
      await this.stopRecording();
    } else {
      await this.startRecording();
    }
    return this.isRecording;
  }

  getState() {
    return {
      isRecording: this.isRecording,
      isPlaying: false
    };
  }
}

// Singleton instance
const voiceController = new VoiceController();

// Export for use in app.js
window.voiceController = voiceController;
