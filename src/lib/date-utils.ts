import { Locale } from '@/lib/i18n'

const ALGERIA_TZ = 'Africa/Algiers'

function toAlgeriaDate(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : date
  return d
}

export function formatDate(date: Date | string, _locale?: Locale): string {
  const d = toAlgeriaDate(date)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleString('en-GB', {
    timeZone: ALGERIA_TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function formatShortDate(date: Date | string, locale?: Locale): string {
  return formatDate(date, locale)
}

export function formatTimeAgo(date: Date | string, locale?: Locale): string {
  return formatDate(date, locale)
}
