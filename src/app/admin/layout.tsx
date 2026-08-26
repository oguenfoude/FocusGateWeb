'use client'

import { AppLayout } from '@/components/shared/AppLayout'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout requireAdmin>{children}</AppLayout>
}
