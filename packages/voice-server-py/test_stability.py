import asyncio
import websockets
import json
import logging
import time

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("StabilityTest")

URI = "ws://127.0.0.1:3850/ws/control"

async def single_session(i):
    logger.info(f"[{i}] Connecting...")
    try:
        async with websockets.connect(URI, open_timeout=2) as ws:
            logger.info(f"[{i}] OPEN! Sending handshake...")
            # Simulate initial ping/data
            await ws.send(json.dumps({"command": "ping"}))
            
            # Simulate Audio Burst
            # logger.info(f"[{i}] Sending audio burst...")
            # silence = b'\x00' * 4096
            # for _ in range(5):
            #    await ws.send(silence)
            #    await asyncio.sleep(0.01)
            
            logger.info(f"[{i}] Closing...")
            
    except Exception as e:
        logger.error(f"[{i}] FAILED: {e}")
        return False
    return True

async def stress_test():
    logger.info("Waiting for Server to boot...")
    for _ in range(30):
        try:
            async with websockets.connect(URI) as ws:
                logger.info("Server is UP!")
                break
        except:
            await asyncio.sleep(1)
            print(".", end="", flush=True)
    
    logger.info("Starting Stress Test (Rapid Connect/Disconnect)...")
    success_count = 0
    total_runs = 5
    
    for i in range(total_runs):
        if await single_session(i):
            success_count += 1
        await asyncio.sleep(0.5) # Electron reconnect delay simulation
        
    if success_count == total_runs:
        logger.info("✅ STABILITY TEST PASSED!")
    else:
        logger.error(f"❌ Stability Test FAILED ({success_count}/{total_runs})")
        exit(1)

if __name__ == "__main__":
    asyncio.run(stress_test())
