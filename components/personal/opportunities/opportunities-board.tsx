'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight, Bookmark, BookmarkCheck } from 'lucide-react'
import type { Opportunity } from '@/lib/personal/insights'
import { AiMark, PageHeader, Panel, Pill, Segmented } from '@/components/personal/wealth/primitives'
import { cn } from '@/lib/utils'

const priorityTone = { High: 'warning', Medium: 'neutral', Low: 'positive' } as const

export function OpportunitiesBoard({ opportunities }: { opportunities: Opportunity[] }) {
  const [filter, setFilter] = useState<'All' | 'High priority' | 'Watchlist'>('All')
  const [watch, setWatch] = useState<string[]>([])

  const list = opportunities.filter((o) =>
    filter === 'High priority' ? o.priority === 'High' : filter === 'Watchlist' ? watch.includes(o.id) : true,
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Opportunities"
        title="Opportunities for your portfolio"
        description="Ways to improve your plan, derived from your own accounts, holdings and goals."
        actions={<Segmented options={['All', 'High priority', 'Watchlist'] as const} value={filter} onChange={setFilter} label="Filter opportunities" size="md" />}
      />

      <Panel className="flex items-start gap-3 border-ai/15 bg-ai-soft/40 p-4">
        <AiMark size="sm" />
        <p className="text-[13px] leading-relaxed text-pretty">
          These are observations about <strong className="font-semibold">your</strong> portfolio, not investment tips or regulated advice.
          Each one explains what it is based on so you can judge it yourself.
        </p>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-3">
        {list.map((o) => {
          const saved = watch.includes(o.id)
          return (
            <Panel key={o.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-[15px] font-semibold tracking-tight text-pretty">{o.title}</h2>
                  <p className="text-[12px] text-muted-foreground">{o.category}</p>
                </div>
                <Pill tone={priorityTone[o.priority]}>{o.priority}</Pill>
              </div>

              <p className="mt-3 text-[13px] text-muted-foreground text-pretty">{o.rationale}</p>

              <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-muted/60 p-3">
                <AiMark size="sm" className="bg-card" />
                <p className="text-[13px] leading-relaxed text-pretty">{o.action}</p>
              </div>

              <div className="mt-auto flex flex-wrap gap-2 pt-5">
                <Link
                  href={o.href}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-[13px] font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Review <ArrowRight className="size-3.5" aria-hidden />
                </Link>
                <button
                  type="button"
                  aria-pressed={saved}
                  onClick={() => setWatch((w) => (saved ? w.filter((x) => x !== o.id) : [...w, o.id]))}
                  className={cn('inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[13px] font-medium hover:bg-muted', saved && 'border-ai/30 text-ai-foreground')}
                >
                  {saved ? <BookmarkCheck className="size-3.5" aria-hidden /> : <Bookmark className="size-3.5" aria-hidden />}
                  {saved ? 'Watching' : 'Add to Watchlist'}
                </button>
              </div>
            </Panel>
          )
        })}
        {list.length === 0 ? (
          <Panel className="col-span-full p-10 text-center text-[13px] text-muted-foreground">
            {opportunities.length === 0 ? 'Add your accounts and holdings to see opportunities.' : 'Nothing on your watchlist yet.'}
          </Panel>
        ) : null}
      </div>
    </div>
  )
}
