'use client'

import { createContext, useContext, useState, ReactNode, useCallback } from 'react'

interface MobileMenuContextType {
  isOpen: boolean
  toggle: () => void
  close: () => void
}

const Ctx = createContext<MobileMenuContextType>({
  isOpen: false,
  toggle: () => {},
  close: () => {},
})

export function MobileMenuProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const toggle = useCallback(() => setIsOpen(prev => !prev), [])
  const close = useCallback(() => setIsOpen(false), [])

  return (
    <Ctx.Provider value={{ isOpen, toggle, close }}>
      {children}
    </Ctx.Provider>
  )
}

export function useMobileMenu() {
  return useContext(Ctx)
}
