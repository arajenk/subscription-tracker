import { TrendingUp, CreditCard, AlertTriangle, Calendar, Zap, Clock } from 'lucide-react'
import { toMonthlyPrice, formatPrice, formatDate, daysUntil } from '../lib/utils.js'

function StatCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${accent}20` }}>
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

function SectionEmpty({ message }) {
  return (
    <div className="flex items-center justify-center py-6 text-sm text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
      {message}
    </div>
  )
}

function SectionHeader({ icon: Icon, iconClass, title, meta }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={`w-4 h-4 ${iconClass}`} />
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      {meta && <span className="text-xs text-zinc-500">{meta}</span>}
    </div>
  )
}

export default function Dashboard({ subscriptions, config }) {
  const notifyDays = config?.notify_days ?? 3

  const paid = subscriptions.filter(s => !s.is_trial)
  const monthlyTotal = paid.reduce(
    (sum, s) => sum + toMonthlyPrice(s.price, s.interval_value, s.interval_unit),
    0
  )
  const activeCount = paid.length
  const trialCount  = subscriptions.filter(s => s.is_trial).length
  const avgPerSub   = activeCount > 0 ? monthlyTotal / activeCount : 0

  const expiring = subscriptions.filter(s => {
    if (!s.is_trial || !s.trial_end_date) return false
    const d = daysUntil(s.trial_end_date)
    return d !== null && d >= 0 && d <= notifyDays
  })

  const upcoming = [...subscriptions]
    .filter(s => { const d = daysUntil(s.next_charge_date); return d !== null && d >= 0 && d <= 7 })
    .sort((a, b) => daysUntil(a.next_charge_date) - daysUntil(b.next_charge_date))

  return (
    <div className="flex flex-col gap-10">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={TrendingUp}
          label="Monthly Spend"
          value={formatPrice(monthlyTotal)}
          sub={activeCount > 0 ? `avg ${formatPrice(avgPerSub)}/sub` : 'no active subscriptions'}
          accent="#a78bfa"
        />
        <StatCard
          icon={Zap}
          label="Yearly Projection"
          value={formatPrice(monthlyTotal * 12)}
          sub="based on current billing"
          accent="#60a5fa"
        />
        <StatCard
          icon={CreditCard}
          label="Active"
          value={activeCount}
          sub={activeCount === 1 ? 'paid subscription' : 'paid subscriptions'}
          accent="#34d399"
        />
        <StatCard
          icon={AlertTriangle}
          label="Trials"
          value={trialCount}
          sub={trialCount === 0 ? 'none active' : trialCount === 1 ? 'trial in progress' : 'trials in progress'}
          accent="#fbbf24"
        />
      </div>

      <section className="flex flex-col gap-3">
        <SectionHeader icon={AlertTriangle} iconClass="text-red-400" title="Expiring Soon" meta={`within ${notifyDays} days`} />
        {expiring.length === 0 ? (
          <SectionEmpty message="No trials expiring soon" />
        ) : (
          <div className="flex flex-col gap-2">
            {expiring.map(s => {
              const days = daysUntil(s.trial_end_date)
              return (
                <div key={s.id} className="flex items-center gap-3 bg-red-500/[0.08] border border-red-500/25 rounded-xl px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{s.name}</p>
                    <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3 shrink-0" />
                      {days === 0 ? 'Expires today' : `Renews in ${days} day${days === 1 ? '' : 's'}`}
                      <span className="text-zinc-600 mx-0.5">·</span>
                      {formatDate(s.trial_end_date)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-red-400 shrink-0">
                    {days === 0 ? 'Today' : `${days}d left`}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeader icon={Calendar} iconClass="text-zinc-400" title="Upcoming Charges" meta="next 7 days" />
        {upcoming.length === 0 ? (
          <SectionEmpty message="No charges in the next 7 days" />
        ) : (
          <div className="flex flex-col gap-2">
            {upcoming.map(s => {
              const days = daysUntil(s.next_charge_date)
              return (
                <div key={s.id} className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{s.name}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {formatDate(s.next_charge_date)}
                      <span className="mx-1.5 text-zinc-700">·</span>
                      {days === 0 ? 'Today' : `in ${days} day${days === 1 ? '' : 's'}`}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-white tabular-nums shrink-0">{formatPrice(s.price)}</span>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
