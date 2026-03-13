import { Pencil, Trash2, BellOff, Bell, AlertTriangle } from 'lucide-react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { formatPrice, formatInterval, formatDate, daysUntil, cn } from '../lib/utils.js'

function Badge({ children, variant = 'default' }) {
  const styles = {
    default: 'bg-zinc-800 text-zinc-300',
    trial: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    active: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    warning: 'bg-red-500/15 text-red-400 border border-red-500/30',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        styles[variant]
      )}
    >
      {children}
    </span>
  )
}

function ActionButton({ onClick, title, children, danger = false }) {
  return (
    <Tooltip.Provider delayDuration={300}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            onClick={onClick}
            className={cn(
              'p-2 rounded-lg transition-colors',
              danger
                ? 'text-zinc-500 hover:text-red-400 hover:bg-red-400/10'
                : 'text-zinc-500 hover:text-white hover:bg-zinc-700'
            )}
          >
            {children}
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="bg-zinc-800 text-zinc-100 text-xs px-2 py-1 rounded-md shadow-lg"
            sideOffset={4}
          >
            {title}
            <Tooltip.Arrow className="fill-zinc-800" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}

export default function SubscriptionCard({ sub, onEdit, onDelete, onToggleMute }) {
  const trialDays = sub.is_trial && sub.trial_end_date ? daysUntil(sub.trial_end_date) : null
  const isExpiringSoon = trialDays !== null && trialDays <= 3

  function getStatusBadge() {
    if (!sub.is_trial) return <Badge variant="active">Active</Badge>
    if (isExpiringSoon) {
      return (
        <Badge variant="warning">
          <AlertTriangle className="w-3 h-3" />
          Trial ends in {trialDays}d
        </Badge>
      )
    }
    return <Badge variant="trial">Trial</Badge>
  }

  return (
    <div
      className={cn(
        'relative flex flex-col gap-4 bg-zinc-900 border rounded-xl p-5 transition-colors',
        isExpiringSoon ? 'border-red-500/40' : 'border-zinc-800 hover:border-zinc-700'
      )}
    >
      {/* Muted indicator */}
      {sub.mute_notifs && (
        <span className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-zinc-600" />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5 min-w-0">
          <h3 className="font-semibold text-white leading-tight truncate">{sub.name}</h3>
          {getStatusBadge()}
        </div>
        <div className="text-right shrink-0">
          <p className="text-xl font-bold text-white tabular-nums">
            {formatPrice(sub.price)}
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">
            {formatInterval(sub.interval_value, sub.interval_unit)}
          </p>
        </div>
      </div>

      {/* Dates */}
      <div className="flex flex-col gap-1 text-sm">
        <div className="flex justify-between">
          <span className="text-zinc-500">Next charge</span>
          <span className="text-zinc-300 tabular-nums">{formatDate(sub.next_charge_date)}</span>
        </div>
        {sub.is_trial && sub.trial_end_date && (
          <div className="flex justify-between">
            <span className="text-zinc-500">Trial ends</span>
            <span
              className={cn(
                'tabular-nums',
                isExpiringSoon ? 'text-red-400' : 'text-zinc-300'
              )}
            >
              {formatDate(sub.trial_end_date)}
            </span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-zinc-800" />

      {/* Actions */}
      <div className="flex items-center justify-end gap-1 -m-1">
        <ActionButton
          onClick={() => onToggleMute(sub.id)}
          title={sub.mute_notifs ? 'Unmute notifications' : 'Mute notifications'}
        >
          {sub.mute_notifs ? (
            <BellOff className="w-4 h-4" />
          ) : (
            <Bell className="w-4 h-4" />
          )}
        </ActionButton>
        <ActionButton onClick={() => onEdit(sub)} title="Edit subscription">
          <Pencil className="w-4 h-4" />
        </ActionButton>
        <ActionButton onClick={() => onDelete(sub.id)} title="Delete subscription" danger>
          <Trash2 className="w-4 h-4" />
        </ActionButton>
      </div>
    </div>
  )
}
