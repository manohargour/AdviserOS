'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowDown, ArrowUp, ChevronsUpDown, Plus, Search, Trash2 } from 'lucide-react'
import type { HoldingRow } from '@/lib/personal/store'
import { addHolding, deleteHolding } from '@/app/actions/personal-data'
import { formatGBP } from '@/lib/personal/format'
import { Delta, Dot, Panel, Pill } from '@/components/personal/wealth/primitives'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/personal/ui/sheet'
import { cn } from '@/lib/utils'

type SortKey = 'name' | 'value' | 'weight' | 'returnPct' | 'dayPct'

const ASSET_CLASSES = ['Equity', 'Bonds', 'Property', 'Cash', 'Alternatives'] as const
const ACCOUNT_LABELS = ['ISA', 'GIA', 'SIPP', 'Pension', 'India MF', 'Vault', 'Private'] as const
const REGIONS = ['Global', 'UK', 'US', 'India', 'Europe', 'Asia'] as const
const CURRENCIES = ['GBP', 'USD', 'INR', 'EUR'] as const

const field = 'h-9 w-full rounded-lg border bg-card px-3 text-[13px] outline-none focus:border-ring/50 focus:ring-3 focus:ring-ring/15'

type HoldingDraft = {
  name: string
  ticker: string
  value: number
  assetClass: (typeof ASSET_CLASSES)[number]
  accountLabel: (typeof ACCOUNT_LABELS)[number]
  sector: string
  region: (typeof REGIONS)[number]
  currency: (typeof CURRENCIES)[number]
  returnPct: number
  dayPct: number
  goal: string
}

const emptyHolding: HoldingDraft = {
  name: '',
  ticker: '',
  value: 0,
  assetClass: 'Equity',
  accountLabel: 'ISA',
  sector: 'Diversified',
  region: 'Global',
  currency: 'GBP',
  returnPct: 0,
  dayPct: 0,
  goal: '',
}

function HoldingSheet({ open, onOpenChange, onSave, saving }: { open: boolean; onOpenChange: (v: boolean) => void; onSave: (d: HoldingDraft) => void; saving: boolean }) {
  const [draft, setDraft] = useState<HoldingDraft>(emptyHolding)
  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.name.trim()) return
    onSave(draft)
  }
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>Add a holding</SheetTitle>
          <SheetDescription>Enter a position. It feeds your portfolio, allocation and exposure.</SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label htmlFor="h-name" className="mb-1.5 block text-[13px] font-medium">Name</label>
              <input id="h-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Vanguard S&P 500" className={field} required />
            </div>
            <div>
              <label htmlFor="h-ticker" className="mb-1.5 block text-[13px] font-medium">Ticker</label>
              <input id="h-ticker" value={draft.ticker} onChange={(e) => setDraft({ ...draft, ticker: e.target.value })} placeholder="VUSA" className={field} />
            </div>
            <div>
              <label htmlFor="h-value" className="mb-1.5 block text-[13px] font-medium">Value (£)</label>
              <input id="h-value" type="number" min={0} value={draft.value} onChange={(e) => setDraft({ ...draft, value: Number(e.target.value) || 0 })} className={cn(field, 'num')} />
            </div>
            <div>
              <label htmlFor="h-asset" className="mb-1.5 block text-[13px] font-medium">Asset class</label>
              <select id="h-asset" value={draft.assetClass} onChange={(e) => setDraft({ ...draft, assetClass: e.target.value as HoldingDraft['assetClass'] })} className={field}>
                {ASSET_CLASSES.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="h-account" className="mb-1.5 block text-[13px] font-medium">Account</label>
              <select id="h-account" value={draft.accountLabel} onChange={(e) => setDraft({ ...draft, accountLabel: e.target.value as HoldingDraft['accountLabel'] })} className={field}>
                {ACCOUNT_LABELS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="h-region" className="mb-1.5 block text-[13px] font-medium">Region</label>
              <select id="h-region" value={draft.region} onChange={(e) => setDraft({ ...draft, region: e.target.value as HoldingDraft['region'] })} className={field}>
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="h-currency" className="mb-1.5 block text-[13px] font-medium">Currency</label>
              <select id="h-currency" value={draft.currency} onChange={(e) => setDraft({ ...draft, currency: e.target.value as HoldingDraft['currency'] })} className={field}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="h-sector" className="mb-1.5 block text-[13px] font-medium">Sector</label>
              <input id="h-sector" value={draft.sector} onChange={(e) => setDraft({ ...draft, sector: e.target.value })} className={field} />
            </div>
            <div>
              <label htmlFor="h-return" className="mb-1.5 block text-[13px] font-medium">Return %</label>
              <input id="h-return" type="number" value={draft.returnPct} onChange={(e) => setDraft({ ...draft, returnPct: Number(e.target.value) || 0 })} className={cn(field, 'num')} />
            </div>
          </div>
          <button type="submit" disabled={!draft.name.trim() || saving} className="mt-auto inline-flex h-10 items-center justify-center rounded-lg bg-primary text-[13px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {saving ? 'Saving…' : 'Add holding'}
          </button>
        </form>
      </SheetContent>
    </Sheet>
  )
}

export function HoldingsTable({
  holdings,
  portfolioValue,
  limit,
  title = 'Holdings',
  editable = false,
}: {
  holdings: HoldingRow[]
  portfolioValue: number
  limit?: number
  title?: string
  editable?: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [account, setAccount] = useState<string>('All')
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'value', dir: 'desc' })
  const accountsList = useMemo(() => ['All', ...Array.from(new Set(holdings.map((h) => h.account)))], [holdings])

  function add(draft: HoldingDraft) {
    startTransition(async () => {
      const result = await addHolding(draft)
      if (result.ok) {
        setSheetOpen(false)
        router.refresh()
      } else {
        alert(result.error)
      }
    })
  }

  function remove(id: number) {
    startTransition(async () => {
      await deleteHolding(id)
      router.refresh()
    })
  }

  const rows = useMemo(() => {
    const q = query.toLowerCase().trim()
    const filtered = holdings.filter(
      (h) =>
        (account === 'All' || h.account === account) &&
        (!q || h.name.toLowerCase().includes(q) || h.ticker.toLowerCase().includes(q) || h.sector.toLowerCase().includes(q)),
    )
    const val = (h: HoldingRow) => (sort.key === 'weight' ? h.value : sort.key === 'name' ? h.name : h[sort.key])
    const sorted = [...filtered].sort((a, b) => {
      const av = val(a)
      const bv = val(b)
      const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number)
      return sort.dir === 'asc' ? cmp : -cmp
    })
    return limit ? sorted.slice(0, limit) : sorted
  }, [query, account, sort, limit, holdings])

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

  const lastColLabel = editable ? '' : 'AI view'

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
            {editable ? (
              <button type="button" onClick={() => setSheetOpen(true)} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-[13px] font-medium text-primary-foreground hover:bg-primary/90">
                <Plus className="size-3.5" aria-hidden />Add holding
              </button>
            ) : null}
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
              <th scope="col" className="px-3 py-2.5 pr-5 font-medium">{lastColLabel}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((h) => {
              const weight = portfolioValue > 0 ? (h.value / portfolioValue) * 100 : 0
              return (
                <tr key={h.id} className="transition-colors hover:bg-muted/40">
                  <td className="py-3 pr-3 pl-5">
                    <span className="flex items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted font-mono text-[10px] font-semibold text-foreground/80">
                        {(h.ticker || h.name).slice(0, 4)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{h.name}</span>
                        <span className="block font-mono text-[11px] text-muted-foreground">{h.ticker ? `${h.ticker} · ` : ''}{h.sector}</span>
                      </span>
                    </span>
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
                    {editable ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete ${h.name}?`)) remove(h.id)
                        }}
                        disabled={pending}
                        aria-label={`Delete ${h.name}`}
                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-negative disabled:opacity-50"
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                        <Dot tone={h.aiView.tone} />
                        {h.aiView.label}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-muted-foreground">
                  {editable ? 'No holdings yet. Add your first holding to see your portfolio.' : 'No holdings match your filters.'}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {editable ? <HoldingSheet open={sheetOpen} onOpenChange={setSheetOpen} onSave={add} saving={pending} /> : null}
    </Panel>
  )
}
