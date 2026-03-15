import sys
import uvicorn

if __name__ == "__main__":
    if getattr(sys, "frozen", False):
        # Running as a PyInstaller frozen binary.
        # Import the app object directly so that:
        #   1. PyInstaller statically follows the import chain and bundles api.py
        #      and all its dependencies (manager, config, models, paths, notify*).
        #   2. uvicorn receives the live app object — it cannot resolve the
        #      "api:app" import string inside a frozen executable.
        from api import app as _app  # noqa: E402
        uvicorn.run(_app, host="127.0.0.1", port=8000, reload=False)
    else:
        uvicorn.run("api:app", host="127.0.0.1", port=8000, reload=True)
