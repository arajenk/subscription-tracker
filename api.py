from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import date

from manager import SubscriptionManager
from models import Subscription
from config import load_config, save_config


manager = SubscriptionManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    manager.load_subscriptions()
    yield


app = FastAPI(title="Subscription Tracker API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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
    interval_unit: str
    start_date: date
    next_charge_date: date
    is_trial: bool = False
    trial_end_date: Optional[date] = None
    mute_notifs: bool = False


class ConfigBody(BaseModel):
    notify_days: int


@app.get("/subscriptions")
def get_subscriptions():
    return [sub_to_dict(s) for s in manager.get_all_subscriptions()]


@app.post("/subscriptions", status_code=201)
def add_subscription(body: SubscriptionBody):
    existing = manager.get_all_subscriptions()
    new_id = max((s.id for s in existing), default=0) + 1
    sub = Subscription(id=new_id, **body.model_dump())
    manager.add_subscription(sub)
    return sub_to_dict(sub)


@app.put("/subscriptions/{subscription_id}")
def update_subscription(subscription_id: int, body: SubscriptionBody):
    try:
        manager.update_subscription(subscription_id, **body.model_dump())
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


@app.get("/config")
def get_config():
    return load_config()


@app.put("/config")
def update_config(body: ConfigBody):
    config = body.model_dump()
    save_config(config)
    return config
