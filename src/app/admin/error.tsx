'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Admin panel error:', error)
  }, [error])

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center">
      <h2 className="text-xl font-semibold text-red-600 mb-2">Admin panel error</h2>
      <p className="text-gray-600 mb-4">{error.message || 'Unexpected error'}</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Try again
      </button>
    </div>
  )
}
