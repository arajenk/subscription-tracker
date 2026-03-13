import customtkinter as ctk
import tkinter.messagebox as messagebox
from manager import SubscriptionManager
from models import Subscription
from config import load_config, save_config
from notify import notify
from datetime import date

# ── Theme ────────────────────────────────────────────────────────
ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")

# Design tokens — change these to retheme the whole app
BG           = "#0a0a0a"
SURFACE      = "#111111"
SURFACE_2    = "#1a1a1a"
BORDER       = "#222222"
TEXT         = "#ededed"
TEXT_MUTED   = "#666666"
TEXT_DIM     = "#444444"
ACCENT       = "#ffffff"
ACCENT_DIM   = "#333333"
RED          = "#ef4444"
RED_DARK     = "#7f1d1d"
ORANGE       = "#f97316"
GREEN        = "#22c55e"
BLUE         = "#3b82f6"
FONT_MONO    = ("SF Mono", "Menlo", "Consolas", "monospace")


def mono(size=12, weight="normal"):
    return ctk.CTkFont(family="Menlo", size=size, weight=weight)

def sans(size=13, weight="normal"):
    return ctk.CTkFont(family="SF Pro Display", size=size, weight=weight)


class SubTrackerApp(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.title("SubTracker")
        self.geometry("980x620")
        self.resizable(False, False)
        self.configure(fg_color=BG)

        self.manager = SubscriptionManager()
        self.manager.load_subscriptions()
        self.config = load_config()

        self._setup_ui()
        self._check_and_notify()

    def _check_and_notify(self):
        expiring = self.manager.check_expiring_trials()
        if expiring:
            notify(expiring)

    def _setup_ui(self):
        # ── Sidebar ──────────────────────────────────────────────
        sidebar = ctk.CTkFrame(self, width=220, fg_color=SURFACE, corner_radius=0)
        sidebar.pack(side="left", fill="y")
        sidebar.pack_propagate(False)

        # Logo
        logo_frame = ctk.CTkFrame(sidebar, fg_color="transparent")
        logo_frame.pack(fill="x", padx=20, pady=(28, 0))
        ctk.CTkLabel(logo_frame, text="sub", font=sans(20, "bold"),
                     text_color=ACCENT).pack(side="left")
        ctk.CTkLabel(logo_frame, text="tracker", font=sans(20),
                     text_color=TEXT_MUTED).pack(side="left")

        # Divider
        ctk.CTkFrame(sidebar, height=1, fg_color=BORDER).pack(
            fill="x", padx=20, pady=20)

        # Nav items
        ctk.CTkButton(
            sidebar, text="Subscriptions", anchor="w", fg_color=SURFACE_2,
            hover_color=SURFACE_2, text_color=TEXT,
            font=sans(13), height=36, corner_radius=6,
            border_width=0
        ).pack(fill="x", padx=12, pady=2)

        # Spacer
        ctk.CTkFrame(sidebar, fg_color="transparent").pack(fill="both", expand=True)

        # Settings at bottom
        ctk.CTkFrame(sidebar, height=1, fg_color=BORDER).pack(fill="x", padx=20, pady=8)
        ctk.CTkButton(
            sidebar, text="⚙  Settings", anchor="w",
            fg_color="transparent", hover_color=SURFACE_2,
            text_color=TEXT_MUTED, font=sans(13), height=36,
            corner_radius=6, command=self.open_settings
        ).pack(fill="x", padx=12, pady=(0, 16))

        # ── Main content ─────────────────────────────────────────
        main = ctk.CTkFrame(self, fg_color=BG, corner_radius=0)
        main.pack(side="left", fill="both", expand=True)

        # Top bar
        topbar = ctk.CTkFrame(main, fg_color="transparent")
        topbar.pack(fill="x", padx=28, pady=(28, 0))

        ctk.CTkLabel(topbar, text="Subscriptions",
                     font=sans(22, "bold"), text_color=TEXT).pack(side="left")

        ctk.CTkButton(
            topbar, text="+ New", width=80, height=32,
            fg_color=ACCENT, hover_color="#cccccc",
            text_color="#000000", font=sans(13, "bold"),
            corner_radius=6, command=self.open_add_dialog
        ).pack(side="right")

        # Stats row
        stats_row = ctk.CTkFrame(main, fg_color="transparent")
        stats_row.pack(fill="x", padx=28, pady=(12, 0))
        self.monthly_label = ctk.CTkLabel(
            stats_row, text="", font=mono(11), text_color=TEXT_MUTED
        )
        self.monthly_label.pack(side="left")

        # Divider
        ctk.CTkFrame(main, height=1, fg_color=BORDER).pack(
            fill="x", padx=28, pady=16)

        # Column headers
        hdr = ctk.CTkFrame(main, fg_color="transparent")
        hdr.pack(fill="x", padx=28, pady=(0, 8))
        for label, w in [("NAME", 200), ("PRICE", 90), ("BILLING", 130),
                          ("NEXT CHARGE", 140), ("STATUS", 130), ("", 120)]:
            ctk.CTkLabel(hdr, text=label, width=w, anchor="w",
                         font=mono(10), text_color=TEXT_DIM).pack(side="left", padx=4)

        # Scrollable list
        self.scroll = ctk.CTkScrollableFrame(
            main, fg_color="transparent", scrollbar_button_color=SURFACE_2,
            scrollbar_button_hover_color=ACCENT_DIM
        )
        self.scroll.pack(fill="both", expand=True, padx=20, pady=(0, 20))

        self.refresh_list()

    # ── Helpers ──────────────────────────────────────────────────

    def _calc_monthly(self):
        total = 0.0
        for s in self.manager.get_all_subscriptions():
            if s.interval_unit == "days":
                total += s.price * (30 / s.interval_value)
            elif s.interval_unit == "weeks":
                total += s.price * (4.33 / s.interval_value)
            elif s.interval_unit == "months":
                total += s.price / s.interval_value
            elif s.interval_unit == "years":
                total += s.price / (s.interval_value * 12)
        return total

    def _days_until(self, d):
        return (d - date.today()).days

    # ── List ─────────────────────────────────────────────────────

    def refresh_list(self):
        for w in self.scroll.winfo_children():
            w.destroy()

        monthly = self._calc_monthly()
        self.monthly_label.configure(
            text=f"${monthly:.2f} / mo  ·  {len(self.manager.get_all_subscriptions())} subscriptions"
        )

        subs = self.manager.get_all_subscriptions()
        if not subs:
            ctk.CTkLabel(
                self.scroll,
                text="No subscriptions yet.",
                font=sans(13), text_color=TEXT_MUTED
            ).pack(pady=60)
            return

        for s in subs:
            self._build_row(s)

    def _build_row(self, s: Subscription):
        # Determine urgency
        is_expiring = (s.is_trial and s.trial_end_date and
                       self._days_until(s.trial_end_date) <= self.config.get("notify_days", 3))
        is_charging_soon = (not s.is_trial and
                            self._days_until(s.next_charge_date) <= 3)

        row = ctk.CTkFrame(self.scroll, fg_color=SURFACE, corner_radius=8,
                           border_width=1,
                           border_color=RED_DARK if is_expiring else BORDER)
        row.pack(fill="x", pady=3)

        # Left accent bar for expiring trials
        if is_expiring:
            accent = ctk.CTkFrame(row, width=3, fg_color=RED, corner_radius=0)
            accent.pack(side="left", fill="y")

        # Actions on the right FIRST (so they don't get pushed off screen)
        actions = ctk.CTkFrame(row, fg_color="transparent")
        actions.pack(side="right", padx=8)

        ctk.CTkButton(
            actions, text="🔕" if s.mute_notifs else "🔔",
            width=28, height=24, fg_color="transparent",
            hover_color=SURFACE_2, text_color=TEXT_MUTED,
            command=lambda sid=s.id: self.toggle_mute(sid)
        ).pack(side="left", padx=1)

        ctk.CTkButton(
            actions, text="Edit", width=46, height=24,
            fg_color=SURFACE_2, hover_color=ACCENT_DIM,
            text_color=TEXT_MUTED, font=sans(11), corner_radius=5,
            border_width=1, border_color=BORDER,
            command=lambda sub=s: self.open_edit_dialog(sub)
        ).pack(side="left", padx=1)

        ctk.CTkButton(
            actions, text="Delete", width=52, height=24,
            fg_color="transparent", hover_color="#1a0000",
            text_color=RED, font=sans(11), corner_radius=5,
            border_width=1, border_color=RED_DARK,
            command=lambda sid=s.id: self.delete_subscription(sid)
        ).pack(side="left", padx=1)

        # Content
        inner = ctk.CTkFrame(row, fg_color="transparent")
        inner.pack(side="left", fill="x", expand=True, padx=12, pady=6)

        # Name
        ctk.CTkLabel(inner, text=s.name, width=180, anchor="w",
                     font=sans(13, "bold"), text_color=TEXT).pack(side="left", padx=(0,4))

        # Price
        ctk.CTkLabel(inner, text=f"${s.price:.2f}", width=80, anchor="w",
                     font=mono(12), text_color=TEXT).pack(side="left", padx=4)

        # Billing
        unit = s.interval_unit.rstrip("s") if s.interval_value == 1 else s.interval_unit
        ctk.CTkLabel(inner, text=f"every {s.interval_value} {unit}",
                     width=120, anchor="w",
                     font=mono(11), text_color=TEXT_MUTED).pack(side="left", padx=4)

        # Next charge
        days_charge = self._days_until(s.next_charge_date)
        date_str = s.next_charge_date.strftime("%b %d, %Y")
        date_color = RED if days_charge <= 3 else ORANGE if days_charge <= 7 else TEXT_MUTED
        ctk.CTkLabel(inner, text=date_str, width=120, anchor="w",
                     font=mono(11), text_color=date_color).pack(side="left", padx=4)

        # Status badge
        if s.is_trial and s.trial_end_date:
            days_left = self._days_until(s.trial_end_date)
            badge_text = f"trial · {days_left}d"
            badge_fg = RED if days_left <= 3 else SURFACE_2
            badge_border = RED if days_left <= 3 else BORDER
            badge_txt_color = "#ffffff"
        else:
            badge_text = "active"
            badge_fg = SURFACE_2
            badge_border = BORDER
            badge_txt_color = GREEN

        badge_frame = ctk.CTkFrame(inner, fg_color=badge_fg, corner_radius=4,
                                   border_width=1, border_color=badge_border, width=90, height=22)
        badge_frame.pack(side="left", padx=4)
        badge_frame.pack_propagate(False)
        ctk.CTkLabel(badge_frame, text=badge_text, font=mono(10),
                     text_color=badge_txt_color).pack(expand=True)

    # ── Actions ──────────────────────────────────────────────────

    def toggle_mute(self, sub_id):
        sub = self.manager.get_subscription_by_id(sub_id)
        self.manager.update_subscription(sub_id, mute_notifs=not sub.mute_notifs)
        self.refresh_list()

    def delete_subscription(self, sub_id):
        sub = self.manager.get_subscription_by_id(sub_id)
        if messagebox.askyesno("Delete", f"Delete '{sub.name}'?"):
            self.manager.delete_subscription(sub_id)
            self.refresh_list()

    def open_add_dialog(self):
        dlg = AddEditDialog(self, self.manager)
        dlg.grab_set()
        self.wait_window(dlg)
        self.refresh_list()

    def open_edit_dialog(self, sub):
        dlg = AddEditDialog(self, self.manager, sub)
        dlg.grab_set()
        self.wait_window(dlg)
        self.refresh_list()

    def open_settings(self):
        dlg = SettingsDialog(self, self.config)
        dlg.grab_set()
        self.wait_window(dlg)
        self.config = load_config()


# ── Add / Edit Dialog ─────────────────────────────────────────────

class AddEditDialog(ctk.CTkToplevel):
    def __init__(self, parent, manager, sub=None):
        super().__init__(parent)
        self.manager = manager
        self.sub = sub
        self.title("Edit" if sub else "New Subscription")
        self.geometry("420x580")
        self.resizable(False, False)
        self.configure(fg_color=BG)
        self._setup_ui()
        if sub:
            self._populate(sub)

    def _field(self, parent, label, placeholder=""):
        ctk.CTkLabel(parent, text=label, font=mono(10),
                     text_color=TEXT_DIM, anchor="w").pack(fill="x", pady=(10, 2))
        e = ctk.CTkEntry(parent, placeholder_text=placeholder,
                         fg_color=SURFACE, border_color=BORDER,
                         text_color=TEXT, font=sans(13), height=36)
        e.pack(fill="x")
        return e

    def _setup_ui(self):
        wrap = ctk.CTkFrame(self, fg_color="transparent")
        wrap.pack(fill="both", expand=True, padx=24, pady=20)

        ctk.CTkLabel(wrap,
                     text="Edit Subscription" if self.sub else "New Subscription",
                     font=sans(18, "bold"), text_color=TEXT).pack(anchor="w", pady=(0, 4))
        ctk.CTkFrame(wrap, height=1, fg_color=BORDER).pack(fill="x", pady=(0, 4))

        self.name_entry  = self._field(wrap, "NAME", "Netflix")
        self.price_entry = self._field(wrap, "PRICE ($)", "9.99")

        # Interval row
        ctk.CTkLabel(wrap, text="BILLING INTERVAL", font=mono(10),
                     text_color=TEXT_DIM, anchor="w").pack(fill="x", pady=(10, 2))
        int_row = ctk.CTkFrame(wrap, fg_color="transparent")
        int_row.pack(fill="x")
        self.interval_val = ctk.CTkEntry(
            int_row, width=60, placeholder_text="1",
            fg_color=SURFACE, border_color=BORDER, text_color=TEXT, font=sans(13), height=36
        )
        self.interval_val.pack(side="left", padx=(0, 8))
        self.interval_unit_var = ctk.StringVar(value="months")
        ctk.CTkOptionMenu(
            int_row, variable=self.interval_unit_var,
            values=["days", "weeks", "months", "years"],
            fg_color=SURFACE, button_color=SURFACE_2,
            button_hover_color=ACCENT_DIM, text_color=TEXT,
            font=sans(13), width=140, height=36
        ).pack(side="left")

        self.start_entry  = self._field(wrap, "START DATE (YYYY-MM-DD)", "2025-01-01")
        self.charge_entry = self._field(wrap, "NEXT CHARGE DATE (YYYY-MM-DD)", "2026-04-01")

        # Trial toggle
        check_row = ctk.CTkFrame(wrap, fg_color="transparent")
        check_row.pack(fill="x", pady=(12, 0))
        self.is_trial_var = ctk.BooleanVar()
        ctk.CTkCheckBox(check_row, text="Trial", variable=self.is_trial_var,
                        font=sans(13), text_color=TEXT,
                        fg_color=ACCENT, hover_color=ACCENT_DIM,
                        command=self._toggle_trial).pack(side="left", padx=(0, 20))
        self.mute_var = ctk.BooleanVar()
        ctk.CTkCheckBox(check_row, text="Mute notifications",
                        variable=self.mute_var, font=sans(13), text_color=TEXT,
                        fg_color=ACCENT, hover_color=ACCENT_DIM).pack(side="left")

        self.trial_end_entry = self._field(wrap, "TRIAL END DATE (YYYY-MM-DD)", "2026-03-30")
        self.trial_end_entry.configure(state="disabled")

        # Buttons
        ctk.CTkFrame(wrap, height=1, fg_color=BORDER).pack(fill="x", pady=(16, 12))
        btn_row = ctk.CTkFrame(wrap, fg_color="transparent")
        btn_row.pack(fill="x")
        ctk.CTkButton(
            btn_row, text="Cancel", command=self.destroy,
            fg_color=SURFACE, hover_color=SURFACE_2,
            text_color=TEXT_MUTED, font=sans(13),
            border_width=1, border_color=BORDER, height=36
        ).pack(side="right", padx=(8, 0))
        ctk.CTkButton(
            btn_row, text="Save", command=self._save,
            fg_color=ACCENT, hover_color="#cccccc",
            text_color="#000000", font=sans(13, "bold"), height=36
        ).pack(side="right")

    def _toggle_trial(self):
        state = "normal" if self.is_trial_var.get() else "disabled"
        self.trial_end_entry.configure(state=state)
        if not self.is_trial_var.get():
            self.trial_end_entry.delete(0, "end")

    def _populate(self, s):
        self.name_entry.insert(0, s.name)
        self.price_entry.insert(0, str(s.price))
        self.interval_val.insert(0, str(s.interval_value))
        self.interval_unit_var.set(s.interval_unit)
        self.start_entry.insert(0, s.start_date.isoformat())
        self.charge_entry.insert(0, s.next_charge_date.isoformat())
        self.is_trial_var.set(s.is_trial)
        self.mute_var.set(s.mute_notifs)
        if s.is_trial:
            self._toggle_trial()
            if s.trial_end_date:
                self.trial_end_entry.insert(0, s.trial_end_date.isoformat())

    def _save(self):
        try:
            name = self.name_entry.get().strip()
            if not name:
                raise ValueError("Name is required.")
            price = float(self.price_entry.get().strip())
            interval_val = int(self.interval_val.get().strip() or "1")
            interval_unit = self.interval_unit_var.get()
            start_date = date.fromisoformat(self.start_entry.get().strip())
            next_charge = date.fromisoformat(self.charge_entry.get().strip())
            is_trial = self.is_trial_var.get()
            trial_end = None
            if is_trial and self.trial_end_entry.get().strip():
                trial_end = date.fromisoformat(self.trial_end_entry.get().strip())
            mute = self.mute_var.get()
        except ValueError as e:
            messagebox.showerror("Invalid Input", str(e), parent=self)
            return

        if self.sub:
            self.manager.update_subscription(
                self.sub.id, name=name, price=price,
                interval_value=interval_val, interval_unit=interval_unit,
                start_date=start_date, next_charge_date=next_charge,
                is_trial=is_trial, trial_end_date=trial_end, mute_notifs=mute
            )
        else:
            ids = [s.id for s in self.manager.get_all_subscriptions()]
            new_id = max(ids, default=0) + 1
            self.manager.add_subscription(Subscription(
                id=new_id, name=name, price=price,
                interval_value=interval_val, interval_unit=interval_unit,
                start_date=start_date, next_charge_date=next_charge,
                is_trial=is_trial, trial_end_date=trial_end, mute_notifs=mute
            ))
        self.destroy()


# ── Settings Dialog ───────────────────────────────────────────────

class SettingsDialog(ctk.CTkToplevel):
    def __init__(self, parent, config):
        super().__init__(parent)
        self.config = config
        self.title("Settings")
        self.geometry("360x220")
        self.resizable(False, False)
        self.configure(fg_color=BG)
        self._setup_ui()

    def _setup_ui(self):
        wrap = ctk.CTkFrame(self, fg_color="transparent")
        wrap.pack(fill="both", expand=True, padx=24, pady=20)

        ctk.CTkLabel(wrap, text="Settings", font=sans(18, "bold"),
                     text_color=TEXT).pack(anchor="w")
        ctk.CTkFrame(wrap, height=1, fg_color=BORDER).pack(fill="x", pady=12)

        ctk.CTkLabel(wrap, text="NOTIFY DAYS BEFORE TRIAL ENDS",
                     font=mono(10), text_color=TEXT_DIM, anchor="w").pack(fill="x", pady=(0, 4))
        self.days_entry = ctk.CTkEntry(
            wrap, width=80, fg_color=SURFACE,
            border_color=BORDER, text_color=TEXT, font=sans(13), height=36
        )
        self.days_entry.insert(0, str(self.config.get("notify_days", 3)))
        self.days_entry.pack(anchor="w")

        ctk.CTkFrame(wrap, height=1, fg_color=BORDER).pack(fill="x", pady=16)
        btn_row = ctk.CTkFrame(wrap, fg_color="transparent")
        btn_row.pack(fill="x")
        ctk.CTkButton(btn_row, text="Cancel", command=self.destroy,
                      fg_color=SURFACE, hover_color=SURFACE_2,
                      text_color=TEXT_MUTED, font=sans(13),
                      border_width=1, border_color=BORDER, height=36
        ).pack(side="right", padx=(8, 0))
        ctk.CTkButton(btn_row, text="Save", command=self._save,
                      fg_color=ACCENT, hover_color="#cccccc",
                      text_color="#000000", font=sans(13, "bold"), height=36
        ).pack(side="right")

    def _save(self):
        try:
            days = int(self.days_entry.get().strip())
            save_config({"notify_days": days})
            self.destroy()
        except ValueError:
            messagebox.showerror("Invalid Input", "Please enter a whole number.", parent=self)


# ── Entry point ───────────────────────────────────────────────────

if __name__ == "__main__":
    app = SubTrackerApp()
    app.mainloop()