#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "Setting up SubTracker..."

# Python virtual environment
if [ ! -d ".venv" ]; then
    echo "→ Creating Python virtual environment..."
    python3 -m venv .venv
fi

echo "→ Installing Python dependencies..."
.venv/bin/pip install -q --upgrade pip
.venv/bin/pip install -q -r requirements.txt

# Node dependencies
echo "→ Installing Node dependencies..."
cd frontend
npm install --silent
cd ..

# Fix launcher permissions and remove macOS quarantine flag
echo "→ Configuring launcher..."
chmod +x SubTracker.command
xattr -cr SubTracker.command 2>/dev/null || true

echo ""
echo "Done. Double-click SubTracker.command to launch."
