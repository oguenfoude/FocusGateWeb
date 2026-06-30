import { SmsList } from '@/components/dashboard/SmsList'
import { PageHeader } from '@/components/shared/PageHeader'

export default function DashboardSmsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        titleKey="sms.recentSms"
        subtitleKey="sms.lastSmsDescription"
        iconName="MessageSquare"
        color="blue"
      />
      <SmsList />
    </div>
  )
}
