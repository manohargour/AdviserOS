import Link from 'next/link'
import type { Metadata } from 'next'
import { Sparkles } from 'lucide-react'
import { PageContainer, PageHeader } from '@/components/shell/page-header'
import { AskCopilotButton } from '@/components/copilot/ask-copilot-button'
import { cn } from '@/lib/utils'
import { reviewsDue } from '@/lib/data'

export const metadata: Metadata = { title: 'Reviews' }

const statusTone: Record<string, string> = {
  'Draft ready': 'text-positive',
  'In progress': 'text-foreground',
  'Awaiting data': 'text-warning',
  'Not started': 'text-muted-foreground',
}

export default function ReviewsPage() {
  const ready = reviewsDue.filter((r) => r.status === 'Draft ready').length
  return (
    <PageContainer>
      <PageHeader title="Reviews" description={`${reviewsDue.length} reviews due in October · ${ready} drafts ready for approval`}>
        <AskCopilotButton prompt="Prepare all reviews due this week" variant="default" size="default">
          <Sparkles aria-hidden /> Prepare this week&apos;s reviews
        </AskCopilotButton>
      </PageHeader>
      <ul className="divide-y rounded-xl border bg-card">
        {reviewsDue.map((r) => {
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
            <li key={r.name}>
              {r.clientId ? (
                <Link href={`/reviews/${r.clientId}`} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/40">
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
