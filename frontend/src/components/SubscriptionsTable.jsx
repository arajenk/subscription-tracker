import { useState, useMemo } from 'react'
import { Plus, Search, X, ChevronUp, ChevronDown, Bell, BellOff, Pencil, Trash2, AlertTriangle, CreditCard } from 'lucide-react'
import Badge from './Badge.jsx'
import ServiceIcon from './ServiceIcon.jsx'
import { formatPrice, formatInterval, formatDate, daysUntil, cn } from '../lib/utils.js'

function RowAction({ onClick, title, children, danger = false }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'p-1.5 rounded-lg transition-colors',
        danger
          ? 'text-zinc-500 hover:text-red-400 hover:bg-red-400/10'
          : 'text-zinc-500 hover:text-white hover:bg-zinc-700'
      )}
    >
      {children}
    </button>
  )
}

function SortHeader({ label, col, sort, onSort }) {
  const active = sort.col === col
  const Icon = active && sort.dir === 'desc' ? ChevronDown : ChevronUp
  return (
    <button
      onClick={() => onSort(col)}
      className={cn(
        'flex items-center gap-1 text-xs font-medium uppercase tracking-wide transition-colors',
        active ? 'text-zinc-300' : 'text-zinc-500 hover:text-zinc-400'
      )}
    >
      {label}
      <Icon className={cn('w-3 h-3', active ? 'text-zinc-300' : 'text-zinc-600')} />
    </button>
  )
}

function getStatusBadge(sub) {
  if (!sub.is_trial) return <Badge variant="active">Active</Badge>
  const days = daysUntil(sub.trial_end_date)
  if (days !== null && days <= 3) {
    return (
      <Badge variant="warning">
        <AlertTriangle className="w-3 h-3" />
        Trial {days === 0 ? 'today' : `${days}d`}
      </Badge>
    )
  }
  return <Badge variant="trial">Trial{days !== null ? ` · ${days}d` : ''}</Badge>
}

export default function SubscriptionsTable({ subscriptions, onEdit, onDelete, onToggleMute, onAdd }) {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState({ col: 'name', dir: 'asc' })

  function handleSort(col) {
    setSort(prev => ({ col, dir: prev.col === col && prev.dir === 'asc' ? 'desc' : 'asc' }))
  }

  const rows = useMemo(() => {
    const q = search.toLowerCase()
    const list = q ? subscriptions.filter(s => s.name.toLowerCase().includes(q)) : subscriptions
    return [...list].sort((a, b) => {
      let av, bv
      if (sort.col === 'name')             { av = a.name.toLowerCase();    bv = b.name.toLowerCase() }
      else if (sort.col === 'price')       { av = a.price;                 bv = b.price }
      else                                 { av = a.next_charge_date;      bv = b.next_charge_date }
      if (av < bv) return sort.dir === 'asc' ? -1 : 1
      if (av > bv) return sort.dir === 'asc' ?  1 : -1
      return 0
    })
  }, [subscriptions, search, sort])

  if (subscriptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center">
          <CreditCard className="w-8 h-8 text-zinc-500" />
        </div>
        <div>
          <p className="text-white font-semibold text-lg">No subscriptions yet</p>
          <p className="text-zinc-500 text-sm mt-1">Add your first subscription to start tracking.</p>
        </div>
        <button
          onClick={onAdd}
          className="mt-2 flex items-center gap-2 px-4 py-2.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-zinc-100 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Subscription
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search subscriptions…"
            className="w-full h-9 pl-9 pr-8 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {search && (
          <span className="text-xs text-zinc-500">{rows.length} result{rows.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-900 border-b border-zinc-800">
              <th className="px-4 py-3 text-left"><SortHeader label="Name"        col="name"             sort={sort} onSort={handleSort} /></th>
              <th className="px-4 py-3 text-left"><SortHeader label="Price"       col="price"            sort={sort} onSort={handleSort} /></th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">Interval</th>
              <th className="px-4 py-3 text-left"><SortHeader label="Next Charge" col="next_charge_date" sort={sort} onSort={handleSort} /></th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-zinc-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-zinc-500 py-10">No results for "{search}"</td>
              </tr>
            ) : rows.map(sub => (
              <tr key={sub.id} className="bg-zinc-950 hover:bg-zinc-900 transition-colors group">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <ServiceIcon name={sub.name} size="sm" />
                    <span className="font-medium text-white">{sub.name}</span>
                    {sub.mute_notifs && <BellOff className="w-3 h-3 text-zinc-600" />}
                  </div>
                </td>
                <td className="px-4 py-3.5 text-white tabular-nums">{formatPrice(sub.price)}</td>
                <td className="px-4 py-3.5 text-zinc-400">{formatInterval(sub.interval_value, sub.interval_unit)}</td>
                <td className="px-4 py-3.5 text-zinc-300 tabular-nums">{formatDate(sub.next_charge_date)}</td>
                <td className="px-4 py-3.5">{getStatusBadge(sub)}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <RowAction onClick={() => onToggleMute(sub.id)} title={sub.mute_notifs ? 'Unmute' : 'Mute'}>
                      {sub.mute_notifs ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                    </RowAction>
                    <RowAction onClick={() => onEdit(sub)} title="Edit">
                      <Pencil className="w-4 h-4" />
                    </RowAction>
                    <RowAction onClick={() => onDelete(sub)} title="Delete" danger>
                      <Trash2 className="w-4 h-4" />
                    </RowAction>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
