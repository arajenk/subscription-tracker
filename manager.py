from models import Subscription

class SubscriptionManager:
    def __init__(self):
        self.subscriptions = []
    def _save(self):
        pass
     
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
        pass

    def load_subscriptions(self):
        pass

   

