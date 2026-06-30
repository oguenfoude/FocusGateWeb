import { SmsTable } from '@/components/admin/SmsTable'
import { PageHeader } from '@/components/shared/PageHeader'

export default function AdminSmsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        titleKey="sms.title"
        subtitleKey="sms.subtitle"
        iconName="MessageSquare"
        color="blue"
      />
      <SmsTable />
    </div>
  )
}
