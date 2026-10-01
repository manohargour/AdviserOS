import type { Metadata } from 'next'
import { PageContainer, PageHeader } from '@/components/shell/page-header'
import { AlertList } from '@/components/alerts/alert-list'
import { getAlerts, requireUser } from '@/lib/workspace'

export const metadata: Metadata = { title: 'Alerts' }

export default async function AlertsPage() {
  const user = await requireUser()
  const alerts = await getAlerts(user.id)

  return (
    <PageContainer>
      <PageHeader title="Alerts" description="Detected by AdviserOS across your connected systems" />
      <AlertList
        alerts={alerts.map(({ id, title, client, clientSlug, severity, time }) => ({
          id,
          title,
          client,
          clientSlug,
          severity,
          time,
        }))}
      />
    </PageContainer>
  )
}
