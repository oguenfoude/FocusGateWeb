import { Locale } from '@/lib/i18n'

function asDate(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : date
  return d
}

function localeToIntl(locale?: Locale): string {
  if (locale === 'fr') return 'fr-FR'
  if (locale === 'ar') return 'ar-DZ'
  return 'en-GB'
}

export function formatDate(date: Date | string, locale?: Locale): string {
  const d = asDate(date)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleString(localeToIntl(locale), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function formatShortDate(date: Date | string, locale?: Locale): string {
  const d = asDate(date)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString(localeToIntl(locale), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatTimeAgo(date: Date | string, locale?: Locale): string {
  const d = asDate(date)
  if (isNaN(d.getTime())) return '-'

  const diffMs = Date.now() - d.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) {
    if (locale === 'fr') return "à l'instant"
    if (locale === 'ar') return 'الآن'
    return 'just now'
  }

  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) {
    if (locale === 'fr') return `il y a ${diffMin} min`
    if (locale === 'ar') return `قبل ${diffMin} دقيقة`
    return `${diffMin}m ago`
  }

  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) {
    if (locale === 'fr') return `il y a ${diffHr}h`
    if (locale === 'ar') return `قبل ${diffHr} ساعة`
    return `${diffHr}h ago`
  }

  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) {
    if (locale === 'fr') return `il y a ${diffDay}j`
    if (locale === 'ar') return `قبل ${diffDay} يوم`
    return `${diffDay}d ago`
  }

  return formatShortDate(date, locale)
}
