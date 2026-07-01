import { connectDB } from '@/lib/mongodb'
import { SimCard } from '@/lib/models/SimCard'
import { BALANCE_WARN_THRESHOLD } from '@/lib/balance-alert'
import { PageHeader } from '@/components/shared/PageHeader'
import { WarningsContent } from '@/components/admin/WarningsContent'

export const dynamic = 'force-dynamic'

interface WarningItem {
  _id: number
  phoneNumber?: number
  balance: number
  modemId: number
}

export default async function AdminWarningsPage() {
  await connectDB()

  const warnings = (await SimCard.find({
    isActive: true,
    balance: { $gte: BALANCE_WARN_THRESHOLD },
    archivedAt: null
  }).lean()) as unknown as WarningItem[]

  return (
    <div className="space-y-6 max-w-[1400px]">
      <PageHeader
        titleKey="warnings.title"
        subtitleKey="warnings.subtitle"
        iconName="AlertTriangle"
        color="amber"
      />
      <WarningsContent warnings={warnings} />
    </div>
  )
}
