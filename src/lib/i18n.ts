import en from '@/i18n/en.json'
import fr from '@/i18n/fr.json'
import ar from '@/i18n/ar.json'

export type Locale = 'en' | 'fr' | 'ar'

export const translations: Record<Locale, Record<string, unknown>> = { en, fr, ar }

export function getLocale(): Locale {
  if (typeof window === 'undefined') return 'en'
  return (localStorage.getItem('locale') as Locale) || 'en'
}

export function setLocale(locale: Locale) {
  localStorage.setItem('locale', locale)
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.lang = locale
}

export function t(key: string, params?: Record<string, string | number>): string {
  const locale = getLocale()
  const keys = key.split('.')
  let value: unknown = translations[locale]

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = (value as Record<string, unknown>)[k]
    } else {
      value = undefined
      break
    }
  }

  if (typeof value !== 'string') {
    // Fallback to English
    value = undefined
    let fallback: unknown = translations.en
    for (const k of keys) {
      if (fallback && typeof fallback === 'object' && k in fallback) {
        fallback = (fallback as Record<string, unknown>)[k]
      } else {
        fallback = undefined
        break
      }
    }
    if (typeof fallback === 'string') value = fallback
  }

  if (typeof value !== 'string') return key

  if (params) {
    return Object.entries(params).reduce(
      (str, [p, v]) => str.replace(new RegExp(`{{${p}}}`, 'g'), String(v)),
      value
    )
  }

  return value
}

export function isRTL(): boolean {
  return getLocale() === 'ar'
}
