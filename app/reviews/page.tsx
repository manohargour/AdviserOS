import Link from 'next/link'
import type { Metadata } from 'next'
import { Sparkles } from 'lucide-react'
import { PageContainer, PageHeader } from '@/components/shell/page-header'
import { AskAdviserButton } from '@/components/adviser/ask-adviser-button'
import { cn } from '@/lib/utils'
import { getReviews, requireUser } from '@/lib/workspace'

export const metadata: Metadata = { title: 'Reviews' }

const statusTone: Record<string, string> = {
  Approved: 'text-positive',
  'Draft ready': 'text-positive',
  'In progress': 'text-foreground',
  'Awaiting data': 'text-warning',
  'Not started': 'text-muted-foreground',
}

export default async function ReviewsPage() {
  const user = await requireUser()
  const reviews = await getReviews(user.id)
  const ready = reviews.filter((r) => r.status === 'Draft ready').length
  const approved = reviews.filter((r) => r.status === 'Approved').length

  return (
    <PageContainer>
      <PageHeader
        title="Reviews"
        description={`${reviews.length} reviews due in October · ${ready} drafts ready · ${approved} approved`}
      >
        <AskAdviserButton prompt="Prepare all reviews due this week" variant="default" size="default">
          <Sparkles aria-hidden /> Prepare this week&apos;s reviews
        </AskAdviserButton>
      </PageHeader>
      <ul className="divide-y rounded-xl border bg-card">
        {reviews.map((r) => {
          const body = (
            <>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{r.name}</p>
                <p className="text-xs text-muted-foreground">Annual review · due {r.due}</p>
              </div>
              <div className="hidden w-40 items-center gap-2 sm:flex">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden>
                  <div className="h-full rounded-full bg-primary" style={{ width: `${r.readiness}%` }} />
                </div>
                <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">{r.readiness}%</span>
              </div>
              <span className={cn('w-24 text-right text-xs font-medium', statusTone[r.status])}>{r.status}</span>
            </>
          )
          return (
            <li key={r.id}>
              {r.clientSlug ? (
                <Link href={`/reviews/${r.clientSlug}`} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/40">
                  {body}
                </Link>
              ) : (
                <div className="flex items-center gap-4 px-4 py-3">{body}</div>
              )}
            </li>
          )
        })}
      </ul>
    </PageContainer>
  )
}
