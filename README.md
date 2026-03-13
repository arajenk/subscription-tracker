# SubTracker

Track your subscriptions and free trials. Get notified before trials expire.

## First-time setup

Requires **Python 3** and **Node.js**.

```bash
./setup.sh
```

This creates a Python virtualenv, installs all dependencies, and configures the launcher.

## Launch

Double-click **SubTracker.app**.

The app starts the backend and frontend servers, then opens `localhost:3000` in your browser automatically. To stop everything, quit SubTracker from the Dock.

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
- **Frontend**: React + Vite + Tailwind + shadcn/ui (port 3000)
- **Storage**: JSON flat file (`subscriptions.json`)
- **Notifications**: Native OS notifications via plyer
