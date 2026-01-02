import logging
import os
from RealtimeTTS import TextToAudioStream, CoquiEngine, SystemEngine

logger = logging.getLogger("AudioEngine")

class AudioEngine:
    def __init__(self, use_gpu=True):
        self.engine = None
        self.use_gpu = use_gpu
        self.current_voice_sample = None

    def initialize_tts(self, voice_sample_path: str = None):
        """Initializes Coqui XTTS with a voice sample or falls back to System TTS"""
        logger.info(f"Initializing TTS with voice sample: {voice_sample_path}")
        
        try:
            if voice_sample_path and os.path.exists(voice_sample_path):
                logger.info("Starting Coqui XTTSv2...")
                # Coqui configurations for 1080 Ti optimization
                self.engine = CoquiEngine(
                    voice=voice_sample_path,
                    use_deepspeed=False, # Often causes issues on Windows/some Linux setups, safe default off
                    level=logging.WARNING
                )
            else:
                logger.warning("No voice sample provided or file not found. Fallback to System Engine.")
                self.engine = SystemEngine()
                
            self.stream = TextToAudioStream(self.engine)
            self.current_voice_sample = voice_sample_path
        except Exception as e:
            logger.error(f"Failed to init Coqui TTS: {e}")
            logger.info("Fallback to System Engine")
            self.engine = SystemEngine()
            self.stream = TextToAudioStream(self.engine)

    def speak_stream(self, text_generator):
        """feeds a text generator (LLM stream) into the audio stream"""
        if not self.engine:
            self.initialize_tts()
            
        logger.info("Starting audio stream...")
        self.stream.feed(text_generator)
        # In a real async environment, we might need a non-blocking play method
        # RealtimeTTS play is blocking by default, but handles buffering internally
        self.stream.play()

    def set_voice(self, voice_sample_path: str):
        """Swaps the voice model reference audio"""
        if self.current_voice_sample == voice_sample_path:
            return
            
        if isinstance(self.engine, CoquiEngine) and os.path.exists(voice_sample_path):
             # Coqui allows setting voice without full reload if just sample changes? 
             # Actually CoquiEngine takes voice in constructor. 
             # We might need to re-init or use specific Coqui methods if available.
             # For robustness: Re-init.
             self.initialize_tts(voice_sample_path)
