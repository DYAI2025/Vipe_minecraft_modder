// VoiceController - Push-to-Talk Sprachsteuerung mit Audio-Wiedergabe
// Verwaltet Mikrofon-Aufnahme (STT) und TTS Audio-Wiedergabe

class VoiceController {
  constructor() {
    // Audio capture state
    this.mediaStream = null;
    this.audioContext = null;
    this.analyser = null;
    this.sourceNode = null;
    this.processorNode = null;
    this.isRecording = false;
    this.currentStreamId = null;
    this.chunkIndex = 0;
    this.sttCleanup = null;

    // Audio playback state
    this.audioQueue = [];
    this.isPlaying = false;
    this.ttsCleanup = null;

    // Callbacks
    this.onTranscriptUpdate = null;
    this.onFinalTranscript = null;
    this.onRecordingStateChange = null;
    this.onVolumeChange = null;
    this.onPlaybackStateChange = null;

    // Config
    this.sampleRate = 16000;
    this.bufferSize = 4096;
  }

  async init() {
    // Subscribe to STT events
    if (window.kidmod?.stt) {
      this.sttCleanup = window.kidmod.stt.onStreamEvent((event) => {
        this.handleSttEvent(event);
      });
    }

    // Subscribe to TTS events
    if (window.kidmod?.tts) {
      this.ttsCleanup = window.kidmod.tts.onStreamEvent((event) => {
        this.handleTtsEvent(event);
      });
    }

    return true;
  }

  destroy() {
    this.stopRecording();
    this.stopPlayback();

    if (this.sttCleanup) {
      this.sttCleanup();
      this.sttCleanup = null;
    }
    if (this.ttsCleanup) {
      this.ttsCleanup();
      this.ttsCleanup = null;
    }
  }

  // ==================== RECORDING (STT) ====================

  async startRecording() {
    if (this.isRecording) return;

    try {
      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.sampleRate,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: this.sampleRate
      });

      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Create analyser for volume visualization
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.sourceNode.connect(this.analyser);

      // Create processor for audio data
      this.processorNode = this.audioContext.createScriptProcessor(this.bufferSize, 1, 1);
      this.sourceNode.connect(this.processorNode);
      this.processorNode.connect(this.audioContext.destination);

      this.processorNode.onaudioprocess = (e) => {
        if (!this.isRecording) return;

        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16le = this.floatTo16BitPCM(inputData);

        // Send audio chunk to STT
        if (window.kidmod?.stt && this.currentStreamId) {
          window.kidmod.stt.streamPush({
            streamId: this.currentStreamId,
            chunkIndex: this.chunkIndex++,
            pcm16le
          });
        }

        // Update volume visualization
        this.updateVolume();
      };

      // Start STT stream
      this.currentStreamId = "voice-" + Date.now();
      this.chunkIndex = 0;

      if (window.kidmod?.stt) {
        const result = await window.kidmod.stt.streamStart({
          streamId: this.currentStreamId
        });

        if (!result.ok) {
          throw new Error(result.message || "STT stream start failed");
        }
      }

      this.isRecording = true;
      this.onRecordingStateChange?.(true);

    } catch (error) {
      console.error("[VoiceController] Start recording error:", error);
      this.cleanup();
      throw error;
    }
  }

  async stopRecording() {
    if (!this.isRecording) return;

    this.isRecording = false;

    // Stop STT stream
    if (window.kidmod?.stt && this.currentStreamId) {
      try {
        await window.kidmod.stt.streamStop({
          streamId: this.currentStreamId
        });
      } catch (error) {
        console.error("[VoiceController] Stop stream error:", error);
      }
    }

    this.cleanup();
    this.onRecordingStateChange?.(false);
  }

  cleanup() {
    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
  }

  floatTo16BitPCM(float32Array) {
    const pcm16 = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return new Uint8Array(pcm16.buffer);
  }

  updateVolume() {
    if (!this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    // Calculate average volume
    const sum = dataArray.reduce((a, b) => a + b, 0);
    const volume = sum / dataArray.length / 255;

    this.onVolumeChange?.(volume);
  }

  handleSttEvent(event) {
    if (event.streamId !== this.currentStreamId) return;

    switch (event.type) {
      case "interim":
        this.onTranscriptUpdate?.(event.text, false);
        break;
      case "final":
        this.onTranscriptUpdate?.(event.text, true);
        this.onFinalTranscript?.(event.text);
        break;
      case "state":
        console.log("[VoiceController] STT state:", event.state);
        break;
      case "error":
        console.error("[VoiceController] STT error:", event.message);
        this.stopRecording();
        break;
    }
  }

  // ==================== PLAYBACK (TTS) ====================

  handleTtsEvent(event) {
    switch (event.type) {
      case "start":
        this.isPlaying = true;
        this.audioQueue = [];
        this.onPlaybackStateChange?.(true);
        break;
      case "chunk":
        this.audioQueue.push(event.audioData);
        this.tryPlayAudio();
        break;
      case "end":
        this.isPlaying = false;
        this.onPlaybackStateChange?.(false);
        break;
      case "error":
        console.error("[VoiceController] TTS error:", event.message);
        this.isPlaying = false;
        this.onPlaybackStateChange?.(false);
        break;
    }
  }

  async tryPlayAudio() {
    // Simple implementation: collect chunks and play when stream ends
    // For better streaming, use Web Audio API with AudioWorklet
  }

  async playAudioChunks(chunks) {
    if (!chunks.length) return;

    try {
      // Combine all chunks
      const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }

      // Create blob and play
      const blob = new Blob([combined], { type: "audio/mp3" });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);

      audio.onended = () => {
        URL.revokeObjectURL(url);
        this.isPlaying = false;
        this.onPlaybackStateChange?.(false);
      };

      await audio.play();
    } catch (error) {
      console.error("[VoiceController] Playback error:", error);
      this.isPlaying = false;
      this.onPlaybackStateChange?.(false);
    }
  }

  async stopPlayback() {
    this.audioQueue = [];
    this.isPlaying = false;

    if (window.kidmod?.tts) {
      try {
        await window.kidmod.tts.stop({});
      } catch (error) {
        console.error("[VoiceController] Stop playback error:", error);
      }
    }

    this.onPlaybackStateChange?.(false);
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
      isPlaying: this.isPlaying
    };
  }
}

// Singleton instance
const voiceController = new VoiceController();

// Export for use in app.js
window.voiceController = voiceController;
