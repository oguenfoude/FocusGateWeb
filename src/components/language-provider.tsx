'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { Locale, getLocale, setLocale as setLocaleFn, translations } from '@/lib/i18n'

interface LanguageContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, params?: Record<string, string | number>) => string
  isRTL: boolean
}

const LanguageContext = createContext<LanguageContextType>({
  locale: 'en',
  setLocale: () => {},
  t: (key: string) => key,
  isRTL: false,
})

function applyDir(locale: Locale) {
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.lang = locale
}

function translate(locale: Locale, key: string, params?: Record<string, string | number>): string {
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

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')

  useEffect(() => {
    const saved = getLocale()
    applyDir(saved)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocaleState(saved)
  }, [])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleFn(newLocale)
    setLocaleState(newLocale)
    applyDir(newLocale)
  }, [])

  const t = useCallback((key: string, params?: Record<string, string | number>) => {
    return translate(locale, key, params)
  }, [locale])

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, isRTL: locale === 'ar' }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
