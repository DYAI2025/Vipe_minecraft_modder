#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔨 KidModStudio Development Launcher 🔨${NC}"

# 1. Start Voice Server (Python) in Background
echo -e "${GREEN}🎤 Starting Voice Intelligence Server (Port 3850)...${NC}"
cd packages/voice-server-py || exit
# Ensure logs dir exists
mkdir -p logs
./start.sh > logs/server.log 2>&1 &
VOICE_PID=$!
echo "   PID: $VOICE_PID (Logs: packages/voice-server-py/logs/server.log)"

# Wait for server to be ready (dumb wait)
echo "   Waiting 5s for server startup..."
sleep 5

# Optional: Run Integration Test
# echo "   Running Integration Check..."
# python3 test_integration.py

# 2. Start Electron App
echo -e "${GREEN}🖥️  Starting Electron Studio...${NC}"
cd ../../apps/studio-electron || exit
npm run dev &
ELECTRON_PID=$!

# Trap Ctrl+C to kill both
cleanup() {
    echo -e "${RED}🛑 Shutting down...${NC}"
    kill $VOICE_PID
    kill $ELECTRON_PID
    exit
}
trap cleanup SIGINT

# Keep script running to maintain processes
wait
