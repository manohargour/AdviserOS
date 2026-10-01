import Link from 'next/link'
import type { Metadata } from 'next'
import { Bot, UserRound } from 'lucide-react'
import { PageContainer, PageHeader } from '@/components/shell/page-header'
import { requireUser } from '@/lib/workspace'
import { formatWhen, getActivity } from '@/lib/activity'

export const metadata: Metadata = { title: 'Activity' }

export default async function ActivityPage() {
  const user = await requireUser()
  const events = await getActivity(user.id, { limit: 200 })

  return (
    <PageContainer>
      <PageHeader
        title="Activity"
        description="A record of every approval, task change and action AdviserOS took on your behalf."
      />
      {events.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-10 text-center">
          <p className="font-medium">No activity yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete a task, approve a review or ask AdviserOS to do something and it will be recorded here.
          </p>
        </div>
      ) : (
        <ol className="divide-y rounded-xl border bg-card">
          {events.map((e) => {
            const byAssistant = e.actor === 'assistant'
            const Icon = byAssistant ? Bot : UserRound
            return (
              <li key={e.id} className="flex items-start gap-3 px-4 py-3">
                <span
                  className={
                    byAssistant
                      ? 'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground'
                      : 'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground'
                  }
                >
                  <Icon aria-hidden className="size-3.5" />
                  <span className="sr-only">{byAssistant ? 'AdviserOS' : 'You'}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{e.summary}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {byAssistant ? 'AdviserOS' : 'You'}
                    {e.clientSlug && (
                      <>
                        {' · '}
                        <Link href={`/clients/${e.clientSlug}`} className="underline-offset-2 hover:underline">
                          View client
                        </Link>
                      </>
                    )}
                  </p>
                </div>
                <time
                  dateTime={e.createdAt.toISOString()}
                  className="shrink-0 text-xs tabular-nums text-muted-foreground"
                >
                  {formatWhen(e.createdAt)}
                </time>
              </li>
            )
          })}
        </ol>
      )}
    </PageContainer>
  )
}
