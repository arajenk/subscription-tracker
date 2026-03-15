# subtracker

Track your subscriptions and free trials. Get notified before trials expire.

Built with FastAPI + React, packaged as a native desktop app via **Tauri**.
Double-click to launch — no browser, no terminal, no localhost visible to the user.

---

## Download

Grab the latest release for your platform from the [Releases](../../releases) page:

| Platform | File |
|----------|------|
| macOS (Apple Silicon) | `.dmg` |
| Windows | `.exe` (NSIS installer) |
| Linux | `.AppImage` |

On macOS, if Gatekeeper blocks the app, right-click → **Open** to bypass it the first time.

---

## Development setup

### Prerequisites

- Python 3.9+
- Node.js 18+
- Rust (stable) — install from [rustup.rs](https://rustup.rs)
- PyInstaller: `pip install pyinstaller`

### 1 — Install dependencies

```bash
# Python backend
pip install -r requirements.txt

# Tauri CLI (root)
npm install

# React frontend
npm --prefix frontend install
```

### 2 — Run in development mode

Terminal 1 — start the FastAPI backend:
```bash
python3 main.py
```

Terminal 2 — start the Tauri dev window:
```bash
npm run tauri:dev
```

Tauri opens a native window pointing at the Vite dev server (`http://localhost:3000`).
API calls go through the Vite proxy to the Python backend on port 8000.
Hot-reload works as usual for both frontend and backend changes.

---

## Building a release

### 1 — Build the Python sidecar

```bash
# macOS / Linux
bash scripts/build-sidecar.sh

# Windows
scripts\build-sidecar.bat
```

This runs PyInstaller and places the resulting binary in `src-tauri/binaries/`.

### 2 — Generate app icons (first time only)

```bash
pip install pillow
npm run generate-icons
```

### 3 — Build the Tauri app

```bash
npm run tauri:build
```

Outputs:

| Platform | Location |
|----------|----------|
| macOS | `src-tauri/target/release/bundle/dmg/` |
| Windows | `src-tauri/target/release/bundle/nsis/` |
| Linux | `src-tauri/target/release/bundle/appimage/` |

---

## GitHub release (CI/CD)

Push a version tag to trigger the release workflow:

```bash
git tag v1.0.0
git push origin v1.0.0
```

The `.github/workflows/release.yml` workflow:
1. Builds the PyInstaller sidecar on each platform (macOS arm64, Windows x86_64, Linux x86_64)
2. Builds the Tauri app bundle
3. Creates a draft GitHub Release with all artefacts attached

---

## How it works

```
┌─────────────────────────────────┐
│  Tauri app (Rust shell)         │
│  ┌───────────────────────────┐  │
│  │  WebView                  │  │
│  │  React UI (bundled)       │  │  ← double-click launches this
│  └─────────────┬─────────────┘  │
│                │ HTTP 127.0.0.1:8000
│  ┌─────────────▼─────────────┐  │
│  │  FastAPI sidecar          │  │
│  │  (bundled Python binary)  │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

- Tauri spawns the FastAPI binary as a **sidecar** process on startup.
- The window stays hidden until the backend is ready (port 8000 responds).
- When the app is closed, Tauri kills the sidecar automatically.

---

## Data storage

User data is stored in a platform-specific directory:

| Platform | Location |
|----------|----------|
| macOS | `~/Library/Application Support/SubTracker/` |
| Windows | `%APPDATA%\SubTracker\` |
| Linux | `~/.local/share/subtracker/` |

Files: `subscriptions.json`, `config.json`

---

## Notifications

Native OS notifications fire when the app is launched if any free trial is expiring soon (within the configured number of days).
Configure the notification window in the app's Settings panel.

---

## Tech stack

- **Backend**: FastAPI + uvicorn, bundled with PyInstaller
- **Frontend**: React + Vite + Tailwind CSS + Radix UI
- **Desktop shell**: Tauri 2 (Rust)
- **Storage**: JSON flat files in user data directory
- **Notifications**: plyer (native OS notifications)

---

## Contributing

Found a bug or want to improve platform support?
Open an issue or submit a pull request — contributions are welcome.
