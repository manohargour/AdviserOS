import type { Metadata } from 'next'
import { PageContainer, PageHeader } from '@/components/shell/page-header'
import { ReportsList } from '@/components/reports/reports-list'
import { NewReportForm } from '@/components/reports/new-report-form'
import { getClients, requireUser } from '@/lib/workspace'
import { getReports } from '@/lib/reports'

export const metadata: Metadata = { title: 'Reports' }

export default async function ReportsPage() {
  const user = await requireUser()
  const [reports, clients] = await Promise.all([getReports(user.id), getClients(user.id)])
  const counts = {
    draft: reports.filter((r) => r.status === 'draft' || r.status === 'in_review').length,
    approved: reports.filter((r) => r.status === 'approved').length,
    sent: reports.filter((r) => r.status === 'sent').length,
  }

  return (
    <PageContainer>
      <PageHeader
        title="Reports"
        description={`${reports.length} saved · ${counts.draft} in progress · ${counts.approved} approved · ${counts.sent} sent`}
      >
        <NewReportForm clients={clients.map((c) => ({ id: c.id, name: c.name }))} />
      </PageHeader>
      <ReportsList
        reports={reports.map((r) => ({
          id: r.id,
          title: r.title,
          status: r.status,
          clientName: r.clientName ?? r.clientSlug,
          recipientEmail: r.recipientEmail,
          updatedAt: r.updatedAt.toISOString(),
        }))}
      />
    </PageContainer>
  )
}
