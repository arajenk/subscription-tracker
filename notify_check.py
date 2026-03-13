from manager import SubscriptionManager
from notify import notify

m = SubscriptionManager()
m.load_subscriptions()
try:
    expiring = m.check_expiring_trials()
    if expiring:
        notify(expiring)
except Exception:
    pass
