'use client'

import { useState, useTransition } from 'react'
import { ArrowRight, Check, CircleCheck, Loader2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAdviser, useReviewProgress } from '@/components/adviser/adviser-provider'
import { AllocationBar } from '@/components/clients/allocation-bar'
import { approveReview } from '@/app/actions/workspace'
import { cn } from '@/lib/utils'
import { allocation, gbp, type Client } from '@/lib/data'

export function ReviewWorkspace({
  client,
  initialApproved,
  approvedAt,
}: {
  client: Client
  initialApproved: boolean
  approvedAt: string | null
}) {
  const { confirmed, setConfirmed, send, isWorking } = useAdviser()
  const progress = useReviewProgress(client)
  const [approved, setApproved] = useState(initialApproved)
  const [saving, startSaving] = useTransition()
  const [saveError, setSaveError] = useState(false)
  const readiness = approved ? 100 : progress.readiness
  const remaining = approved ? 0 : progress.remaining

  function handleApprove() {
    setSaveError(false)
    const items = client.outstanding.filter((item) => confirmed[item.id]).map((item) => item.id)
    startSaving(async () => {
      try {
        await approveReview(client.id, items)
        setApproved(true)
      } catch (error) {
        console.error('[review] approve failed', error)
        setSaveError(true)
      }
    })
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-xl border bg-card p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Annual review · due {client.nextReview}
          </p>
          <h1 className="mt-1 font-serif text-3xl font-medium tracking-tight">{client.name}</h1>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-2 w-48 overflow-hidden rounded-full bg-muted" aria-hidden>
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${readiness}%` }} />
            </div>
            <p className="text-sm" aria-live="polite">
              <span className="font-semibold tabular-nums">{readiness}%</span> prepared
              {remaining > 0 && <span className="text-muted-foreground"> · {remaining} for your confirmation</span>}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-start gap-1.5 md:items-end">
          <Button
            size="lg"
            disabled={remaining > 0 || approved || saving}
            onClick={handleApprove}
            className={cn(approved && 'bg-positive disabled:opacity-100')}
          >
            {saving ? (
              <Loader2 aria-hidden className="animate-spin" />
            ) : approved ? (
              <CircleCheck aria-hidden />
            ) : (
              <ShieldCheck aria-hidden />
            )}
            {approved ? 'Review approved' : 'Approve review'}
          </Button>
          {approved && approvedAt && (
            <p className="text-xs text-muted-foreground">
              Approved {new Date(approvedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
          {saveError && (
            <p role="alert" className="text-xs text-destructive">
              Couldn&apos;t save the approval. Try again.
            </p>
          )}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <section aria-labelledby="changes-h" className="rounded-xl border bg-card p-5">
            <h2 id="changes-h" className="text-sm font-semibold">
              Changes since {client.lastReview}
            </h2>
            <ul className="mt-3 divide-y">
              {client.changes.map((c) => (
                <li key={c.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-medium">{c.title}</p>
                    {c.from && (
                      <p className="flex items-center gap-1.5 text-sm tabular-nums">
                        {c.from} <ArrowRight aria-label="to" className="size-3 text-muted-foreground" /> {c.to}
                      </p>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {c.detail} · {c.source}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="alloc-h" className="rounded-xl border bg-card p-5">
            <h2 id="alloc-h" className="mb-4 text-sm font-semibold">
              Current allocation · {gbp(client.portfolioValue)}
            </h2>
            <AllocationBar rows={allocation(client)} />
          </section>

          <section id="letter" aria-labelledby="letter-h" className="scroll-mt-6 rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 id="letter-h" className="text-sm font-semibold">
                Draft review letter
              </h2>
              <span className="text-xs text-muted-foreground">Prepared by AdviserOS · template v3.2</span>
            </div>
            <article className="mt-4 space-y-3 font-serif text-[15px] leading-relaxed">
              <p>Dear {client.firstName},</p>
              <p>
                Thank you for taking the time to review your financial plan with me. Since we last met in{' '}
                {client.lastReview}, your portfolio has grown from {gbp(client.previousValue)} to{' '}
                {gbp(client.portfolioValue)}.
              </p>
              <p>
                Your attitude to risk remains {client.risk.label} ({client.risk.score}/10), as confirmed by your{' '}
                {client.risk.tool} questionnaire completed {client.risk.assessedOn}.
              </p>
              <p className="rounded-md bg-warning-soft px-3 py-2 font-sans text-sm text-accent-foreground">
                Adviser recommendation required — AdviserOS does not draft advice.
              </p>
            </article>
          </section>
        </div>

        <aside className="space-y-6 lg:col-span-2">
          <section id="outstanding" aria-labelledby="outstanding-h" className="scroll-mt-6 rounded-xl border bg-card p-5">
            <h2 id="outstanding-h" className="text-sm font-semibold">
              Requires your confirmation
            </h2>
            <ul className="mt-3 space-y-3">
              {client.outstanding.map((item) => {
                const done = !!confirmed[item.id]
                return (
                  <li key={item.id} className={cn('rounded-lg border p-3 transition-colors', done && 'bg-positive-soft')}>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant={done ? 'ghost' : 'outline'}
                        onClick={() => setConfirmed(item.id, !done)}
                        aria-pressed={done}
                      >
                        {done && <Check aria-hidden className="text-positive" />}
                        {done ? 'Confirmed' : item.kind === 'client' ? 'Mark client confirmed' : 'Confirm'}
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>

          <section className="rounded-xl border bg-card p-5">
            <h2 className="text-sm font-semibold">Ask about this review</h2>
            <div className="mt-3 flex flex-col gap-2">
              {(client.id === 'john-smith'
                ? [
                    'Why did the equity allocation increase?',
                    'Where did the 69% equity number come from?',
                    'What information is missing?',
                  ]
                : [`What changed since ${client.firstName}'s last review?`, 'What information is missing?']
              ).map((p) => (
                <button
                  key={p}
                  type="button"
                  disabled={isWorking}
                  onClick={() => send(p)}
                  className="rounded-lg border bg-background px-3 py-2 text-left text-sm hover:bg-muted disabled:opacity-50"
                >
                  {p}
                </button>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
