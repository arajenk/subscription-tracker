import { cn } from '../lib/utils.js'

const STYLES = {
  default: 'bg-zinc-800 text-zinc-300',
  trial:   'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  active:  'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  warning: 'bg-red-500/15 text-red-400 border border-red-500/30',
}

export default function Badge({ children, variant = 'default' }) {
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', STYLES[variant])}>
      {children}
    </span>
  )
}
