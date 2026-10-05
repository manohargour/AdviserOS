'use client'

import Link from 'next/link'
import { useState } from 'react'
import { BarChart3, Bookmark, BookmarkCheck, GitCompare } from 'lucide-react'
import { opportunities } from '@/lib/personal/data'
import { AiMark, PageHeader, Panel, Pill, Segmented } from '@/components/personal/wealth/primitives'
import { cn } from '@/lib/utils'

const fitTone = { High: 'positive', Medium: 'neutral', Low: 'warning' } as const
const overlapTone = (v: string) => (v === 'High' ? 'negative' : v === 'Low' ? 'positive' : 'neutral')

const compareRows: Record<string, { label: string; now: string; after: string }[]> = {
  'global-small-cap': [
    { label: 'Holdings count', now: '~4,100 look-through', after: '~7,000' },
    { label: 'Top-10 company weight', now: '38%', after: '35%' },
    { label: 'Tech exposure', now: '41%', after: '40%' },
  ],
  gilts: [
    { label: 'GBP assets', now: '29%', after: '33%' },
    { label: 'Home goal volatility', now: '8.1%', after: '4.6%' },
    { label: 'Expected return (home)', now: '3.8%', after: '3.9%' },
  ],
  'india-equity': [
    { label: 'India exposure', now: '17%', after: '19%' },
    { label: 'INR assets', now: '16%', after: '18%' },
    { label: 'UK tax drag', now: '0.4%', after: '0.7%' },
  ],
}

export function OpportunitiesBoard() {
  const [filter, setFilter] = useState<'All' | 'High fit' | 'Watchlist'>('All')
  const [watch, setWatch] = useState<string[]>([])
  const [comparing, setComparing] = useState<string | null>(null)

  const list = opportunities.filter((o) => (filter === 'High fit' ? o.fit === 'High' : filter === 'Watchlist' ? watch.includes(o.id) : true))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Opportunities"
        title="Opportunities for Your Portfolio"
        description="Investments and strategies evaluated against your goals and current exposure."
        actions={<Segmented options={['All', 'High fit', 'Watchlist'] as const} value={filter} onChange={setFilter} label="Filter opportunities" size="md" />}
      />

      <Panel className="flex items-start gap-3 border-ai/15 bg-ai-soft/40 p-4">
        <AiMark size="sm" />
        <p className="text-[13px] leading-relaxed text-pretty">
          These aren&apos;t tips. Each idea is scored on how it changes <strong className="font-semibold">your</strong> portfolio: what it adds, what it
          duplicates, and which goal it serves. Low-fit ideas are shown so you can see why.
        </p>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-3">
        {list.map((o) => {
          const saved = watch.includes(o.id)
          const open = comparing === o.id
          return (
            <Panel key={o.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-[15px] font-semibold tracking-tight">{o.name}</h2>
                  <p className="font-mono text-[11px] text-muted-foreground">{o.ticker}</p>
                </div>
                <Pill tone={fitTone[o.fit]}>Portfolio fit: {o.fit}</Pill>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-[12px]">
                <div><dt className="text-muted-foreground">Diversification</dt><dd className="font-medium">{o.diversification}</dd></div>
                <div><dt className="text-muted-foreground">Goal alignment</dt><dd className="font-medium">{o.goal}</dd></div>
                <div><dt className="text-muted-foreground">Existing overlap</dt><dd><Pill tone={overlapTone(o.overlap)}>{o.overlap}</Pill></dd></div>
                <div><dt className="text-muted-foreground">Risk</dt><dd className="font-medium">{o.risk}</dd></div>
              </dl>

              <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-muted/60 p-3">
                <AiMark size="sm" className="bg-card" />
                <p className="text-[13px] leading-relaxed text-pretty">{o.explanation}</p>
              </div>

              {open ? (
                <table className="mt-4 w-full text-[12px]">
                  <caption className="sr-only">Portfolio comparison for {o.name}</caption>
                  <thead className="text-muted-foreground">
                    <tr><th className="pb-1.5 text-left font-medium">Metric</th><th className="pb-1.5 text-right font-medium">Now</th><th className="pb-1.5 text-right font-medium">With £10K</th></tr>
                  </thead>
                  <tbody className="divide-y">
                    {compareRows[o.id]?.map((r) => (
                      <tr key={r.label}><td className="py-1.5">{r.label}</td><td className="num py-1.5 text-right text-muted-foreground">{r.now}</td><td className="num py-1.5 text-right font-medium">{r.after}</td></tr>
                    ))}
                  </tbody>
                </table>
              ) : null}

              <div className="mt-auto flex flex-wrap gap-2 pt-5">
                <Link
                  href={`/me/opportunities/${o.ticker.toLowerCase()}`}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-[13px] font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <BarChart3 className="size-3.5" aria-hidden />Analyse
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
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setComparing(open ? null : o.id)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <GitCompare className="size-3.5" aria-hidden />Compare with Portfolio
                </button>
              </div>
            </Panel>
          )
        })}
        {list.length === 0 ? (
          <Panel className="col-span-full p-10 text-center text-[13px] text-muted-foreground">Nothing on your watchlist yet.</Panel>
        ) : null}
      </div>

      <Panel className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-sm font-semibold">Analyse something you&apos;re considering</h2>
          <p className="text-[13px] text-muted-foreground">See what changes across your whole portfolio before you buy.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {['NVDA', 'MSFT', 'NBIS', 'MU'].map((t) => (
            <Link key={t} href={`/me/opportunities/${t.toLowerCase()}`} className="inline-flex h-8 items-center rounded-lg border px-3 font-mono text-[12px] hover:bg-muted">
              {t}
            </Link>
          ))}
        </div>
      </Panel>
    </div>
  )
}
