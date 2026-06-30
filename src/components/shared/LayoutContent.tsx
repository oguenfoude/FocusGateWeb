'use client'

import { useLanguage } from '@/components/language-provider'

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isRTL } = useLanguage()

  return (
    <div className={`flex-1 flex flex-col min-w-0 ${isRTL ? 'lg:mr-64' : 'lg:ml-64'}`}>
      {children}
    </div>
  )
}
