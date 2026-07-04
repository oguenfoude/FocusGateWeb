'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/components/language-provider'

export default function Home() {
  const router = useRouter()
  const { t } = useLanguage()

  useEffect(() => {
    const userId = localStorage.getItem('userId')
    const role = localStorage.getItem('role')

    if (!userId) {
      router.push('/login')
    } else if (role === '0') {
      router.push('/admin')
    } else {
      router.push('/dashboard')
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-pulse text-sm text-gray-400">{t('common.loading')}</div>
    </div>
  )
}
