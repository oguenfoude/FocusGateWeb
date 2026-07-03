'use client'

import { useLanguage } from '@/components/language-provider'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { KeyRound, User, Settings } from 'lucide-react'

export default function SettingsPage() {
  const { t } = useLanguage()
  const [adminId, setAdminId] = useState<string | null>(null)
  const [adminName, setAdminName] = useState('admin')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(data => {
        const users = Array.isArray(data) ? data : data.users || []
        const admin = users.find((u: { role?: string }) => u.role === 'admin')
        if (admin) {
          setAdminId(String(admin._id))
          setAdminName(admin.displayName || admin.username || 'admin')
        }
      })
      .catch(() => {})
  }, [])

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error(t('settings.confirmPassword') + ' mismatch')
      return
    }
    if (!newPassword) {
      toast.error('New password is required')
      return
    }
    if (!adminId) {
      toast.error('Admin account not found')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users/' + adminId, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'edit', password: newPassword }),
      })
      const data = await res.json()
      if (data.ok) {
        toast.success('Password updated successfully')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        toast.error(data.error || 'Failed to update password')
      }
    } catch {
      toast.error('Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-emerald-50 rounded-lg">
          <Settings className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t('settings.title')}</h1>
          <p className="text-sm text-gray-500">{t('settings.subtitle')}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <User className="h-5 w-5 text-brand-500" />
          <h3 className="text-sm font-semibold text-gray-900">Admin Account</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center text-lg font-bold">
            {adminName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{adminName}</p>
            <p className="text-xs text-gray-400">Administrator</p>
          </div>
          <span className="ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
            Admin
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <KeyRound className="h-5 w-5 text-amber-500" />
          <h3 className="text-sm font-semibold text-gray-900">{t('settings.changePassword')}</h3>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t('settings.newPassword')}</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t('settings.confirmPassword')}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : t('settings.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
