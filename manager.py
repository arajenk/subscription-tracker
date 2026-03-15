from models import Subscription
from dataclasses import asdict
import json
from datetime import date, timedelta
from pathlib import Path

from paths import get_data_dir

_DATA_FILE = get_data_dir() / "subscriptions.json"


def _advance_date(dt: date, interval_value: int, interval_unit: str) -> date:
    """Advance a date by one billing interval."""
    if interval_unit == "days":
        return dt + timedelta(days=interval_value)
    elif interval_unit == "weeks":
        return dt + timedelta(weeks=interval_value)
    elif interval_unit == "months":
        month = dt.month - 1 + interval_value
        year = dt.year + month // 12
        month = month % 12 + 1
        day = min(dt.day, [31, 29 if year % 4 == 0 and (year % 100 != 0 or year % 400 == 0) else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1])
        return date(year, month, day)
    elif interval_unit == "years":
        try:
            return dt.replace(year=dt.year + interval_value)
        except ValueError:
            return dt.replace(year=dt.year + interval_value, day=28)
    return dt


class SubscriptionManager:
    def __init__(self):
        self.subscriptions = []

    def _save(self):
        data = []
        for s in self.subscriptions:
            d = asdict(s)
            d["start_date"] = d["start_date"].isoformat()
            d["next_charge_date"] = d["next_charge_date"].isoformat()
            if d["trial_end_date"] is not None:
                d["trial_end_date"] = d["trial_end_date"].isoformat()
            data.append(d)
        _DATA_FILE.write_text(json.dumps(data))

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

    def _to_monthly(self, s: Subscription) -> float:
        """Normalise a subscription's price to a monthly equivalent."""
        v = s.interval_value or 1
        if s.interval_unit == "days":
            return (s.price / v) * 30.44
        elif s.interval_unit == "weeks":
            return (s.price / v) * (30.44 / 7)
        elif s.interval_unit == "months":
            return s.price / v
        elif s.interval_unit == "years":
            return s.price / v / 12
        return s.price

    def advance_expired_charges(self) -> bool:
        """Advance next_charge_date for non-trial subscriptions that are in the past.
        Returns True if any subscriptions were updated."""
        today = date.today()
        changed = False
        for s in self.subscriptions:
            if s.is_trial:
                continue
            while s.next_charge_date < today:
                s.next_charge_date = _advance_date(
                    s.next_charge_date, s.interval_value, s.interval_unit
                )
                changed = True
        if changed:
            self._save()
        return changed

    def check_expiring_trials(self, notify_days: int = 3) -> list:
        """Return trials expiring within notify_days days (respects mute_notifs)."""
        today = date.today()
        expiring = []
        for s in self.subscriptions:
            if not s.is_trial or s.mute_notifs or s.trial_end_date is None:
                continue
            days = (s.trial_end_date - today).days
            if 0 <= days <= notify_days:
                expiring.append(s)
        return expiring

    def get_dashboard_data(self, notify_days: int = 3, upcoming_days: int = 7) -> dict:
        """Compute all dashboard stats server-side."""
        today = date.today()

        expiring_soon = []
        for s in self.subscriptions:
            if not s.is_trial or s.trial_end_date is None:
                continue
            days = (s.trial_end_date - today).days
            if 0 <= days <= notify_days:
                expiring_soon.append(s)

        expiring_ids = {s.id for s in expiring_soon}

        upcoming_charges = []
        for s in self.subscriptions:
            if s.id in expiring_ids:
                continue
            days = (s.next_charge_date - today).days
            if 0 <= days <= upcoming_days:
                upcoming_charges.append(s)

        monthly_total = sum(self._to_monthly(s) for s in self.subscriptions)

        return {
            "monthly_total": round(monthly_total, 2),
            "yearly_total": round(monthly_total * 12, 2),
            "active_count": sum(1 for s in self.subscriptions if not s.is_trial),
            "trial_count": sum(1 for s in self.subscriptions if s.is_trial),
            "expiring_soon": expiring_soon,
            "upcoming_charges": upcoming_charges,
        }

    def load_subscriptions(self):
        try:
            data = json.loads(_DATA_FILE.read_text())
            for d in data:
                d["start_date"] = date.fromisoformat(d["start_date"])
                d["next_charge_date"] = date.fromisoformat(d["next_charge_date"])
                if d["trial_end_date"] is not None:
                    d["trial_end_date"] = date.fromisoformat(d["trial_end_date"])
                self.subscriptions.append(Subscription(**d))
        except FileNotFoundError:
            pass
