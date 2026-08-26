'use client'

import { useEffect } from 'react'
import { useLanguage } from '@/components/language-provider'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { t } = useLanguage()

  useEffect(() => {
    console.error('Admin panel error:', error)
  }, [error])

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center">
      <h2 className="text-xl font-semibold text-red-600 mb-2">{t('common.adminPanelError')}</h2>
      <p className="text-gray-600 mb-4">{error.message || t('common.unexpectedError')}</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {t('common.tryAgain')}
      </button>
    </div>
  )
}
