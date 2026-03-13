import { useState, useEffect, useCallback } from 'react'
import { Plus, RefreshCw, TrendingUp, CreditCard, AlertTriangle } from 'lucide-react'
import Sidebar from './components/Sidebar.jsx'
import SubscriptionCard from './components/SubscriptionCard.jsx'
import SubscriptionModal from './components/SubscriptionModal.jsx'
import SettingsModal from './components/SettingsModal.jsx'
import {
  getSubscriptions,
  addSubscription,
  updateSubscription,
  deleteSubscription,
  toggleMute,
  getConfig,
  updateConfig,
} from './lib/api.js'
import { toMonthlyPrice, formatPrice } from './lib/utils.js'

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: accent + '20' }}
      >
        <Icon className="w-5 h-5" style={{ color: accent }} />
      </div>
      <div>
        <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-white tabular-nums leading-tight">{value}</p>
        {sub && <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center">
        <CreditCard className="w-8 h-8 text-zinc-500" />
      </div>
      <div>
        <p className="text-white font-semibold text-lg">No subscriptions yet</p>
        <p className="text-zinc-500 text-sm mt-1">
          Add your first subscription to start tracking.
        </p>
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

// ── Delete Confirm ────────────────────────────────────────────────────────────
function DeleteConfirm({ name, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="font-semibold text-white">Delete subscription?</p>
              <p className="text-sm text-zinc-400 mt-0.5">
                <strong className="text-zinc-200">{name}</strong> will be permanently removed.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-lg border border-zinc-700 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState('subscriptions')
  const [subscriptions, setSubscriptions] = useState([])
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSub, setEditingSub] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null) // { id, name }

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [subs, cfg] = await Promise.all([getSubscriptions(), getConfig()])
      setSubscriptions(subs)
      setConfig(cfg)
    } catch (e) {
      setError('Could not connect to the API. Is the FastAPI server running on port 8000?')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ── Computed stats ─────────────────────────────────────────────────────────
  const monthlyTotal = subscriptions.reduce(
    (sum, s) => sum + toMonthlyPrice(s.price, s.interval_value, s.interval_unit),
    0
  )
  const trialCount = subscriptions.filter((s) => s.is_trial).length
  const activeCount = subscriptions.filter((s) => !s.is_trial).length

  // ── Handlers ───────────────────────────────────────────────────────────────
  function openAdd() {
    setEditingSub(null)
    setModalOpen(true)
  }

  function openEdit(sub) {
    setEditingSub(sub)
    setModalOpen(true)
  }

  async function handleSave(data) {
    if (editingSub) {
      const updated = await updateSubscription(editingSub.id, data)
      setSubscriptions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
    } else {
      const created = await addSubscription(data)
      setSubscriptions((prev) => [...prev, created])
    }
  }

  async function handleDelete(id) {
    await deleteSubscription(id)
    setSubscriptions((prev) => prev.filter((s) => s.id !== id))
    setDeleteTarget(null)
  }

  async function handleToggleMute(id) {
    const updated = await toggleMute(id)
    setSubscriptions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
  }

  async function handleSaveConfig(data) {
    const updated = await updateConfig(data)
    setConfig(updated)
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        currentView={view}
        onViewChange={setView}
        onSettingsOpen={() => setSettingsOpen(true)}
      />

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 flex items-center justify-between px-8 h-16 bg-zinc-950/80 backdrop-blur border-b border-zinc-800">
          <h1 className="text-base font-semibold text-white">
            {view === 'dashboard' ? 'Dashboard' : 'Subscriptions'}
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-40"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={openAdd}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-zinc-100 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </header>

        <div className="flex-1 px-8 py-7">
          {/* Error */}
          {error && (
            <div className="mb-6 flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <StatCard
              icon={TrendingUp}
              label="Monthly Spend"
              value={formatPrice(monthlyTotal)}
              sub="across all subscriptions"
              accent="#a78bfa"
            />
            <StatCard
              icon={CreditCard}
              label="Active"
              value={activeCount}
              sub={activeCount === 1 ? 'subscription' : 'subscriptions'}
              accent="#34d399"
            />
            <StatCard
              icon={AlertTriangle}
              label="Trials"
              value={trialCount}
              sub={trialCount === 1 ? 'in progress' : 'in progress'}
              accent="#fbbf24"
            />
          </div>

          {/* Subscription grid */}
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <RefreshCw className="w-6 h-6 text-zinc-600 animate-spin" />
            </div>
          ) : subscriptions.length === 0 ? (
            <EmptyState onAdd={openAdd} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {subscriptions.map((sub) => (
                <SubscriptionCard
                  key={sub.id}
                  sub={sub}
                  onEdit={openEdit}
                  onDelete={(id) => setDeleteTarget({ id, name: sub.name })}
                  onToggleMute={handleToggleMute}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <SubscriptionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        subscription={editingSub}
        onSave={handleSave}
      />

      <SettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        config={config}
        onSave={handleSaveConfig}
      />

      {/* Delete confirm */}
      {deleteTarget && (
        <DeleteConfirm
          name={deleteTarget.name}
          onConfirm={() => handleDelete(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
