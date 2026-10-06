'use client'

import Link from 'next/link'
import { useState } from 'react'
import { AlertTriangle, Brain, Coins, Globe2, TrendingUp, X } from 'lucide-react'
import type { Insight } from '@/lib/personal/insights'
import { PageHeader, Panel, Pill, Segmented } from '@/components/personal/wealth/primitives'
import { AskAiButton } from '@/components/personal/shell/ask-ai-button'
import { cn } from '@/lib/utils'

const icons = { Concentration: AlertTriangle, Goals: TrendingUp, Currency: Globe2, Tax: Coins, Cash: Brain } as const
const iconTone = {
  warning: 'bg-warning-soft text-warning',
  positive: 'bg-positive-soft text-positive',
  ai: 'bg-ai-soft text-ai',
  neutral: 'bg-muted text-foreground/70',
} as const

export function InsightsFeed({ insights }: { insights: Insight[] }) {
  const [dismissed, setDismissed] = useState<string[]>([])
  const [open, setOpen] = useState<string | null>(null)
  const [filter, setFilter] = useState<'All' | 'Risks' | 'Goals' | 'Tax'>('All')

  const shown = insights
    .filter((i) => !dismissed.includes(i.id))
    .filter((i) =>
      filter === 'All' ? true : filter === 'Risks' ? i.kind === 'warning' : filter === 'Goals' ? i.category === 'Goals' : i.category === 'Tax',
    )

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Insights"
        title="What to pay attention to"
        description="Computed from the accounts, holdings and goals you have entered."
        actions={<Segmented options={['All', 'Risks', 'Goals', 'Tax'] as const} value={filter} onChange={setFilter} label="Filter insights" size="md" />}
      />
      <ol className="flex flex-col gap-3" aria-live="polite">
        {shown.map((i) => {
          const Icon = icons[i.category as keyof typeof icons] ?? AlertTriangle
          const expanded = open === i.id
          return (
            <li key={i.id}>
              <Panel className="p-5">
                <div className="flex items-start gap-4">
                  <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl', iconTone[i.kind])}>
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-[15px] font-semibold tracking-tight">{i.title}</h2>
                      <Pill>{i.category}</Pill>
                    </div>
                    <p className="mt-1 text-[13px] text-muted-foreground text-pretty">{i.body}</p>
                    {expanded ? <p className="mt-3 rounded-xl bg-muted/60 p-3 text-[13px] leading-relaxed text-pretty">{i.explanation}</p> : null}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button type="button" aria-expanded={expanded} onClick={() => setOpen(expanded ? null : i.id)} className="inline-flex h-8 items-center rounded-lg border px-3 text-[13px] font-medium hover:bg-muted">
                        {expanded ? 'Hide explanation' : 'Explain'}
                      </button>
                      <AskAiButton question={`${i.title}: ${i.body} What should I do?`} />
                      <Link href={i.href} className="inline-flex h-8 items-center rounded-lg px-3 text-[13px] font-medium hover:bg-muted">
                        Take action
                      </Link>
                    </div>
                  </div>
                  <button type="button" onClick={() => setDismissed((xs) => [...xs, i.id])} className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted" aria-label={`Dismiss ${i.title}`}>
                    <X className="size-4" />
                  </button>
                </div>
              </Panel>
            </li>
          )
        })}
      </ol>
      {shown.length === 0 ? (
        <Panel className="p-10 text-center">
          <p className="text-[13px] font-medium">{insights.length === 0 ? 'Add your data to see insights' : "You're up to date"}</p>
          {dismissed.length > 0 ? (
            <button type="button" onClick={() => setDismissed([])} className="mt-2 text-[13px] text-muted-foreground underline underline-offset-2">Restore dismissed</button>
          ) : null}
        </Panel>
      ) : null}
    </div>
  )
}
