import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Normalise a subscription's price to a monthly equivalent.
 * interval_unit: "days" | "weeks" | "months" | "years"
 */
export function toMonthlyPrice(price, interval_value, interval_unit) {
  const v = interval_value || 1
  switch (interval_unit) {
    case 'days':
      return (price / v) * 30.44
    case 'weeks':
      return (price / v) * (30.44 / 7)
    case 'months':
      return price / v
    case 'years':
      return price / v / 12
    default:
      return price
  }
}

/** Format a price as $X.XX */
export function formatPrice(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

/** Human-readable billing period, e.g. "monthly", "every 3 months" */
export function formatInterval(interval_value, interval_unit) {
  const unit = interval_unit?.replace(/s$/, '') ?? 'month'
  if (interval_value === 1) {
    return `Every ${unit}`
  }
  return `Every ${interval_value} ${unit}s`
}

/** Days until a date string; negative if past */
export function daysUntil(dateStr) {
  if (!dateStr) return null
  const diff = new Date(dateStr) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/** Format a date string as "Mar 14, 2026" */
export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

/** Today's date as ISO string (YYYY-MM-DD) */
export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}
