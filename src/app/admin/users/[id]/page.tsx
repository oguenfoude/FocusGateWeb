import { UserDetail } from '@/components/admin/UserDetail'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link 
          href="/admin/users"
          className="inline-flex items-center justify-center rounded-lg p-2 hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">User Details</h1>
          <p className="text-sm text-gray-500">View user wallet, SIM history, and SMS records.</p>
        </div>
      </div>
      
      <UserDetail userId={resolvedParams.id} />
    </div>
  )
}
