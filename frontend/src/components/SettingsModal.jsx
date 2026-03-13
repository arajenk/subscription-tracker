import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as Label from '@radix-ui/react-label'
import { X, Bell } from 'lucide-react'

export default function SettingsModal({ open, onOpenChange, config, onSave }) {
  const [notifyDays, setNotifyDays] = useState(3)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (open && config) {
      setNotifyDays(config.notify_days ?? 3)
      setError(null)
      setSaved(false)
    }
  }, [open, config])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await onSave({ notify_days: parseInt(notifyDays, 10) })
      setSaved(true)
      setTimeout(() => onOpenChange(false), 600)
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
        <Dialog.Content className="dialog-content fixed left-1/2 top-1/2 z-50 w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-lg font-semibold text-white">Settings</Dialog.Title>
            <Dialog.Close className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Notification days */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-zinc-400" />
                <Label.Root
                  htmlFor="notify_days"
                  className="text-sm font-medium text-zinc-300"
                >
                  Notify days before trial expiry
                </Label.Root>
              </div>
              <p className="text-xs text-zinc-500">
                You'll receive a notification when a trial is within this many days of expiring.
              </p>
              <div className="flex items-center gap-3">
                <input
                  id="notify_days"
                  type="number"
                  min="1"
                  max="30"
                  value={notifyDays}
                  onChange={(e) => setNotifyDays(e.target.value)}
                  className="w-24 h-9 px-3 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-zinc-500 transition-colors tabular-nums"
                />
                <span className="text-sm text-zinc-500">days</span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {/* Footer */}
            <div className="flex gap-2">
              <Dialog.Close className="flex-1 px-4 py-2.5 rounded-lg border border-zinc-700 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors">
                Cancel
              </Dialog.Close>
              <button
                type="submit"
                disabled={saving || saved}
                className="flex-1 px-4 py-2.5 rounded-lg bg-white text-black text-sm font-medium hover:bg-zinc-100 disabled:opacity-60 transition-colors"
              >
                {saved ? 'Saved!' : saving ? 'Saving…' : 'Save Settings'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
