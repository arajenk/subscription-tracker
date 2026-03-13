import { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, RefreshCw, AlertTriangle } from 'lucide-react'
import Sidebar from './components/Sidebar.jsx'
import Dashboard from './components/Dashboard.jsx'
import SubscriptionsTable from './components/SubscriptionsTable.jsx'
import SubscriptionModal from './components/SubscriptionModal.jsx'
import SettingsModal from './components/SettingsModal.jsx'
import { ToastProvider, useToast } from './components/Toast.jsx'
import {
  getSubscriptions, addSubscription, updateSubscription,
  deleteSubscription, toggleMute, getDashboard, getConfig, updateConfig,
} from './lib/api.js'

function DeleteConfirm({ name, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center shrink-0">
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
            <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-lg border border-zinc-700 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors">
              Cancel
            </button>
            <button onClick={onConfirm} className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function AppInner() {
  const addToast = useToast()
  const [view, setView] = useState('dashboard')
  const [subscriptions, setSubscriptions] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSub, setEditingSub] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [subs, dash, cfg] = await Promise.all([
        getSubscriptions(),
        getDashboard(),
        getConfig(),
      ])
      setSubscriptions(subs)
      setDashboard(dash)
      setConfig(cfg)
    } catch {
      setError('Could not connect to the backend. Is it running on port 8000?')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Drive the sidebar's expiring badge from backend data
  const hasExpiring = useMemo(() => (dashboard?.expiring_soon?.length ?? 0) > 0, [dashboard])

  function openAdd() { setEditingSub(null); setModalOpen(true) }
  function openEdit(sub) { setEditingSub(sub); setModalOpen(true) }

  async function handleSave(data) {
    try {
      if (editingSub) {
        const updated = await updateSubscription(editingSub.id, data)
        setSubscriptions(prev => prev.map(s => s.id === updated.id ? updated : s))
        addToast(`${updated.name} updated`)
      } else {
        const created = await addSubscription(data)
        setSubscriptions(prev => [...prev, created])
        addToast(`${created.name} added`)
      }
    } catch (err) {
      addToast(err.message, 'error')
      throw err
    }
    await loadData()
  }

  async function handleDelete(id) {
    const name = deleteTarget?.name
    try {
      await deleteSubscription(id)
      setSubscriptions(prev => prev.filter(s => s.id !== id))
      setDeleteTarget(null)
      addToast(`${name} deleted`)
      await loadData()
    } catch (err) {
      addToast(err.message, 'error')
      setDeleteTarget(null)
    }
  }

  async function handleToggleMute(id) {
    try {
      const updated = await toggleMute(id)
      setSubscriptions(prev => prev.map(s => s.id === updated.id ? updated : s))
      addToast(updated.mute_notifs ? 'Notifications muted' : 'Notifications unmuted', 'info')
      await loadData()
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  async function handleSaveConfig(data) {
    const updated = await updateConfig(data)
    setConfig(updated)
    await loadData()
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        currentView={view}
        onViewChange={setView}
        onSettingsOpen={() => setSettingsOpen(true)}
        hasExpiring={hasExpiring}
      />

      <main className="flex-1 flex flex-col overflow-y-auto">
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
              Add Subscription
            </button>
          </div>
        </header>

        <div key={view} className="view-enter flex-1 px-8 py-7">
          {error && (
            <div className="mb-6 flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <RefreshCw className="w-6 h-6 text-zinc-600 animate-spin" />
            </div>
          ) : view === 'dashboard' ? (
            <Dashboard subscriptions={subscriptions} config={config} dashboard={dashboard} />
          ) : (
            <SubscriptionsTable
              subscriptions={subscriptions}
              onEdit={openEdit}
              onDelete={sub => setDeleteTarget({ id: sub.id, name: sub.name })}
              onToggleMute={handleToggleMute}
              onAdd={openAdd}
            />
          )}
        </div>
      </main>

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

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  )
}
