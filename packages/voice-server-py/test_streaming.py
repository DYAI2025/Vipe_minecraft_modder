import asyncio
import websockets
import json
import logging
import os
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AudioTest")

async def test_audio_streaming():
    uri = "ws://127.0.0.1:3850/ws/control"
    pcm_file = "test_pcm.raw"
    
    if not os.path.exists(pcm_file):
        logger.error(f"File {pcm_file} not found. Run ffmpeg/espeak gen first.")
        return

    logger.info(f"Connecting to {uri}...")
    
    async with websockets.connect(uri) as websocket:
        logger.info("✅ Connected! sending audio...")
        
        # Read raw PCM
        with open(pcm_file, "rb") as f:
            audio_data = f.read()
            
        # Send in chunks (Loop 5 times to simulate 5s speech)
        chunk_size = 4096 * 2 # 4096 samples * 2 bytes
        for _ in range(5): 
            for i in range(0, len(audio_data), chunk_size):
                chunk = audio_data[i:i+chunk_size]
                await websocket.send(chunk) # Send bytes
                await asyncio.sleep(0.01) # Simulate realtime
            
        # Send silence to flush VAD?
        silence = b'\x00' * 32000 # 1 sec silence
        await websocket.send(silence)
            
        logger.info("Audio sent. Waiting for response...")
        
        start_time = time.time()
        transcription_received = False
        
        while time.time() - start_time < 30: # 30s timeout
            try:
                msg = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                
                if isinstance(msg, bytes):
                    logger.info(f"🔊 Received Audio Chunk: {len(msg)} bytes")
                else:
                    data = json.loads(msg)
                    logger.info(f"📩 Received: {data}")
                    
                    if data.get("type") == "transcription":
                        logger.info(f"✅ STT Success: '{data.get('text')}'")
                        transcription_received = True

                    if data.get("status") == "done":
                        logger.info("✅ Pipeline finished.")
                        break
                        
            except asyncio.TimeoutError:
                logger.warning("Timeout waiting for response")
                break
                
        if not transcription_received:
            logger.error("❌ No transcription received!")
        else:
            logger.info("✅ TEST PASSED!")

if __name__ == "__main__":
    asyncio.run(test_audio_streaming())
