from models import Subscription
from manager import SubscriptionManager
from datetime import date
from notify import notify

def main():
    manager = SubscriptionManager()

    sub1 = Subscription(
    id=1,
    name="Netflix",
    price=15.99,
    interval_value=1,
    interval_unit="months",
    start_date=date(2025, 1, 1),
    next_charge_date=date(2026, 4, 1),
    is_trial=False,
    mute_notifs=False
    )

    sub2 = Subscription(
        id=2,
        name="Spotify",
        price=9.99,
        interval_value=1,
        interval_unit="months",
        start_date=date(2025, 1, 1),
        next_charge_date=date(2026, 4, 1),
        is_trial=True,
        mute_notifs=False,
        trial_end_date=date(2026, 3, 14)  # 2 days from now
    )
    manager.add_subscription(sub1)
    manager.add_subscription(sub2)
    manager2 = SubscriptionManager()
    manager2.load_subscriptions()
    
    notify(manager2.check_expiring_trials())
    
    
    

    

if __name__ == "__main__":
    main()


        

