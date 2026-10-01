import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ChevronLeft } from 'lucide-react'
import { PageContainer } from '@/components/shell/page-header'
import { ReviewWorkspace } from '@/components/reviews/review-workspace'
import { getClientBySlug, getReviewForClient, requireUser } from '@/lib/workspace'

export const metadata: Metadata = { title: 'Annual review' }

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireUser()
  const [client, review] = await Promise.all([getClientBySlug(user.id, id), getReviewForClient(user.id, id)])
  if (!client) notFound()

  return (
    <PageContainer>
      <Link href="/reviews" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ChevronLeft aria-hidden className="size-3.5" /> Reviews
      </Link>
      <ReviewWorkspace
        client={client}
        initialApproved={review?.status === 'Approved'}
        approvedAt={review?.approvedAt?.toISOString() ?? null}
      />
    </PageContainer>
  )
}
