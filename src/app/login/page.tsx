'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/components/language-provider'
import { useSetUserId } from '@/components/user-id-provider'
import { toast } from 'sonner'
import { Lock, User, RadioTower, Globe } from 'lucide-react'
import { Locale } from '@/lib/i18n'

const LOCALES: { code: Locale; label: string; short: string }[] = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'fr', label: 'Français', short: 'FR' },
  { code: 'ar', label: 'العربية', short: 'عر' },
]

export default function LoginPage() {
  const { t, locale, setLocale, isRTL } = useLanguage()
  const setUserId = useSetUserId()
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      toast.error(t('auth.usernameRequired') || 'Username and Password are required')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || t('auth.loginError'))
      }

      toast.success('Signed in successfully!')
      setUserId(data.userId)
      localStorage.setItem('role', String(data.role))
      
      // Force page-reload or routing depending on role
      if (data.role === 0) {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('auth.loginError')
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50/50 relative overflow-hidden">
      {/* Decorative background blurs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-3xl -mr-40 -mt-40 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl -ml-40 -mb-40 pointer-events-none" />

      {/* Language Switcher */}
      <div className={`absolute top-4 flex items-center gap-2 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-gray-200/80 shadow-sm z-10 ${isRTL ? 'left-4' : 'right-4'}`}>
        <Globe className="h-4.5 w-4.5 text-gray-400" />
        <div className="flex gap-1">
          {LOCALES.map((l) => (
            <button
              key={l.code}
              onClick={() => setLocale(l.code)}
              className={`px-2 py-0.5 rounded text-xs font-bold transition-colors ${
                locale === l.code ? 'bg-brand-500 text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {l.short}
            </button>
          ))}
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md page-enter">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-gradient-to-br from-brand-400 to-brand-600 rounded-2xl flex items-center justify-center shadow-[0_4px_12px_rgba(20,184,166,0.3)] ring-4 ring-white">
            <RadioTower className="text-white h-6 w-6" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
          {t('auth.loginTitle')}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500 font-medium">
          {t('auth.loginSubtitle')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md page-enter delay-100">
        <div className="card card-body p-8 sm:rounded-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-bold text-gray-700 mb-2">
                {t('auth.username')}
              </label>
              <div className="relative">
                <div className={`absolute inset-y-0 flex items-center pointer-events-none ${isRTL ? 'right-0 pr-3.5' : 'left-0 pl-3.5'}`}>
                  <User className="h-4.5 w-4.5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`input w-full ${isRTL ? 'pr-10' : 'pl-10'}`}
                  placeholder={t('auth.username')}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-2">
                {t('auth.password')}
              </label>
              <div className="relative">
                <div className={`absolute inset-y-0 flex items-center pointer-events-none ${isRTL ? 'right-0 pr-3.5' : 'left-0 pl-3.5'}`}>
                  <Lock className="h-4.5 w-4.5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`input w-full ${isRTL ? 'pr-10' : 'pl-10'}`}
                  placeholder={t('auth.password')}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full justify-center py-2.5 shadow-[0_4px_14px_rgba(20,184,166,0.4)]"
              >
                {loading ? '...' : t('auth.loginButton')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
