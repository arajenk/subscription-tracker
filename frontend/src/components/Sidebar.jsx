import { Settings, LayoutDashboard, CreditCard } from 'lucide-react'
import { cn } from '../lib/utils.js'

const navItems = [
  { label: 'Dashboard',     icon: LayoutDashboard, view: 'dashboard' },
  { label: 'Subscriptions', icon: CreditCard,       view: 'subscriptions' },
]

export default function Sidebar({ currentView, onViewChange, onSettingsOpen, hasExpiring }) {
  return (
    <aside className="flex flex-col w-56 shrink-0 bg-[#111113] border-r border-zinc-800 h-screen sticky top-0">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-zinc-800">
        <div className="relative shrink-0">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="3" width="12" height="8" rx="1.5" stroke="white" strokeWidth="1.4" fill="none"/>
              <line x1="1" y1="5.8" x2="13" y2="5.8" stroke="white" strokeWidth="1.4"/>
              <rect x="3" y="8" width="3" height="1.2" rx="0.6" fill="white"/>
            </svg>
          </div>
          {hasExpiring && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          )}
        </div>
        <span className="font-semibold text-sm text-white tracking-tight">SubTracker</span>
      </div>

      <nav className="flex flex-col gap-1 p-3 flex-1">
        {navItems.map(({ label, icon: Icon, view }) => (
          <button
            key={view}
            onClick={() => onViewChange(view)}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left w-full',
              currentView === view
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-zinc-800">
        <button
          onClick={onSettingsOpen}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors w-full"
        >
          <Settings className="w-4 h-4 shrink-0" />
          Settings
        </button>
      </div>
    </aside>
  )
}
