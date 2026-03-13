#!/bin/bash

PROJECT="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$HOME/Library/Logs/SubTracker"

mkdir -p "$LOG_DIR"

export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:$PATH"

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
    osascript -e 'display dialog "Python 3 not found.\n\nRun setup.sh first." buttons {"OK"} default button "OK" with icon stop with title "subtracker"'
    exit 1
fi

if ! command -v npm &>/dev/null; then
    osascript -e 'display dialog "npm not found.\n\nInstall Node.js from nodejs.org, then run setup.sh again." buttons {"OK"} default button "OK" with icon stop with title "subtracker"'
    exit 1
fi

lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
sleep 0.5

BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
    [ -n "$BACKEND_PID"  ] && kill "$BACKEND_PID"  2>/dev/null || true
    [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null || true
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
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
    osascript -e "display dialog \"Backend failed to start.\n\nCheck logs at:\n$LOG_DIR/backend.log\" buttons {\"OK\"} default button \"OK\" with icon stop with title \"subtracker\""
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

open http://localhost:3000
osascript -e 'display notification "subtracker is running — close this window to stop." with title "subtracker"'

wait
