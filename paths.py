"""Platform-specific user data directory for SubTracker."""
import os
import sys
from pathlib import Path


def get_data_dir() -> Path:
    """Return persistent user data directory, creating it if needed.

    - Frozen (PyInstaller sidecar): platform-standard location
    - Development: directory of this file (backward-compatible)
    """
    if getattr(sys, "frozen", False):
        if sys.platform == "darwin":
            data_dir = Path.home() / "Library" / "Application Support" / "SubTracker"
        elif sys.platform == "win32":
            data_dir = Path(os.environ.get("APPDATA", Path.home())) / "SubTracker"
        else:
            xdg = os.environ.get("XDG_DATA_HOME", "")
            data_dir = Path(xdg) / "subtracker" if xdg else Path.home() / ".local" / "share" / "subtracker"
    else:
        data_dir = Path(__file__).parent

    data_dir.mkdir(parents=True, exist_ok=True)
    return data_dir
