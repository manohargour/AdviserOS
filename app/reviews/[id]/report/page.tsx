import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ChevronLeft } from 'lucide-react'
import { PageContainer } from '@/components/shell/page-header'
import { ReviewReport } from '@/components/report/review-report'
import { PrintButton } from '@/components/report/print-button'
import { getClientBySlug, getReviewForClient, requireUser } from '@/lib/workspace'

export const metadata: Metadata = { title: 'Annual review report' }

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireUser()
  const [client, review] = await Promise.all([getClientBySlug(user.id, id), getReviewForClient(user.id, id)])
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
        <PrintButton />
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
