class VoiceFeatures {
    constructor() {
        this.wsControl = null;
        this.controlUrl = 'ws://127.0.0.1:3850/ws/control';
        this.uploadUrl = 'http://127.0.0.1:3850/upload_voice';
        this.hqModeEnabled = false;

        this.mediaStream = null;
        this.audioContext = null;
        this.processor = null;
        this.isStreaming = false;
    }

    get isConnected() {
        return this.wsControl && this.wsControl.readyState === WebSocket.OPEN;
    }

    async connect() {
        try {
            this.wsControl = new WebSocket(this.controlUrl);

            this.wsControl.onopen = () => {
                console.log('[VoiceFeatures] Connected to HQ Voice Server');
            };

            this.wsControl.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'transcription') {
                    console.log('[VoiceFeatures] Heard:', data.text);
                    // Optional: Update UI transcript
                    const transcriptEl = document.getElementById('voice-transcript');
                    if (transcriptEl) transcriptEl.textContent = data.text;
                }
            };

            this.wsControl.onclose = () => {
                setTimeout(() => this.connect(), 2000);
            };

        } catch (e) {
            console.warn('[VoiceFeatures] Server not available');
        }
    }

    async startStreaming() {
        if (!this.isConnected) {
            console.warn('Cannot stream: Not connected');
            return;
        }

        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 }); // Whisper wants 16k preferably

            const source = this.audioContext.createMediaStreamSource(this.mediaStream);
            // Buffer size 4096 gives ~250ms latency chunk
            this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

            this.processor.onaudioprocess = (e) => {
                if (!this.isConnected) return;

                const inputData = e.inputBuffer.getChannelData(0);
                // Convert Float32 to Int16
                const pcmData = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) {
                    const s = Math.max(-1, Math.min(1, inputData[i]));
                    pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                }

                // Send binary
                if (this.wsControl.readyState === WebSocket.OPEN) {
                    this.wsControl.send(pcmData.buffer);
                }
            };

            source.connect(this.processor);
            this.processor.connect(this.audioContext.destination); // Needed for Chrome to activate processor

            this.isStreaming = true;
            console.log('[VoiceFeatures] Streaming started (16kHz PCM)');

        } catch (e) {
            console.error('Mic access failed:', e);
            alert('Mikrofon Fehler: ' + e.message);
        }
    }

    stopStreaming() {
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
        }
        if (this.audioContext) {
            this.audioContext.close();
        }
        if (this.processor) {
            this.processor.disconnect();
        }
        this.isStreaming = false;
        console.log('[VoiceFeatures] Streaming stopped');
    }

    async uploadVoice(file) {
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await fetch(this.uploadUrl, { method: 'POST', body: formData });
            const data = await res.json();
            this.addProfileOption(data.filename, data.path);
            return data;
        } catch (e) { throw e; }
    }

    addProfileOption(name, path) {
        const select = document.getElementById('voice-profile-select');
        if (!select) return;
        const option = document.createElement('option');
        option.value = path;
        option.textContent = name;
        select.appendChild(option);
        select.value = path;
        this.setProfile(path);
    }

    setProfile(path) {
        if (!this.isConnected) return;
        this.wsControl.send(JSON.stringify({ command: 'set_profile', path: path }));
    }
}

window.voiceFeatures = new VoiceFeatures();
window.voiceFeatures.connect();
