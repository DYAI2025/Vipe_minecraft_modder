import asyncio
import websockets
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("IntegrationTest")

async def test_voice_server():
    uri = "ws://127.0.0.1:3850/ws/control"
    logger.info(f"Connecting to {uri}...")
    
    try:
        async with websockets.connect(uri) as websocket:
            logger.info("✅ Connected!")
            
            # Test 1: Simple Chat
            msg = {
                "command": "chat_text",
                "text": "Hello Crafty, are you online?"
            }
            logger.info(f"Sending: {msg}")
            await websocket.send(json.dumps(msg))
            
            # Wait for response (expecting multiple chunks or completion)
            # In our current impl, we might get audio binary or json status
            # For chat_text command, main.py sends {"status": "speaking_done"} at the end
            # It might stream audio first? Currently main.py calls speak_stream blocking.
            
            response = await websocket.recv()
            logger.info(f"Received: {response}")
            
            try:
                data = json.loads(response)
                if data.get("status") == "speaking_done":
                    logger.info("✅ Chat flow successful (Text processed)")
                else:
                    logger.warning(f"Unexpected JSON: {data}")
            except:
                logger.info("Received binary audio data (Good!)")

    except Exception as e:
        logger.error(f"❌ Connection failed: {e}")
        exit(1)

if __name__ == "__main__":
    asyncio.run(test_voice_server())
