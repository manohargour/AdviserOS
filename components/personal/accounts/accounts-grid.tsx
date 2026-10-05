'use client'

import { useState } from 'react'
import { Check, Plus, RefreshCw, Search } from 'lucide-react'
import { accounts } from '@/lib/personal/data'
import { formatGBP } from '@/lib/personal/format'
import { Dot, PageHeader, Panel, Pill } from '@/components/personal/wealth/primitives'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/personal/ui/sheet'
import { cn } from '@/lib/utils'

const providers = [
  { name: 'Vanguard UK', region: 'UK' }, { name: 'AJ Bell', region: 'UK' }, { name: 'Freetrade', region: 'UK' }, { name: 'Nutmeg', region: 'UK' },
  { name: 'Aviva Pension', region: 'UK' }, { name: 'Schwab', region: 'US' }, { name: 'Fidelity US', region: 'US' }, { name: 'Groww', region: 'India' },
  { name: 'ICICI Direct', region: 'India' }, { name: 'Barclays', region: 'UK' }, { name: 'Revolut', region: 'Global' }, { name: 'Wise', region: 'Global' },
]

export function AccountsGrid() {
  const [refreshing, setRefreshing] = useState(false)
  const [refreshedAt, setRefreshedAt] = useState('4 minutes ago')
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [connected, setConnected] = useState<string[]>([])
  const total = accounts.reduce((s, a) => s + a.value, 0)

  function refresh() {
    setRefreshing(true)
    window.setTimeout(() => {
      setRefreshing(false)
      setRefreshedAt('just now')
    }, 1200)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Accounts"
        title="Connected accounts"
        description={`${accounts.length} sources across UK, US and India · last refreshed ${refreshedAt}`}
        actions={
          <>
            <button type="button" onClick={refresh} disabled={refreshing} className="inline-flex h-9 items-center gap-1.5 rounded-lg border bg-card px-3 text-[13px] font-medium hover:bg-muted disabled:opacity-60">
              <RefreshCw className={cn('size-3.5', refreshing && 'animate-spin')} aria-hidden />
              {refreshing ? 'Refreshing…' : 'Refresh all'}
            </button>
            <button type="button" onClick={() => setOpen(true)} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-[13px] font-medium text-primary-foreground hover:bg-primary/90">
              <Plus className="size-4" aria-hidden />Connect Account
            </button>
          </>
        }
      />

      <Panel className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="text-[12px] text-muted-foreground">Net across all accounts</p>
          <p className="num text-2xl font-semibold tracking-tight">{formatGBP(total)}</p>
        </div>
        <p className="max-w-md text-[12px] text-muted-foreground text-pretty">
          Read-only connections via Open Banking, SnapTrade and Account Aggregator (India). We can never move money.
        </p>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {accounts.map((a) => (
          <Panel key={a.name} className="flex flex-col p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-[12px] font-semibold">
                  {a.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
                </span>
                <div>
                  <h2 className="text-[14px] font-semibold">{a.name}</h2>
                  <p className="text-[12px] text-muted-foreground">{a.type}</p>
                </div>
              </div>
              <Pill tone={a.status === 'Connected' ? 'positive' : 'neutral'}>
                <Dot tone={a.status === 'Connected' ? 'positive' : 'neutral'} />
                {a.status}
              </Pill>
            </div>
            <p className={cn('num mt-5 text-xl font-semibold tracking-tight', a.value < 0 && 'text-negative')}>{formatGBP(a.value)}</p>
            <div className="mt-auto flex items-center justify-between pt-4 text-[12px] text-muted-foreground">
              <span>{a.region}</span>
              <span>{refreshing && a.status === 'Connected' ? 'Syncing…' : refreshedAt === 'just now' && a.status === 'Connected' ? 'Refreshed just now' : a.refreshed}</span>
            </div>
          </Panel>
        ))}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full gap-0 sm:max-w-md">
          <SheetHeader className="border-b">
            <SheetTitle>Connect an account</SheetTitle>
            <SheetDescription>Choose a provider. Connections are read-only.</SheetDescription>
          </SheetHeader>
          <div className="p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <label htmlFor="provider-search" className="sr-only">Search providers</label>
              <input id="provider-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search 2,400+ providers" className="h-9 w-full rounded-lg border bg-card pr-3 pl-8 text-[13px] outline-none focus:border-ring/50" />
            </div>
          </div>
          <ul className="flex-1 divide-y overflow-y-auto border-t">
            {providers
              .filter((p) => p.name.toLowerCase().includes(q.toLowerCase()))
              .map((p) => {
                const done = connected.includes(p.name)
                return (
                  <li key={p.name} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-[13px] font-medium">{p.name}</p>
                      <p className="text-[11px] text-muted-foreground">{p.region}</p>
                    </div>
                    <button
                      type="button"
                      disabled={done}
                      onClick={() => setConnected((c) => [...c, p.name])}
                      className={cn('inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[12px] font-medium', done ? 'border-positive/30 text-positive' : 'hover:bg-muted')}
                    >
                      {done ? <><Check className="size-3.5" aria-hidden />Requested</> : 'Connect'}
                    </button>
                  </li>
                )
              })}
          </ul>
        </SheetContent>
      </Sheet>
    </div>
  )
}
