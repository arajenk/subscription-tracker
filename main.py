import sys
import uvicorn

if __name__ == "__main__":
    # Disable reload when running as a frozen PyInstaller sidecar
    reload = not getattr(sys, "frozen", False)
    uvicorn.run("api:app", host="127.0.0.1", port=8000, reload=reload)
