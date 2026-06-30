import { ModemTable } from '@/components/admin/ModemTable'
import { PageHeader } from '@/components/shared/PageHeader'

export default function AdminModemsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        titleKey="modems.title"
        subtitleKey="modems.subtitle"
        iconName="Router"
        color="emerald"
      />
      <ModemTable />
    </div>
  )
}
