'use client'

import { signIn } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { RadioTower, Globe } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { Locale, setLocale as setLocaleFn } from '@/lib/i18n'

const LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'ar', label: 'العربية', flag: '🇩🇿' },
]

export default function LoginPage() {
  const router = useRouter()
  const { t, locale } = useLanguage()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showLangMenu, setShowLangMenu] = useState(false)

  useEffect(() => {
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = locale
  }, [locale])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await signIn('credentials', {
        username,
        password,
        redirect: false
      })
      if (res?.error) {
        toast.error(t('auth.loginError'))
      } else {
        toast.success(t('auth.login'))
        const sessionRes = await fetch('/api/auth/session')
        const session = await sessionRes.json()
        const dest = session?.user?.role === 'admin' ? '/admin' : '/dashboard'
        router.replace(dest)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLocaleChange = (newLocale: Locale) => {
    setLocaleFn(newLocale)
    setShowLangMenu(false)
    window.location.reload()
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
      {/* Language Switcher */}
      <div className="fixed top-4 right-4 z-50">
        <div className="relative">
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Globe className="h-4 w-4" />
            {LOCALES.find(l => l.code === locale)?.flag}
          </button>
          {showLangMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowLangMenu(false)} />
              <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                {LOCALES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => handleLocaleChange(l.code)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${
                      locale === l.code
                        ? 'bg-emerald-50 text-emerald-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-base">{l.flag}</span>
                    <span>{l.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <div className="mb-8 text-center">
            <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <RadioTower className="h-7 w-7 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t('auth.loginTitle')}</h1>
            <p className="text-sm text-gray-500 mt-2">{t('auth.loginSubtitle')}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="username">{t('auth.username')}</label>
              <input
                id="username"
                type="text"
                required
                className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="password">{t('auth.password')}</label>
              <input
                id="password"
                type="password"
                required
                className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            >
              {loading ? t('common.loading') : t('auth.loginButton')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
