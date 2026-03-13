# subtracker

Track your subscriptions and free trials. Get notified before trials expire.

## Requirements

- **Python 3.9+**
- **Node.js 18+**

---

## Setup

Run once after cloning. Installs all dependencies and registers the login notification agent.

### macOS
```bash
./setup.sh
```

### Linux
```bash
chmod +x setup.sh && ./setup.sh
```

### Windows
```
setup.bat
```

---

## Launch

### macOS
Double-click **SubTracker.command**

### Linux
Double-click **SubTracker.sh**, or run:
```bash
./SubTracker.sh
```

### Windows
Double-click **SubTracker.bat**

The app starts both servers and opens `http://localhost:3000` automatically. Close the terminal window (macOS/Linux) or command window (Windows) to stop everything.

---

## Manual start

```bash
# Terminal 1 — backend
python main.py

# Terminal 2 — frontend
cd frontend && npm run dev
```

Then open `http://localhost:3000`.

---

## Login notifications

After running setup, a background check fires at every login and sends a native notification if any trials are expiring soon.

| Platform | Method |
|----------|--------|
| macOS    | LaunchAgent (`~/Library/LaunchAgents/com.subtracker.notify.plist`) |
| Linux    | cron job (`@reboot`) |
| Windows  | Task Scheduler (`SubTracker Notify`) |

---

## Logs

| Platform | Location |
|----------|----------|
| macOS    | `~/Library/Logs/SubTracker/` |
| Linux    | `~/.local/share/subtracker/logs/` |
| Windows  | `%APPDATA%\SubTracker\logs\` |

---

## Tech stack

- **Backend**: FastAPI + uvicorn (port 8000)
- **Frontend**: React + Vite + Tailwind + Radix UI (port 3000)
- **Storage**: JSON flat file (`subscriptions.json`)
- **Notifications**: Native OS notifications via plyer
