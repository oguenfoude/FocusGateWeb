'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

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
      <div className="animate-pulse text-sm text-gray-400">Loading...</div>
    </div>
  )
}
