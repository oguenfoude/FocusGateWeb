'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface UserIdContextValue {
  userId: string | null
  setUserId: (id: string) => void
  clearUserId: () => void
}

const UserIdContext = createContext<UserIdContextValue | null>(null)

function getInitialUserId(): string | null {
  if (typeof window === 'undefined') return null
  try { return localStorage.getItem('userId') } catch { return null }
}

export function UserIdProvider({ children }: { children: ReactNode }) {
  const [userId, setUserIdState] = useState<string | null>(getInitialUserId)

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
