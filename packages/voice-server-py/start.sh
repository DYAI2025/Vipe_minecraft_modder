#!/bin/bash
echo "🎤 Starting Crafty Intelligence Center..."

# Check prerequisites
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 could not be found"
    exit 1
fi

if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama could not be found"
    exit 1
fi

# Activate venv if exists or create
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install PyTorch specifically first (robustness)
echo "Installing PyTorch (CUDA 12.1)..."
pip install torch torchaudio torchvision --index-url https://download.pytorch.org/whl/cu121

# Install other dependencies
echo "Installing other dependencies..."
pip install -r requirements.txt

# Pull Qwen model
echo "Checking LLM Model..."
ollama pull qwen2.5:7b

# Run Server
echo "🚀 Launching Voice Server on Port 3850"
python3 src/main.py
