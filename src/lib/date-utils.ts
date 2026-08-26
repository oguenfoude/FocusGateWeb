import { Locale } from '@/lib/i18n'

const localeMap: Record<string, string> = {
  en: 'en-US',
  fr: 'fr-FR',
  ar: 'ar-DZ',
}

function toDate(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date.getTime())
  if (isNaN(d.getTime())) return new Date()
  return d
}

function formatWithOptions(date: Date | string, locale: Locale | undefined, options: Intl.DateTimeFormatOptions): string {
  const d = toDate(date)
  const loc = localeMap[locale || 'en'] || 'en-US'
  return new Intl.DateTimeFormat(loc, { ...options, timeZone: 'Africa/Algiers' }).format(d)
}

export function formatDate(date: Date | string, locale?: Locale): string {
  return formatWithOptions(date, locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function formatShortDate(date: Date | string, locale?: Locale): string {
  return formatWithOptions(date, locale, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}
