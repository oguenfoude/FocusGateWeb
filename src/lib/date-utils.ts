import { Locale } from '@/lib/i18n'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function formatDate(date: Date | string, _locale?: Locale): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return '-'
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`
}

export function formatShortDate(date: Date | string, locale?: Locale): string {
  return formatDate(date, locale)
}

export function formatTimeAgo(date: Date | string, locale?: Locale): string {
  return formatDate(date, locale)
}
