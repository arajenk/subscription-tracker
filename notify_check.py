from manager import SubscriptionManager
from notify import notify
from config import load_config

m = SubscriptionManager()
m.load_subscriptions()
try:
    notify_days = load_config().get("notify_days", 3)
    expiring = m.check_expiring_trials(notify_days=notify_days)
    if expiring:
        notify(expiring)
except Exception:
    pass
