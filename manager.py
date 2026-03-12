from models import Subscription
from dataclasses import asdict
import json
from datetime import date


class SubscriptionManager:
    def __init__(self):
        self.subscriptions = []
    def _save(self):
        data = []
        for s in self.subscriptions:
            d = asdict(s)  # convert to dict first
            d["start_date"] = d["start_date"].isoformat()
            d["next_charge_date"] = d["next_charge_date"].isoformat()
            if d["trial_end_date"] is not None:
                d["trial_end_date"] = d["trial_end_date"].isoformat()
            data.append(d)
        
        with open("subscriptions.json", "w") as f:
            json.dump(data, f)
     
    def add_subscription(self, subscription: Subscription):
        self.subscriptions.append(subscription)
        self._save()
    
    def delete_subscription(self, subscription_id):
        subscription = self.get_subscription_by_id(subscription_id)
        self.subscriptions.remove(subscription)
        self._save()
    
    def update_subscription(self, subscription_id, **kwargs):
        subscription = self.get_subscription_by_id(subscription_id)
        for key, value in kwargs.items():
            setattr(subscription, key, value)
        self._save()


    def get_subscription_by_id(self, subscription_id):
        for subscription in self.subscriptions:
            if subscription.id == subscription_id:
                return subscription
        raise ValueError(f"Subscription with ID {subscription_id} not found")

    def get_all_subscriptions(self):
        return self.subscriptions

    def check_expiring_trials(self):
        expiring_trials = []
        for s in self.subscriptions:
            if not s.is_trial or s.mute_notifs or s.trial_end_date is None:
                continue
            if (s.trial_end_date - date.today()).days <= 3:
                expiring_trials.append(s)
        return expiring_trials

            
    

    def load_subscriptions(self):
        try:
            with open("subscriptions.json", "r") as f:
                data = json.load(f)
                for d in data:
                    d["start_date"] = date.fromisoformat(d["start_date"])
                    d["next_charge_date"] = date.fromisoformat(d["next_charge_date"])
                    if d["trial_end_date"] is not None:
                        d["trial_end_date"] = date.fromisoformat(d["trial_end_date"])
                    self.subscriptions.append(Subscription(**d))
        except FileNotFoundError:
            return []
   

