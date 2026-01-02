import logging
import numpy as np
import io
from RealtimeSTT import AudioToTextRecorder

logger = logging.getLogger("STTEngine")

class STTEngine:
    def __init__(self, model="small", language="de"):
        self.recorder = None
        self.model = model
        self.language = language
        self.is_recording = False
        self.on_text_callback = None

    def start(self, on_text_callback):
        """Initializes the recorder (lazy loading)"""
        if self.recorder:
            return

        logger.info(f"Initializing Whisper ({self.model})...")
        self.on_text_callback = on_text_callback
        
        # We assume input device logic is handled by feed_audio
        try:
            self.recorder = AudioToTextRecorder(
                model=self.model,
                language=self.language,
                spinner=False,
                silero_sensitivity=0.4,
                post_speech_silence_duration=0.6,
                enable_realtime_transcription=True,
                use_microphone=False # Important: We feed audio manually!
            )
            logger.info("STT Engine ready for audio feed.")
        except Exception as e:
            logger.error(f"Failed to init STT: {e}")

    def feed_pcm(self, pcm_data: bytes):
        """Feeds PCM chunks (16-bit mono 16kHz) from WebSocket"""
        if not self.recorder:
            logger.warning("STT not initialized, starting...")
            self.start(lambda text: logger.info(f"Transcribed: {text}"))

        try:
            # Convert bytes to numpy array (assuming int16 format)
            audio_chunk = np.frombuffer(pcm_data, dtype=np.int16)
            
            # Convert to float32 as RealtimeSTT internal processing might prefer it, 
            # though feed_audio documentation usually accepts int16 or float32.
            # Let's try direct feed first.
            self.recorder.feed_audio(audio_chunk)
            
            # Check for transcription
            text = self.recorder.text()
            if text and self.on_text_callback:
                self.on_text_callback(text)
                
        except Exception as e:
            logger.error(f"Error feeding audio: {e}")

    def shutdown(self):
        if self.recorder:
            self.recorder.shutdown()
