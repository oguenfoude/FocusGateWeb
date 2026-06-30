import { UserTable } from '@/components/admin/UserTable'
import { PageHeader } from '@/components/shared/PageHeader'

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        titleKey="users.title"
        subtitleKey="users.subtitle"
        iconName="Users"
        color="purple"
      />
      <UserTable />
    </div>
  )
}
