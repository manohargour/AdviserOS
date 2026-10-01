import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { and, desc, eq } from 'drizzle-orm'
import { CheckCircle2, ChevronLeft, Clock } from 'lucide-react'
import { db } from '@/lib/db'
import { reportAcknowledgements } from '@/lib/db/schema'
import { PageContainer } from '@/components/shell/page-header'
import { ReviewReport } from '@/components/report/review-report'
import { PrintButton } from '@/components/report/print-button'
import { EmailReportButton } from '@/components/report/email-report-button'
import { DEMO_RECIPIENT_EMAIL, isDemoEmail } from '@/lib/demo-account'
import { getClientBySlug, getReviewForClient, requireUser } from '@/lib/workspace'

export const metadata: Metadata = { title: 'Annual review report' }

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireUser()
  const [client, review, [ack]] = await Promise.all([
    getClientBySlug(user.id, id),
    getReviewForClient(user.id, id),
    db
      .select({ acknowledgedAt: reportAcknowledgements.acknowledgedAt, acknowledgedName: reportAcknowledgements.acknowledgedName })
      .from(reportAcknowledgements)
      .where(and(eq(reportAcknowledgements.userId, user.id), eq(reportAcknowledgements.clientSlug, id)))
      .orderBy(desc(reportAcknowledgements.acknowledgedAt), desc(reportAcknowledgements.createdAt))
      .limit(1),
  ])
  if (!client) notFound()

  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Link
          href={`/reviews/${client.id}`}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft aria-hidden className="size-3.5" /> Back to review
        </Link>
        <div className="flex items-center gap-2">
          {ack &&
            (ack.acknowledgedAt ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                <CheckCircle2 aria-hidden className="size-3.5" />
                Client signed off {ack.acknowledgedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                <Clock aria-hidden className="size-3.5" />
                Awaiting client sign-off
              </span>
            ))}
          <EmailReportButton
            clientSlug={client.id}
            approved={review?.status === 'Approved'}
            defaultTo={isDemoEmail(user.email) ? DEMO_RECIPIENT_EMAIL : ''}
            defaultSubject={`Your annual review report — ${client.name}`}
            defaultMessage={`Dear ${client.firstName},\n\nPlease find attached your annual review report. It summarises your portfolio, how you're tracking against your goals, and my recommendations for the year ahead.\n\nKind regards,\n${user.name}`}
          />
          <PrintButton />
        </div>
      </div>
      <ReviewReport
        client={client}
        adviserName={user.name}
        status={review?.status ?? 'In progress'}
        approvedAt={review?.approvedAt?.toISOString() ?? null}
        letter={review?.letterDraft ?? null}
      />
    </PageContainer>
  )
}
