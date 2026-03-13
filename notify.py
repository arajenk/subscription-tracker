from plyer import notification
from models import Subscription
from datetime import date

def notify(expiring_trials):
    for trial in expiring_trials:
        notification.notify(
            title="Trial Expiring!",
            message=f"Your {trial.name} trial expires in {(trial.trial_end_date - date.today()).days} days",
            timeout=10
        )

