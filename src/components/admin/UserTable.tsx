'use client'

import useSWR, { mutate } from 'swr'
import Link from 'next/link'
import { useState } from 'react'
import { Search, Plus, Trash2, Eye, X, Loader2, Edit2, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/components/language-provider'


const fetcher = (url: string) => fetch(url).then(r => r.json())

interface UserRowType {
  _id: string
  username: string
  displayName?: string
  role: number
  assignedModemsCount: number
  balance: number
  archivedAt?: string | null
}

export function UserTable() {
  const { t, locale } = useLanguage()
  const loc = locale === 'fr' ? 'fr-FR' : locale === 'ar' ? 'ar-DZ' : 'en-US'
  const [searchTerm, setSearchTerm] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [archivingId, setArchivingId] = useState<string | null>(null)
  const [restoringId, setRestoringId] = useState<string | null>(null)
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editDisplayName, setEditDisplayName] = useState('')
  const [editPassword, setEditPassword] = useState('')

  const { data, error, isLoading } = useSWR<UserRowType[]>(
    `/api/admin/users?showArchived=${showArchived}`,
    fetcher
  )

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      toast.error(t('users.usernameRequired'))
      return
    }

    try {
      setIsSubmitting(true)
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, displayName }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || t('users.createFailed'))
      }

      toast.success(t('users.userCreated'))
      setIsModalOpen(false)
      setUsername('')
      setPassword('')
      setDisplayName('')
      mutate(`/api/admin/users?showArchived=${showArchived}`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('users.somethingWentWrong')
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleArchiveUser = async (userId: string, uname: string) => {
    if (!confirm(t('users.confirmArchive', { name: uname }))) return

    try {
      setArchivingId(userId)
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'archive' }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || t('users.archiveFailed'))
      }

      toast.success(t('users.userArchived', { name: uname }))
      mutate(`/api/admin/users?showArchived=${showArchived}`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('users.somethingWentWrong')
      toast.error(message)
    } finally {
      setArchivingId(null)
    }
  }

  const handleRestoreUser = async (userId: string, uname: string) => {
    try {
      setRestoringId(userId)
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore' }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || t('users.restoreFailed'))
      }

      toast.success(t('users.userRestored', { name: uname }))
      mutate(`/api/admin/users?showArchived=${showArchived}`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('users.somethingWentWrong')
      toast.error(message)
    } finally {
      setRestoringId(null)
    }
  }

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUserId) return

    try {
      setIsSubmitting(true)
      const res = await fetch(`/api/admin/users/${editingUserId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'edit', displayName: editDisplayName, password: editPassword || undefined }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || t('users.failedToUpdate'))
      }

      toast.success(t('users.userUpdated'))
      setIsEditModalOpen(false)
      mutate(`/api/admin/users?showArchived=${showArchived}`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('users.somethingWentWrong')
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditModal = (user: UserRowType) => {
    setEditingUserId(user._id)
    setEditDisplayName(user.displayName || '')
    setEditPassword('')
    setIsEditModalOpen(true)
  }

  if (isLoading) return <div className="p-8 text-center text-gray-400 animate-pulse">{t('users.loading')}</div>
  if (error) return <div className="p-8 text-center text-red-500">{t('users.failedToLoad')}</div>

  const filtered = (data || []).filter((user) => {
    const query = searchTerm.toLowerCase()
    return (
      user.username.toLowerCase().includes(query) ||
      (user.displayName || '').toLowerCase().includes(query)
    )
  })

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-gray-400 font-medium">{t('users.count', { count: data?.length || 0 })}</p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              id="searchInput"
              type="text"
              placeholder={t('common.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-9 text-sm"
            />
          </div>
          <div className="flex items-center gap-3 justify-between sm:justify-start">
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 cursor-pointer select-none">
              <input
                id="showArchived"
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              {t('users.archived')}
            </label>
            <button onClick={() => setIsModalOpen(true)} className="btn btn-primary btn-sm h-[36px]">
              <Plus className="h-4 w-4" /> {t('users.addUser')}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block card page-enter delay-100">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-start border-collapse">
            <thead className="border-b border-gray-200/50">
              <tr>
                <th className="px-5 py-4 text-start text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('users.user')}</th>
                <th className="px-5 py-4 text-start text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('users.role')}</th>
                <th className="px-5 py-4 text-start text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('users.detail.balance')}</th>
                <th className="px-5 py-4 text-start text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('users.modems')}</th>
                <th className="px-5 py-4 text-start text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('users.status')}</th>
                <th className="px-5 py-4 text-end text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('users.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length > 0 ? (
                filtered.map((user: UserRowType) => {
                  const nameStr = user.displayName || user.username
                  const initials = nameStr.length >= 1 ? nameStr[0].toUpperCase() : 'U'
                  const isArchived = !!user.archivedAt

                  return (
                    <tr key={user._id} className={`table-row-hover ${isArchived ? 'opacity-50' : ''}`}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-100 to-brand-50 text-brand-600 flex items-center justify-center font-bold text-xs shadow-inner border border-brand-100/50">{initials}</div>
                          <div>
                            <div className="font-bold text-sm text-gray-900 tracking-tight">{nameStr}</div>
                            <div className="font-mono text-[10px] text-gray-400 mt-0.5">{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs">
                        {user.role === 0 ? <span className="badge badge-purple">{t('users.detail.admin')}</span> : <span className="badge badge-gray">{t('users.detail.user')}</span>}
                      </td>
                      <td className="px-5 py-4 text-gray-600 font-bold text-sm">{user.balance.toLocaleString(loc, { minimumFractionDigits: 2 })} DA</td>
                      <td className="px-5 py-4 text-gray-500 font-medium text-xs">
                        <span className="badge badge-info">{user.assignedModemsCount} {t('users.assigned')}</span>
                      </td>
                      <td className="px-5 py-4 text-xs">
                        {isArchived ? <span className="badge badge-gray">{t('users.archived')}</span> : <span className="badge badge-success"><span className="pulse-dot" />{t('users.active')}</span>}
                      </td>
                      <td className="px-5 py-4 text-end">
                        <div className="flex justify-end gap-1.5">
                          <Link href={`/admin/users/${user._id}`} className="btn btn-outline btn-sm" title={t('users.viewDetails')}><Eye className="h-3.5 w-3.5" /></Link>
                          {!isArchived ? (
                            <>
                              <button onClick={() => openEditModal(user)} className="btn btn-outline btn-sm" title={t('users.editUser')}>
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleArchiveUser(user._id, user.username)}
                                disabled={archivingId === user._id}
                                className="btn btn-outline btn-sm text-red-500 hover:text-red-600 hover:border-red-200"
                                title={t('users.archiveUser')}
                              >
                                {archivingId === user._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleRestoreUser(user._id, user.username)}
                              disabled={restoringId === user._id}
                              className="btn btn-outline btn-sm text-emerald-600 hover:text-white hover:bg-emerald-500 hover:border-emerald-500"
                              title={t('users.restore')}
                            >
                              {restoringId === user._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400 text-xs">{t('users.noUsersFound')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {filtered.length > 0 ? (
          filtered.map((user: UserRowType) => {
            const nameStr = user.displayName || user.username
            const initials = nameStr.length >= 1 ? nameStr[0].toUpperCase() : 'U'
            const isArchived = !!user.archivedAt

            return (
              <div key={user._id} className={`card card-body p-4 page-enter delay-200 ${isArchived ? 'opacity-50' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-sm">{initials}</div>
                    <div>
                      <p className="font-bold text-sm text-gray-900">{nameStr}</p>
                      <p className="text-[11px] text-gray-400">@{user.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isArchived ? <span className="badge badge-gray">{t('users.archived')}</span> : <span className="badge badge-success"><span className="pulse-dot" />{t('users.active')}</span>}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4">
                    <span className="text-gray-400">{user.role === 0 ? t('users.detail.admin') : t('users.detail.user')}</span>
                    <span className="font-medium text-gray-700">{user.assignedModemsCount} {t('users.modems')}</span>
                  </div>
                  <span className="font-bold text-gray-900">{user.balance.toLocaleString(loc)} DA</span>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                  <Link href={`/admin/users/${user._id}`} className="btn btn-outline btn-sm flex-1 justify-center h-[32px]">
                    <Eye className="h-3.5 w-3.5" /> {t('common.view')}
                  </Link>
                  {!isArchived ? (
                    <>
                      <button onClick={() => openEditModal(user)} className="btn btn-outline btn-sm flex-1 justify-center h-[32px]" title={t('users.editUser')}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleArchiveUser(user._id, user.username)}
                        disabled={archivingId === user._id}
                        className="btn btn-outline btn-sm text-red-500 hover:text-red-600 hover:border-red-200 h-[32px] flex-1 justify-center"
                      >
                        {archivingId === user._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleRestoreUser(user._id, user.username)}
                      disabled={restoringId === user._id}
                      className="btn btn-outline btn-sm text-emerald-600 hover:text-white hover:bg-emerald-500 hover:border-emerald-500 h-[32px] flex-1 justify-center"
                    >
                      {restoringId === user._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </div>
              </div>
            )
          })
        ) : (
          <div className="card card-body text-center text-gray-400 text-xs py-10">{t('users.noUsersFound')}</div>
        )}
      </div>

      {/* Add User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-md bg-white shadow-2xl">
            <div className="card-header flex items-center justify-between border-b">
              <h4 className="font-bold text-gray-900">{t('users.createUser')}</h4>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="card-body space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{t('users.username')} *</label>
                  <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} placeholder={t('users.enterUsername')} className="input" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{t('users.displayName')}</label>
                  <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={t('users.enterDisplayName')} className="input" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{t('users.password')} *</label>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('users.enterPassword')} className="input" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 p-4 border-t bg-gray-50/50">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline btn-sm">{t('common.cancel')}</button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-sm min-w-[100px] flex justify-center h-[32px]">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('users.createUser')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-md bg-white shadow-2xl">
            <div className="card-header flex items-center justify-between border-b">
              <h4 className="font-bold text-gray-900">{t('users.editUser')}</h4>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleEditUserSubmit}>
              <div className="card-body space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{t('users.displayName')}</label>
                  <input type="text" value={editDisplayName} onChange={(e) => setEditDisplayName(e.target.value)} placeholder={t('users.enterDisplayName')} className="input" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{t('users.newPasswordOptional')}</label>
                  <input type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder={t('users.leaveBlank')} className="input" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 p-4 border-t bg-gray-50/50">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn btn-outline btn-sm">{t('common.cancel')}</button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-sm min-w-[100px] flex justify-center h-[32px]">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('users.saveChanges')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
