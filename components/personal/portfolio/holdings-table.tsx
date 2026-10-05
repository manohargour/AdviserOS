'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ChevronsUpDown, Search } from 'lucide-react'
import { holdings, portfolio, type Holding } from '@/lib/personal/data'
import { formatGBP } from '@/lib/personal/format'
import { Delta, Dot, Panel, Pill } from '@/components/personal/wealth/primitives'
import { cn } from '@/lib/utils'

type SortKey = 'name' | 'value' | 'weight' | 'returnPct' | 'dayPct'
const accountsList = ['All', ...Array.from(new Set(holdings.map((h) => h.account)))] as const

export function HoldingsTable({ limit, title = 'Holdings' }: { limit?: number; title?: string }) {
  const [query, setQuery] = useState('')
  const [account, setAccount] = useState<string>('All')
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'value', dir: 'desc' })

  const rows = useMemo(() => {
    const q = query.toLowerCase().trim()
    const filtered = holdings.filter(
      (h) =>
        (account === 'All' || h.account === account) &&
        (!q || h.name.toLowerCase().includes(q) || h.ticker.toLowerCase().includes(q) || h.sector.toLowerCase().includes(q)),
    )
    const val = (h: Holding) => (sort.key === 'weight' ? h.value : sort.key === 'name' ? h.name : h[sort.key])
    const sorted = [...filtered].sort((a, b) => {
      const av = val(a)
      const bv = val(b)
      const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number)
      return sort.dir === 'asc' ? cmp : -cmp
    })
    return limit ? sorted.slice(0, limit) : sorted
  }, [query, account, sort, limit])

  const toggle = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'name' ? 'asc' : 'desc' }))

  function SortHead({ k, children, className }: { k: SortKey; children: React.ReactNode; className?: string }) {
    const active = sort.key === k
    const Icon = !active ? ChevronsUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown
    return (
      <th scope="col" className={cn('px-3 py-2.5 font-medium', className)} aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
        <button
          type="button"
          onClick={() => toggle(k)}
          className={cn('inline-flex items-center gap-1 hover:text-foreground', active && 'text-foreground', className?.includes('text-right') && 'flex-row-reverse')}
        >
          {children}
          <Icon className="size-3 opacity-60" aria-hidden />
        </button>
      </th>
    )
  }

  return (
    <Panel className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b px-5 py-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-sm font-semibold">
          {title} <span className="num font-normal text-muted-foreground">· {rows.length}</span>
        </h2>
        {!limit ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <label htmlFor="holding-search" className="sr-only">Search holdings</label>
              <input
                id="holding-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, ticker, sector"
                className="h-8 w-full rounded-lg border bg-card pr-3 pl-8 text-[13px] outline-none focus:border-ring/50 focus:ring-3 focus:ring-ring/15 sm:w-60"
              />
            </div>
            <label htmlFor="account-filter" className="sr-only">Filter by account</label>
            <select
              id="account-filter"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className="h-8 rounded-lg border bg-card px-2.5 text-[13px] outline-none focus:border-ring/50"
            >
              {accountsList.map((a) => (
                <option key={a} value={a}>{a === 'All' ? 'All accounts' : a}</option>
              ))}
            </select>
          </div>
        ) : (
          <Link href="/me/portfolio?tab=holdings" className="text-[13px] font-medium text-muted-foreground hover:text-foreground">
            View all
          </Link>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-[13px]">
          <thead className="bg-muted/40 text-left text-[12px] text-muted-foreground">
            <tr>
              <SortHead k="name" className="pl-5">Holding</SortHead>
              <SortHead k="value" className="text-right">Value</SortHead>
              <SortHead k="weight" className="text-right">Weight</SortHead>
              <SortHead k="returnPct" className="text-right">Return</SortHead>
              <SortHead k="dayPct" className="text-right">Today</SortHead>
              <th scope="col" className="px-3 py-2.5 font-medium">Account</th>
              <th scope="col" className="px-3 py-2.5 font-medium">Goal</th>
              <th scope="col" className="px-3 py-2.5 pr-5 font-medium">AI view</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((h) => {
              const weight = (h.value / portfolio.value) * 100
              return (
                <tr key={h.ticker} className="transition-colors hover:bg-muted/40">
                  <td className="py-3 pr-3 pl-5">
                    <Link href={`/me/opportunities/${h.ticker.toLowerCase().replace('.', '')}`} className="flex items-center gap-3 hover:underline-offset-2">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted font-mono text-[10px] font-semibold text-foreground/80">
                        {h.ticker.slice(0, 4)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{h.name}</span>
                        <span className="block font-mono text-[11px] text-muted-foreground">{h.ticker} · {h.sector}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="num px-3 py-3 text-right font-medium">{formatGBP(h.value)}</td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-1 w-12 overflow-hidden rounded-full bg-muted" aria-hidden>
                        <div className={cn('h-full rounded-full', weight > 10 ? 'bg-warning' : 'bg-primary/70')} style={{ width: `${Math.min(100, weight * 3)}%` }} />
                      </div>
                      <span className="num w-11">{weight.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right"><Delta value={h.returnPct} /></td>
                  <td className="px-3 py-3 text-right">
                    {h.dayPct === 0 ? <span className="text-muted-foreground">—</span> : <Delta value={h.dayPct} />}
                  </td>
                  <td className="px-3 py-3"><Pill>{h.account}</Pill></td>
                  <td className="max-w-40 truncate px-3 py-3 text-muted-foreground">{h.goal}</td>
                  <td className="px-3 py-3 pr-5">
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                      <Dot tone={h.aiView.tone} />
                      {h.aiView.label}
                    </span>
                  </td>
                </tr>
              )
            })}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-muted-foreground">No holdings match your filters.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}
