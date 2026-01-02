import os
import logging
import asyncio
import json
from fastapi import FastAPI, WebSocket, UploadFile, File, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from services.llm_engine import LLMEngine
from services.audio_engine import AudioEngine
from services.stt_engine import STTEngine

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("VoiceServer")

# Global State
class VoiceServerState:
    def __init__(self):
        self.llm = LLMEngine()
        self.audio = AudioEngine()
        self.stt = STTEngine()
        self.active_socket: WebSocket = None # Single user focus for now

state = VoiceServerState()

# Callback for STT -> LLM -> TTS pipeline
def on_stt_transcription(text: str):
    logger.info(f"🎤 STT Detected: {text}")
    if not text.strip():
        return
        
    if state.active_socket:
        # Notify Client "I heard you"
        asyncio.run_coroutine_threadsafe(
            state.active_socket.send_json({"type": "transcription", "text": text}),
            loop
        )
        # Trigger LLM/TTS Pipeline
        asyncio.run_coroutine_threadsafe(
            process_text_input(text),
            loop
        )

async def process_text_input(text: str):
    logger.info(f"🤖 Processing: {text}")
    # 1. LLM Stream
    stream = state.llm.chat_stream(text)
    
    # 2. TTS Stream
    if state.active_socket:
         await state.active_socket.send_json({"type": "status", "status": "thinking"})
         
    # Run blocking TTS in thread
    await asyncio.to_thread(state.audio.speak_stream, stream)
    
    if state.active_socket:
         await state.active_socket.send_json({"type": "status", "status": "done"})

# Define global loop for threadsafe calls
loop = asyncio.new_event_loop()
asyncio.set_event_loop(loop)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🎤 Voice Server starting...")
    # Init STT with callback
    state.stt.start(on_stt_transcription)
    yield
    logger.info("🎤 Voice Server shutting down...")

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws/control")
async def control_endpoint(websocket: WebSocket):
    await websocket.accept()
    state.active_socket = websocket
    print("DEBUG: Client connected")
    
    try:
        while True:
            # Receive can be text (JSON) or bytes (Audio)
            message = await websocket.receive()
            # print(f"DEBUG keys: {message.keys()}")
            
            if "bytes" in message and message["bytes"] is not None:
                # Audio Chunk
                pcm_data = message["bytes"]
                if len(pcm_data) > 0:
                    print(f"DEBUG: Received Audio Chunk {len(pcm_data)}")
                
                # Feed to STT
                await asyncio.to_thread(state.stt.feed_pcm, pcm_data)
                
            elif "text" in message:
                print(f"DEBUG: Msg Text: {message['text']}")
                try:
                    data = json.loads(message["text"])
                    command = data.get("command")
                    
                    if command == "set_profile":
                        profile_path = data.get("path")
                        if profile_path and os.path.exists(profile_path):
                            state.audio.set_voice(profile_path)
                            await websocket.send_json({"status": "profile_set", "path": profile_path})
                            
                    elif command == "chat_text":
                        text = data.get("text")
                        if text:
                            await process_text_input(text)
                            
                except json.JSONDecodeError:
                    print("Warning: Invalid JSON received")

    except WebSocketDisconnect:
        print("DEBUG: Client disconnected")
        state.active_socket = None
    except Exception as e:
        print(f"DEBUG: Error: {e}")
        state.active_socket = None

@app.post("/upload_voice")
async def upload_voice(file: UploadFile = File(...)):
    save_dir = "voice_profiles"
    os.makedirs(save_dir, exist_ok=True)
    file_path = os.path.join(save_dir, file.filename)
    
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
        
    return {"filename": file.filename, "path": os.path.abspath(file_path)}

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=3850, reload=True)
