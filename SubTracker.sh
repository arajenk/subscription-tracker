#!/bin/bash

PROJECT="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$HOME/.local/share/subtracker/logs"

mkdir -p "$LOG_DIR"

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"

export PYENV_ROOT="$HOME/.pyenv"
[ -d "$PYENV_ROOT/shims" ] && export PATH="$PYENV_ROOT/shims:$PYENV_ROOT/bin:$PATH"

if [ -f "$PROJECT/.venv/bin/python3" ]; then
    PYTHON="$PROJECT/.venv/bin/python3"
elif [ -f "$PROJECT/venv/bin/python3" ]; then
    PYTHON="$PROJECT/venv/bin/python3"
elif command -v python3 &>/dev/null; then
    PYTHON="python3"
else
    echo "Error: Python 3 not found. Run setup.sh first." >&2
    exit 1
fi

if ! command -v npm &>/dev/null; then
    echo "Error: npm not found. Install Node.js from nodejs.org." >&2
    exit 1
fi

fuser -k 8000/tcp 2>/dev/null || true
fuser -k 3000/tcp 2>/dev/null || true
sleep 0.5

BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
    [ -n "$BACKEND_PID"  ] && kill "$BACKEND_PID"  2>/dev/null || true
    [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null || true
    fuser -k 8000/tcp 2>/dev/null || true
    fuser -k 3000/tcp 2>/dev/null || true
}
trap cleanup EXIT

cd "$PROJECT"
"$PYTHON" main.py > "$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!

cd "$PROJECT/frontend"
npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!

sleep 2

if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo "Backend failed to start. Check logs at: $LOG_DIR/backend.log" >&2
    exit 1
fi

for i in $(seq 1 30); do
    curl -sf http://localhost:8000/subscriptions &>/dev/null && break
    sleep 1
done

for i in $(seq 1 30); do
    curl -sf http://localhost:3000 &>/dev/null && break
    sleep 1
done

xdg-open http://localhost:3000 2>/dev/null || open http://localhost:3000 2>/dev/null || true
echo "subtracker is running — close this window to stop."

wait
