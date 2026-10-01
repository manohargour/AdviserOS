import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ChevronLeft } from 'lucide-react'
import { PageContainer } from '@/components/shell/page-header'
import { ReviewReport } from '@/components/report/review-report'
import { ReportWorkflow } from '@/components/reports/report-workflow'
import { getClientBySlug, requireUser } from '@/lib/workspace'
import { getReport, getReportSends } from '@/lib/reports'
import { REPORT_STATUS_LABEL } from '@/lib/report-status'
import { isEmailConfigured } from '@/lib/email'

export const metadata: Metadata = { title: 'Report' }

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireUser()
  const report = await getReport(user.id, Number(id))
  if (!report) notFound()
  const [client, sends] = await Promise.all([getClientBySlug(user.id, report.clientSlug), getReportSends(user.id, report.id)])
  if (!client) notFound()

  return (
    <PageContainer>
      <Link href="/reports" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground print:hidden">
        <ChevronLeft aria-hidden className="size-3.5" /> All reports
      </Link>
      <div className="print:hidden">
        <ReportWorkflow
          report={{
            id: report.id,
            title: report.title,
            status: report.status,
            coverNote: report.coverNote ?? '',
            letter: report.letter ?? '',
            recipientEmail: report.recipientEmail ?? '',
            submittedAt: report.submittedAt?.toISOString() ?? null,
            approvedAt: report.approvedAt?.toISOString() ?? null,
            sentAt: report.sentAt?.toISOString() ?? null,
          }}
          clientName={client.name}
          clientFirstName={client.firstName}
          adviserName={user.name}
          emailConfigured={isEmailConfigured()}
          sends={sends.map((s) => ({
            id: s.id,
            toEmail: s.toEmail,
            status: s.status,
            error: s.error,
            createdAt: s.createdAt.toISOString(),
          }))}
        />
      </div>
      {report.coverNote && (
        <section aria-label="Cover note" className="mx-auto max-w-4xl whitespace-pre-line font-serif text-base leading-relaxed">
          {report.coverNote}
        </section>
      )}
      <ReviewReport
        client={client}
        adviserName={user.name}
        status={REPORT_STATUS_LABEL[report.status]}
        approvedAt={report.approvedAt?.toISOString() ?? null}
        letter={report.letter}
      />
    </PageContainer>
  )
}
