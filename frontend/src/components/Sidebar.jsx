import { Settings, LayoutDashboard, CreditCard } from 'lucide-react'
import { cn } from '../lib/utils.js'

const navItems = [
  { label: 'Dashboard',     icon: LayoutDashboard, view: 'dashboard' },
  { label: 'Subscriptions', icon: CreditCard,       view: 'subscriptions' },
]

export default function Sidebar({ currentView, onViewChange, onSettingsOpen, hasExpiring }) {
  return (
    <aside className="flex flex-col w-56 shrink-0 bg-[#111113] border-r border-zinc-800 h-screen sticky top-0">
      <div className="relative flex items-center px-5 h-16 border-b border-zinc-800">
        <span className="text-sm font-medium text-zinc-300 tracking-tight">subtracker</span>
        {hasExpiring && (
          <span className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        )}
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
