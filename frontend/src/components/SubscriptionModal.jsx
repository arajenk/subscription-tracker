import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as Switch from '@radix-ui/react-switch'
import * as Select from '@radix-ui/react-select'
import * as Label from '@radix-ui/react-label'
import { ChevronDown, X } from 'lucide-react'
import { todayISO } from '../lib/utils.js'

const INTERVAL_UNITS = ['days', 'weeks', 'months', 'years']

const EMPTY_FORM = {
  name: '',
  price: '',
  interval_value: '1',
  interval_unit: 'months',
  start_date: todayISO(),
  next_charge_date: '',   // optional — backend auto-calculates if blank
  is_trial: false,
  trial_end_date: '',
  mute_notifs: false,
}

function Field({ label, children, htmlFor }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label.Root htmlFor={htmlFor} className="text-sm font-medium text-zinc-300">
        {label}
      </Label.Root>
      {children}
    </div>
  )
}

function Input({ id, type = 'text', value, onChange, placeholder, required, min, step }) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      min={min}
      step={step}
      className="w-full h-9 px-3 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
    />
  )
}

function IntervalSelect({ value, onChange }) {
  return (
    <Select.Root value={value} onValueChange={onChange}>
      <Select.Trigger className="select-trigger">
        <Select.Value />
        <Select.Icon>
          <ChevronDown className="w-4 h-4 text-zinc-400" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className="select-content" position="popper" sideOffset={4}>
          <Select.Viewport>
            {INTERVAL_UNITS.map(unit => (
              <Select.Item key={unit} value={unit} className="select-item">
                <Select.ItemText>{unit.charAt(0).toUpperCase() + unit.slice(1)}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
}

function SwitchRow({ id, label, checked, onCheckedChange }) {
  return (
    <div className="flex items-center justify-between">
      <Label.Root htmlFor={id} className="text-sm font-medium text-zinc-300 cursor-pointer">
        {label}
      </Label.Root>
      <Switch.Root id={id} checked={checked} onCheckedChange={onCheckedChange} className="switch-root">
        <Switch.Thumb className="switch-thumb" />
      </Switch.Root>
    </div>
  )
}

export default function SubscriptionModal({ open, onOpenChange, subscription, onSave }) {
  const isEdit = !!subscription
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open) {
      setForm(subscription ? {
        name: subscription.name ?? '',
        price: String(subscription.price ?? ''),
        interval_value: String(subscription.interval_value ?? '1'),
        interval_unit: subscription.interval_unit ?? 'months',
        start_date: subscription.start_date ?? todayISO(),
        next_charge_date: subscription.next_charge_date ?? '',
        is_trial: subscription.is_trial ?? false,
        trial_end_date: subscription.trial_end_date ?? '',
        mute_notifs: subscription.mute_notifs ?? false,
      } : EMPTY_FORM)
      setError(null)
    }
  }, [open, subscription])

  function set(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await onSave({
        name: form.name.trim(),
        price: parseFloat(form.price),
        interval_value: parseInt(form.interval_value, 10),
        interval_unit: form.interval_unit,
        start_date: form.start_date,
        next_charge_date: form.next_charge_date || null,
        is_trial: form.is_trial,
        trial_end_date: form.is_trial && form.trial_end_date ? form.trial_end_date : null,
        mute_notifs: form.mute_notifs,
      })
      onOpenChange(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
        <Dialog.Content className="dialog-content fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-lg font-semibold text-white">
              {isEdit ? 'Edit Subscription' : 'Add Subscription'}
            </Dialog.Title>
            <Dialog.Close className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field label="Name" htmlFor="name">
              <Input id="name" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Netflix" required />
            </Field>

            <Field label="Price" htmlFor="price">
              <Input id="price" type="number" value={form.price} onChange={e => set('price', e.target.value)} placeholder="9.99" min="0" step="any" required />
            </Field>

            {/* Billing interval */}
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-zinc-300">Billing Interval</span>
              <div className="flex gap-2 items-center">
                <div className="w-20 shrink-0">
                  <Input id="interval_value" type="number" value={form.interval_value} onChange={e => set('interval_value', e.target.value)} min="1" required />
                </div>
                <div className="flex-1 min-w-0">
                  <IntervalSelect value={form.interval_unit} onChange={v => set('interval_unit', v)} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Start Date" htmlFor="start_date">
                <Input id="start_date" type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} required />
              </Field>
              <Field label="Next Charge (optional)" htmlFor="next_charge_date">
                <Input id="next_charge_date" type="date" value={form.next_charge_date} onChange={e => set('next_charge_date', e.target.value)} />
              </Field>
            </div>

            <div className="flex flex-col gap-3 py-1">
              <SwitchRow id="is_trial"    label="Trial subscription"  checked={form.is_trial}    onCheckedChange={v => set('is_trial', v)} />
              <SwitchRow id="mute_notifs" label="Mute notifications"  checked={form.mute_notifs} onCheckedChange={v => set('mute_notifs', v)} />
            </div>

            {form.is_trial && (
              <Field label="Trial End Date" htmlFor="trial_end_date">
                <Input id="trial_end_date" type="date" value={form.trial_end_date} onChange={e => set('trial_end_date', e.target.value)} />
              </Field>
            )}

            {error && (
              <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="flex gap-2 pt-2">
              <Dialog.Close className="flex-1 px-4 py-2.5 rounded-lg border border-zinc-700 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors">
                Cancel
              </Dialog.Close>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2.5 rounded-lg bg-white text-black text-sm font-medium hover:bg-zinc-100 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Subscription'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
