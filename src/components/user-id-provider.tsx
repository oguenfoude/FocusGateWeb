'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

interface UserIdContextValue {
  userId: string | null
  setUserId: (id: string) => void
  clearUserId: () => void
}

const UserIdContext = createContext<UserIdContextValue | null>(null)

export function UserIdProvider({ children }: { children: ReactNode }) {
  const [userId, setUserIdState] = useState<string | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('userId')
      if (stored) setUserIdState(stored)
    } catch {}
  }, [])

  const setUserId = useCallback((id: string) => {
    setUserIdState(id)
    try { localStorage.setItem('userId', id) } catch {}
  }, [])

  const clearUserId = useCallback(() => {
    setUserIdState(null)
    try { localStorage.removeItem('userId') } catch {}
  }, [])

  return (
    <UserIdContext.Provider value={{ userId, setUserId, clearUserId }}>
      {children}
    </UserIdContext.Provider>
  )
}

export function useUserId(): string | null {
  const ctx = useContext(UserIdContext)
  return ctx?.userId ?? null
}

export function useSetUserId() {
  const ctx = useContext(UserIdContext)
  if (!ctx) throw new Error('useSetUserId must be used within UserIdProvider')
  return ctx.setUserId
}
