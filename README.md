# subtracker

Track your subscriptions and free trials. Get notified before trials expire.

## First-time setup

Requires **Python 3** and **Node.js**.

```bash
./setup.sh
```

This creates a Python virtualenv, installs all dependencies, and configures the launcher.

## Launch

Double-click **SubTracker.command**.

The app starts the backend and frontend servers, then opens `localhost:3000` in your browser. Close the terminal window to stop everything.

## Manual start (alternative)

```bash
# Terminal 1
python main.py

# Terminal 2
cd frontend && npm run dev
```

Then open `http://localhost:3000`.

## Logs

If something goes wrong, logs are at:

```
~/Library/Logs/SubTracker/backend.log
~/Library/Logs/SubTracker/frontend.log
```

## Tech stack

- **Backend**: FastAPI + uvicorn (port 8000)
- **Frontend**: React + Vite + Tailwind + Radix UI (port 3000)
- **Storage**: JSON flat file (`subscriptions.json`)
- **Notifications**: Native macOS notifications via plyer
