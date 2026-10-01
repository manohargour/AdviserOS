import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ChevronLeft } from 'lucide-react'
import { PageContainer } from '@/components/shell/page-header'
import { ReviewWorkspace } from '@/components/reviews/review-workspace'
import { clients, getClient } from '@/lib/data'

export function generateStaticParams() {
  return clients.map((c) => ({ id: c.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  return { title: `${getClient(id)?.name ?? 'Client'} · Annual review` }
}

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const client = getClient(id)
  if (!client) notFound()

  return (
    <PageContainer>
      <Link href="/reviews" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ChevronLeft aria-hidden className="size-3.5" /> Reviews
      </Link>
      <ReviewWorkspace clientId={client.id} />
    </PageContainer>
  )
}
