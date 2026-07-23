import { Locale } from '@/lib/i18n'

const localeMap: Record<string, string> = {
  en: 'en-US',
  fr: 'fr-FR',
  ar: 'ar-DZ',
}

function parseAndAdjustDate(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date.getTime())
  if (isNaN(d.getTime())) return new Date()
  // Add 1 hour (3600000 ms) to adjust web display to Algeria local time (UTC+1)
  return new Date(d.getTime() + 3600_000)
}

export function formatDate(date: Date | string, locale?: Locale): string {
  const d = parseAndAdjustDate(date)
  const loc = localeMap[locale || 'en'] || 'en-US'
  return d.toLocaleDateString(loc, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
}

export function formatShortDate(date: Date | string, locale?: Locale): string {
  const d = parseAndAdjustDate(date)
  const loc = localeMap[locale || 'en'] || 'en-US'
  return d.toLocaleDateString(loc, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })
}

export function formatTimeAgo(date: Date | string, locale?: Locale): string {
  const d = parseAndAdjustDate(date)
  const now = Date.now()
  const diffMs = now - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return locale === 'ar' ? 'الآن' : 'just now'
  if (diffMin < 60) return locale === 'ar' ? `منذ ${diffMin} دقيقة` : locale === 'fr' ? `il y a ${diffMin} min` : `${diffMin}m ago`
  if (diffHr < 24) return locale === 'ar' ? `منذ ${diffHr} ساعة` : locale === 'fr' ? `il y a ${diffHr}h` : `${diffHr}h ago`
  if (diffDay < 7) return locale === 'ar' ? `منذ ${diffDay} يوم` : locale === 'fr' ? `il y a ${diffDay}j` : `${diffDay}d ago`
  return formatShortDate(date, locale)
}
