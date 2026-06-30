import { HistoryList } from '@/components/dashboard/HistoryList'
import { PageHeader } from '@/components/shared/PageHeader'

export default function DashboardHistoryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        titleKey="history.title"
        subtitleKey="history.subtitle"
        iconName="History"
        color="purple"
      />
      <HistoryList />
    </div>
  )
}
