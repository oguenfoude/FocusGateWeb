'use client'

import { LanguageProvider } from '@/components/language-provider'
import { UserIdProvider } from '@/components/user-id-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <UserIdProvider>
        {children}
      </UserIdProvider>
    </LanguageProvider>
  )
}
