import os
import logging
import asyncio
import json
import uuid
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, WebSocket, UploadFile, File, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

# Generated schemas
from schemas_generated import (
    AnyEvent, VoiceChunkEvent, VoiceChunkPayload,
    SttFinalEvent, SttFinalPayload,
    ChatQueryEvent, ErrorRaisedEvent, ErrorRaisedPayload,
    VoiceStartEvent, VoiceStartPayload,
    SttPartialEvent, SttPartialPayload,
    LlmTextEvent, LlmTextPayload
)

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
        self.active_socket: Optional[WebSocket] = None
        self.source_id = "voice-server-py"

    def make_envelope(self, event_type: str, payload: any, severity: str = "info"):
        return {
            "type": event_type,
            "traceId": str(uuid.uuid4()),
            "ts": datetime.utcnow().isoformat() + "Z",
            "source": self.source_id,
            "severity": severity,
            "payload": payload
        }

state = VoiceServerState()
loop = asyncio.new_event_loop()

# Callback for STT -> LLM -> TTS pipeline
def on_stt_transcription(text: str):
    logger.info(f"🎤 STT Detected: {text}")
    if not text.strip():
        return
        
    if state.active_socket:
        # Dispatch STT_FINAL event
        event = state.make_envelope("stt.final", {"text": text, "confidence": 1.0, "final": True})
        asyncio.run_coroutine_threadsafe(state.active_socket.send_json(event), loop)
        
        # Trigger LLM Pipeline
        asyncio.run_coroutine_threadsafe(process_text_input(text), loop)

async def process_text_input(text: str):
    logger.info(f"🤖 Processing: {text}")
    
    # 1. Dispatch Pipeline Status (Start)
    if state.active_socket:
        await state.active_socket.send_json(state.make_envelope("pipeline.status", {
            "pipelineId": "voice_chat",
            "step": "llm",
            "state": "start"
        }))

    # 2. LLM Stream
    stream = state.llm.chat_stream(text)
    
    # 3. TTS Stream (Blocking in thread)
    # We could dispatch llm.text events here if the stream was async
    await asyncio.to_thread(state.audio.speak_stream, stream)
    
    # 4. Dispatch Pipeline Status (Done)
    if state.active_socket:
        await state.active_socket.send_json(state.make_envelope("pipeline.status", {
            "pipelineId": "voice_chat",
            "step": "tts",
            "state": "done"
        }))

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🎤 Voice Server starting...")
    asyncio.set_event_loop(loop)
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
    logger.info("Client connected to Jarvis Protocol")
    
    try:
        while True:
            message = await websocket.receive()
            
            # 1. Handle Binary Audio (voice.chunk)
            if "bytes" in message and message["bytes"] is not None:
                pcm_data = message["bytes"]
                # Forward to STT
                await asyncio.to_thread(state.stt.feed_pcm, pcm_data)
                
            # 2. Handle Structured Events (Jarvis Protocol)
            elif "text" in message:
                try:
                    raw_data = json.loads(message["text"])
                    # Validate against AnyEvent union
                    event = AnyEvent.model_validate(raw_data)
                    
                    if event.type == "chat.query":
                        await process_text_input(event.payload.text)
                    
                    elif event.type == "ui.command":
                        if event.payload.command == "set_profile":
                            path = event.payload.args.get("path")
                            if path and os.path.exists(path):
                                state.audio.set_voice(path)
                                await websocket.send_json(state.make_envelope("ui.feedback", {
                                    "target": "voice_profile",
                                    "helpful": True,
                                    "note": f"Profile set to {path}"
                                }))

                except Exception as e:
                    logger.warning(f"Event validation failed: {e}")
                    await websocket.send_json(state.make_envelope("error.raised", {
                        "code": "E_PROTOCOL",
                        "message": str(e),
                        "recoverable": True
                    }, severity="warn"))

    except WebSocketDisconnect:
        logger.info("Client disconnected")
        state.active_socket = None
    except Exception as e:
        logger.error(f"Unexpected error in websocket: {e}")
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
    uvicorn.run("main:app", host="127.0.0.1", port=3850, reload=False)
