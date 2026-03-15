import json
from pathlib import Path

from paths import get_data_dir

_CONFIG_FILE = get_data_dir() / "config.json"
DEFAULT_CONFIG = {"notify_days": 3}

def load_config():
    try:
        return json.loads(_CONFIG_FILE.read_text())
    except FileNotFoundError:
        return DEFAULT_CONFIG

def save_config(config):
    _CONFIG_FILE.write_text(json.dumps(config))
