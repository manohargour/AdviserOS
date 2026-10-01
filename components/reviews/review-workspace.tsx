'use client'

import { useState } from 'react'
import { ArrowRight, Check, CircleCheck, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCopilot, useReviewProgress } from '@/components/copilot/copilot-provider'
import { AllocationBar } from '@/components/clients/allocation-bar'
import { cn } from '@/lib/utils'
import { allocation, gbp, getClient } from '@/lib/data'

export function ReviewWorkspace({ clientId }: { clientId: string }) {
  const client = getClient(clientId)!
  const { confirmed, setConfirmed, send, isWorking } = useCopilot()
  const { readiness, remaining } = useReviewProgress(client)
  const [approved, setApproved] = useState(false)

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
        <Button
          size="lg"
          disabled={remaining > 0 || approved}
          onClick={() => setApproved(true)}
          className={cn(approved && 'bg-positive disabled:opacity-100')}
        >
          {approved ? <CircleCheck aria-hidden /> : <ShieldCheck aria-hidden />}
          {approved ? 'Review approved' : 'Approve review'}
        </Button>
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
