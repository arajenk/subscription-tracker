from manager import SubscriptionManager
from notify import notify
import uvicorn

if __name__ == "__main__":
    m = SubscriptionManager()
    m.load_subscriptions()
    try:
        expiring = m.check_expiring_trials()
        if expiring:
            notify(expiring)
    except Exception:
        pass
    uvicorn.run("api:app", host="127.0.0.1", port=8000, reload=False)
