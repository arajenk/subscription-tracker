from contextlib import asynccontextmanager
from typing import Optional, Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator, model_validator
from datetime import date

from manager import SubscriptionManager, _advance_date
from models import Subscription
from config import load_config, save_config
from notify import notify


manager = SubscriptionManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    manager.load_subscriptions()
    manager.advance_expired_charges()
    try:
        config = load_config()
        notify_days = config.get("notify_days", 3)
        expiring = manager.check_expiring_trials(notify_days=notify_days)
        if expiring:
            notify(expiring)
    except Exception:
        pass
    yield


app = FastAPI(title="Subscription Tracker API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",   # Vite dev server
        "tauri://localhost",       # Tauri webview (macOS / Linux)
        "https://tauri.localhost", # Tauri webview (Windows)
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def sub_to_dict(s: Subscription) -> dict:
    return {
        "id": s.id,
        "name": s.name,
        "price": s.price,
        "interval_value": s.interval_value,
        "interval_unit": s.interval_unit,
        "start_date": s.start_date.isoformat(),
        "next_charge_date": s.next_charge_date.isoformat(),
        "is_trial": s.is_trial,
        "trial_end_date": s.trial_end_date.isoformat() if s.trial_end_date else None,
        "mute_notifs": s.mute_notifs,
    }


class SubscriptionBody(BaseModel):
    name: str
    price: float
    interval_value: int
    interval_unit: Literal["days", "weeks", "months", "years"]
    start_date: date
    next_charge_date: Optional[date] = None
    is_trial: bool = False
    trial_end_date: Optional[date] = None
    mute_notifs: bool = False

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()

    @field_validator("price")
    @classmethod
    def price_non_negative(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Price must be non-negative")
        return v

    @field_validator("interval_value")
    @classmethod
    def interval_value_positive(cls, v: int) -> int:
        if v < 1:
            raise ValueError("Interval value must be at least 1")
        return v

    @model_validator(mode="after")
    def compute_next_charge_date(self) -> "SubscriptionBody":
        """If next_charge_date is omitted, derive it from start_date + interval."""
        if self.next_charge_date is None:
            self.next_charge_date = _advance_date(
                self.start_date, self.interval_value, self.interval_unit
            )
        return self


class ConfigBody(BaseModel):
    notify_days: int

    @field_validator("notify_days")
    @classmethod
    def notify_days_positive(cls, v: int) -> int:
        if v < 1:
            raise ValueError("notify_days must be at least 1")
        return v


# ── Subscriptions ─────────────────────────────────────────────────────────────

@app.get("/subscriptions")
def get_subscriptions():
    manager.advance_expired_charges()
    return [sub_to_dict(s) for s in manager.get_all_subscriptions()]


@app.post("/subscriptions", status_code=201)
def add_subscription(body: SubscriptionBody):
    existing = manager.get_all_subscriptions()
    new_id = max((s.id for s in existing), default=0) + 1
    sub = Subscription(id=new_id, **body.model_dump())
    manager.add_subscription(sub)
    manager.advance_expired_charges()
    return sub_to_dict(manager.get_subscription_by_id(new_id))


@app.put("/subscriptions/{subscription_id}")
def update_subscription(subscription_id: int, body: SubscriptionBody):
    try:
        manager.update_subscription(subscription_id, **body.model_dump())
        manager.advance_expired_charges()
        return sub_to_dict(manager.get_subscription_by_id(subscription_id))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.delete("/subscriptions/{subscription_id}", status_code=204)
def delete_subscription(subscription_id: int):
    try:
        manager.delete_subscription(subscription_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.patch("/subscriptions/{subscription_id}/mute")
def toggle_mute(subscription_id: int):
    try:
        sub = manager.get_subscription_by_id(subscription_id)
        new_mute = not sub.mute_notifs
        manager.update_subscription(subscription_id, mute_notifs=new_mute)
        result = sub_to_dict(sub)
        result['mute_notifs'] = new_mute
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ── Dashboard ─────────────────────────────────────────────────────────────────

@app.get("/dashboard")
def get_dashboard():
    manager.advance_expired_charges()
    config = load_config()
    notify_days = config.get("notify_days", 3)
    data = manager.get_dashboard_data(notify_days=notify_days)
    return {
        "monthly_total": data["monthly_total"],
        "yearly_total": data["yearly_total"],
        "active_count": data["active_count"],
        "trial_count": data["trial_count"],
        "expiring_soon": [sub_to_dict(s) for s in data["expiring_soon"]],
        "upcoming_charges": [sub_to_dict(s) for s in data["upcoming_charges"]],
    }


# ── Config ────────────────────────────────────────────────────────────────────

@app.get("/config")
def get_config():
    return load_config()


@app.put("/config")
def update_config(body: ConfigBody):
    config = body.model_dump()
    save_config(config)
    return config
