import { WithdrawForm } from '@/components/dashboard/WithdrawForm'
import { PageHeader } from '@/components/shared/PageHeader'

export default function DashboardWithdrawPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        titleKey="withdraw.title"
        subtitleKey="withdraw.subtitle"
        iconName="Banknote"
        color="amber"
      />
      <WithdrawForm />
    </div>
  )
}
