import json

DEFAULT_CONFIG = {"notify_days": 3}

def load_config():
    try:
        with open("config.json", "r") as f:
            config = json.load(f)
            return config
    except FileNotFoundError:
            return DEFAULT_CONFIG
    
def save_config(config):
     with open("config.json", "w") as f:
            json.dump(config, f)