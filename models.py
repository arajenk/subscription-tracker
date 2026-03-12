from dataclasses import dataclass
from datetime import date
from typing import Optional

@dataclass
class Subscription:
    id: int
    name: str
    price: float
    interval_value: int
    interval_unit: str  # "days", "weeks", "months", "years"
    start_date: date
    next_charge_date: date
    is_trial: bool = False
    trial_end_date: Optional[date] = None
    mute_notifs: bool = False
    
