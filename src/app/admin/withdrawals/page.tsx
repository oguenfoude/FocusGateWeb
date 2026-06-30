import { WithdrawalTable } from '@/components/admin/WithdrawalTable'
import { PageHeader } from '@/components/shared/PageHeader'

export default function AdminWithdrawalsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        titleKey="withdrawals.title"
        subtitleKey="withdrawals.subtitle"
        iconName="Banknote"
        color="amber"
      />
      <WithdrawalTable />
    </div>
  )
}
