#!/usr/bin/env bash
# Build the Python sidecar binary and copy it to src-tauri/binaries/
# Usage: bash scripts/build-sidecar.sh
set -euo pipefail

TRIPLE=$(rustc -vV | sed -n 's|host: ||p')
echo "▸ Building sidecar for $TRIPLE"

python3 -m PyInstaller subtracker-backend.spec --clean --noconfirm

mkdir -p src-tauri/binaries
DEST="src-tauri/binaries/subtracker-backend-${TRIPLE}"
cp dist/subtracker-backend "$DEST"
chmod +x "$DEST"

echo "✓ Sidecar ready: $DEST"
