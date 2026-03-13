#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

OS="$(uname -s)"
echo "Setting up subtracker..."

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

PYTHON="$SCRIPT_DIR/.venv/bin/python3"

if [ "$OS" = "Darwin" ]; then
    # macOS: configure launcher and install LaunchAgent for login notifications
    chmod +x SubTracker.command
    xattr -cr SubTracker.command 2>/dev/null || true

    PLIST="$HOME/Library/LaunchAgents/com.subtracker.notify.plist"
    mkdir -p "$HOME/Library/Logs/SubTracker"
    cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.subtracker.notify</string>
    <key>ProgramArguments</key>
    <array>
        <string>$PYTHON</string>
        <string>$SCRIPT_DIR/notify_check.py</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$HOME/Library/Logs/SubTracker/notify.log</string>
    <key>StandardErrorPath</key>
    <string>$HOME/Library/Logs/SubTracker/notify.log</string>
</dict>
</plist>
EOF
    launchctl unload "$PLIST" 2>/dev/null || true
    launchctl load "$PLIST"
    echo "→ Login notification agent installed."
    echo ""
    echo "Done. Double-click SubTracker.command to launch."
else
    # Linux: configure launcher and add cron job for login notifications
    chmod +x SubTracker.sh

    CRON_CMD="@reboot cd \"$SCRIPT_DIR\" && \"$PYTHON\" \"$SCRIPT_DIR/notify_check.py\""
    ( crontab -l 2>/dev/null | grep -v "notify_check.py"; echo "$CRON_CMD" ) | crontab -
    echo "→ Login notification cron job installed."
    echo ""
    echo "Done. Run ./SubTracker.sh to launch."
fi
