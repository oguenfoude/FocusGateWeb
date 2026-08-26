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

export function isRTL(): boolean {
  return getLocale() === 'ar'
}
