'use client'

import { useLanguage } from '@/components/language-provider'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { KeyRound, User, Settings, Pencil } from 'lucide-react'

export default function SettingsPage() {
  const { t } = useLanguage()
  const [adminId, setAdminId] = useState<string | null>(null)
  const [adminName, setAdminName] = useState('admin')
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loadingUsername, setLoadingUsername] = useState(false)
  const [loadingPassword, setLoadingPassword] = useState(false)

  useEffect(() => {
    fetch('/api/admin/users?includeAdmin=true')
      .then(r => r.json())
      .then(data => {
        const users = Array.isArray(data) ? data : data.users || []
        const admin = users.find((u: { role?: number }) => u.role === 0)
        if (admin) {
          setAdminId(String(admin._id))
          const name = admin.displayName || admin.username || 'admin'
          setAdminName(name)
        }
      })
      .catch(() => {})
  }, [])

  const handleChangeUsername = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adminId) {
      toast.error(t('settings.adminNotFound'))
      return
    }
    if (!newUsername.trim()) {
      toast.error(t('settings.usernameRequired'))
      return
    }
    setLoadingUsername(true)
    try {
      const payload = { action: 'edit', username: newUsername.trim() }

      const res = await fetch('/api/admin/users/' + adminId, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.ok) {
        toast.success(t('settings.usernameUpdated'))
        setAdminName(newUsername.trim())
        setNewUsername('')
      } else {
        toast.error(data.error || t('settings.usernameFailed'))
      }
    } catch {
      toast.error(t('settings.usernameFailed'))
    } finally {
      setLoadingUsername(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error(t('settings.passwordMismatch'))
      return
    }
    if (!newPassword) {
      toast.error(t('settings.passwordRequired'))
      return
    }
    if (!adminId) {
      toast.error(t('settings.adminNotFound'))
      return
    }
    setLoadingPassword(true)
    try {
      const payload = { action: 'edit', password: newPassword }

      const res = await fetch('/api/admin/users/' + adminId, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.ok) {
        toast.success(t('settings.passwordUpdated'))
        setNewPassword('')
        setConfirmPassword('')
      } else {
        toast.error(data.error || t('settings.passwordFailed'))
      }
    } catch {
      toast.error(t('settings.passwordFailed'))
    } finally {
      setLoadingPassword(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-xl shadow-inner border border-emerald-100/50">
          <Settings className="h-6 w-6 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('settings.title')}</h1>
          <p className="text-sm text-gray-500 font-medium">{t('settings.subtitle')}</p>
        </div>
      </div>

      <div className="card card-body p-6 page-enter delay-100">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-brand-50 rounded-lg">
            <User className="h-5 w-5 text-brand-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 tracking-tight">{t('settings.adminAccount')}</h3>
        </div>
        <div className="flex items-center gap-4 bg-gray-50/50 rounded-xl p-4 border border-gray-100">
          <div className="w-14 h-14 bg-gradient-to-br from-brand-100 to-brand-50 text-brand-600 rounded-2xl flex items-center justify-center text-xl font-bold shadow-sm border border-brand-100/50">
            {adminName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-base font-bold text-gray-900 tracking-tight">{adminName}</p>
            <p className="text-sm text-gray-500 font-medium">{t('settings.administrator')}</p>
          </div>
          <span className="badge badge-purple ml-auto shadow-sm">
            Admin
          </span>
        </div>
      </div>

      <div className="card card-body p-6 delay-200">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Pencil className="h-5 w-5 text-blue-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 tracking-tight">{t('settings.changeUsername')}</h3>
        </div>
        <form onSubmit={handleChangeUsername} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">{t('settings.currentUsername')}</label>
            <input
              type="text"
              value={adminName}
              disabled
              className="input w-full bg-gray-50 text-gray-400 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">{t('settings.newUsername')}</label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="input w-full"
              placeholder={t('settings.newUsernamePlaceholder')}
              required
            />
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loadingUsername}
              className="btn btn-primary min-w-[120px] justify-center bg-blue-600 hover:bg-blue-700 shadow-blue-600/20"
            >
              {loadingUsername ? t('settings.saving') : t('settings.updateUsername')}
            </button>
          </div>
        </form>
      </div>

      <div className="card card-body p-6 delay-300">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-amber-50 rounded-lg">
            <KeyRound className="h-5 w-5 text-amber-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 tracking-tight">{t('settings.changePassword')}</h3>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">{t('settings.newPassword')}</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input w-full"
              placeholder={t('settings.newPasswordPlaceholder')}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">{t('settings.confirmPassword')}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input w-full"
              placeholder={t('settings.confirmPasswordPlaceholder')}
              required
            />
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loadingPassword}
              className="btn btn-primary min-w-[120px] justify-center"
            >
              {loadingPassword ? t('settings.saving') : t('settings.updatePassword')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
