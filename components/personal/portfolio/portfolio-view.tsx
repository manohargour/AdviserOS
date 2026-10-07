'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import type { AllocationSlice, Holding } from '@/lib/personal/data'
import type { HoldingRow } from '@/lib/personal/store'
import { formatCompactGBP, formatGBP } from '@/lib/personal/format'
import { Delta, PageHeader, Panel, PanelHeader, Segmented } from '@/components/personal/wealth/primitives'
import { AllocationDonut } from '@/components/personal/wealth/allocation-donut'
import { GlobalExposure } from '@/components/personal/overview/global-exposure'
import { HoldingsTable } from './holdings-table'

const tabs = ['Overview', 'Holdings', 'Allocation'] as const
type Tab = (typeof tabs)[number]

type PortfolioData = {
  portfolio: { value: number; dayChange: number; dayChangePct: number }
  holdings: HoldingRow[]
  allocation: Record<'asset' | 'geography' | 'currency' | 'account', AllocationSlice[]>
}

function SectorBars({ holdings, total }: { holdings: Holding[]; total: number }) {
  const sectors = Object.entries(
    holdings.reduce<Record<string, number>>((acc, h) => ((acc[h.sector] = (acc[h.sector] ?? 0) + h.value), acc), {}),
  ).sort((a, b) => b[1] - a[1])
  return (
    <Panel>
      <PanelHeader title="Sector exposure" description="Direct holdings only." />
      {sectors.length === 0 ? (
        <p className="p-5 text-[13px] text-muted-foreground">Add holdings to see your sector exposure.</p>
      ) : (
        <ul className="flex flex-col gap-3 p-5">
          {sectors.map(([name, value]) => {
            const pct = total > 0 ? (value / total) * 100 : 0
            return (
              <li key={name} className="grid grid-cols-[9rem_1fr_4.5rem] items-center gap-3 text-[13px]">
                <span className="truncate">{name}</span>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary/80" style={{ width: `${Math.min(100, pct * 2.5)}%` }} />
                </div>
                <span className="num text-right">
                  <span className="font-medium">{pct.toFixed(1)}%</span>
                  <span className="sr-only"> · {formatCompactGBP(value)}</span>
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}

export function PortfolioView({ data }: { data: PortfolioData }) {
  const router = useRouter()
  const params = useSearchParams()
  const raw = params.get('tab')
  const tab: Tab = tabs.find((t) => t.toLowerCase() === raw) ?? 'Overview'
  const setTab = (t: Tab) => router.replace(t === 'Overview' ? '/portfolio' : `/portfolio?tab=${t.toLowerCase()}`, { scroll: false })
  const { portfolio, holdings, allocation } = data

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Investable assets across your accounts"
        title="Portfolio"
        actions={
          <div className="text-right">
            <p className="num text-2xl font-semibold tracking-tight">{formatGBP(portfolio.value)}</p>
            <p className="flex items-center justify-end gap-1.5 text-[13px]">
              <span className={`num font-medium ${portfolio.dayChange >= 0 ? 'text-positive' : 'text-negative'}`}>{formatGBP(portfolio.dayChange, { signed: true })}</span>
              <Delta value={portfolio.dayChangePct} className="text-[13px]" />
              <span className="text-muted-foreground">today</span>
            </p>
          </div>
        }
      />

      <div className="-mx-1 overflow-x-auto px-1">
        <Segmented options={tabs} value={tab} onChange={setTab} label="Portfolio sections" size="md" />
      </div>

      {tab === 'Overview' ? (
        <>
          <HoldingsTable holdings={holdings} portfolioValue={portfolio.value} limit={6} title="Largest holdings" />
          <div className="grid gap-4 lg:grid-cols-3">
            <AllocationDonut allocation={allocation} />
            <div className="lg:col-span-2"><SectorBars holdings={holdings} total={portfolio.value} /></div>
          </div>
        </>
      ) : null}
      {tab === 'Holdings' ? <HoldingsTable holdings={holdings} portfolioValue={portfolio.value} editable /> : null}
      {tab === 'Allocation' ? (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <AllocationDonut allocation={allocation} />
            <div className="lg:col-span-2"><SectorBars holdings={holdings} total={portfolio.value} /></div>
          </div>
          <GlobalExposure geography={allocation.geography} currency={allocation.currency} />
        </>
      ) : null}
    </div>
  )
}
