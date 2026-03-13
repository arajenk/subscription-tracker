import json
from pathlib import Path

_CONFIG_FILE = Path(__file__).parent / "config.json"
DEFAULT_CONFIG = {"notify_days": 3}

def load_config():
    try:
        return json.loads(_CONFIG_FILE.read_text())
    except FileNotFoundError:
        return DEFAULT_CONFIG

def save_config(config):
    _CONFIG_FILE.write_text(json.dumps(config))
