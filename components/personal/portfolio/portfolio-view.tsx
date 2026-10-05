'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { holdings, portfolio } from '@/lib/personal/data'
import { formatCompactGBP, formatGBP } from '@/lib/personal/format'
import { Delta, Meter, PageHeader, Panel, PanelHeader, Segmented } from '@/components/personal/wealth/primitives'
import { ChartTooltipBox } from '@/components/personal/wealth/chart-tooltip'
import { AllocationDonut } from '@/components/personal/wealth/allocation-donut'
import { GlobalExposure } from '@/components/personal/overview/global-exposure'
import { HoldingsTable } from './holdings-table'
import { HiddenExposure } from './hidden-exposure'

const tabs = ['Overview', 'Holdings', 'Allocation', 'Risk', 'Performance', 'Income'] as const
type Tab = (typeof tabs)[number]

const perf = Array.from({ length: 13 }, (_, i) => {
  const d = new Date(2025, 8 + i, 1)
  const p = 100 * (1 + 0.019 * i + Math.sin(i * 0.9) * 0.018)
  const b = 100 * (1 + 0.012 * i + Math.sin(i * 0.8 + 1) * 0.012)
  return { label: d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }), portfolio: +p.toFixed(1), benchmark: +b.toFixed(1) }
})

const income = [
  { month: 'Oct', value: 410 }, { month: 'Nov', value: 1180 }, { month: 'Dec', value: 620 }, { month: 'Jan', value: 390 },
  { month: 'Feb', value: 1240 }, { month: 'Mar', value: 710 }, { month: 'Apr', value: 450 }, { month: 'May', value: 1320 },
  { month: 'Jun', value: 760 }, { month: 'Jul', value: 480 }, { month: 'Aug', value: 1410 }, { month: 'Sep', value: 790 },
]

const sectors = Object.entries(
  holdings.reduce<Record<string, number>>((acc, h) => ((acc[h.sector] = (acc[h.sector] ?? 0) + h.value), acc), {}),
).sort((a, b) => b[1] - a[1])

function PerformancePanel() {
  return (
    <Panel className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-muted-foreground">12-month time-weighted return</p>
          <p className="mt-1 flex items-baseline gap-3">
            <span className="num text-3xl font-semibold tracking-tight text-positive">+{(perf.at(-1)!.portfolio - 100).toFixed(1)}%</span>
            <span className="text-[13px] text-muted-foreground">vs. <span className="num">+{(perf.at(-1)!.benchmark - 100).toFixed(1)}%</span> MSCI ACWI (GBP)</span>
          </p>
        </div>
        <div className="flex gap-4 text-[12px] text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-[var(--chart-2)]" />Your portfolio</span>
          <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-muted-foreground/50" />Benchmark</span>
        </div>
      </div>
      <div className="mt-5 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={perf} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
            <YAxis domain={['dataMin - 2', 'dataMax + 2']} tickFormatter={(v) => `${(v - 100).toFixed(0)}%`} tickLine={false} axisLine={false} width={40} orientation="right" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
            <Tooltip
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <ChartTooltipBox
                    title={String(label)}
                    rows={[
                      { label: 'Portfolio', value: `${((payload[0].payload.portfolio as number) - 100).toFixed(1)}%`, color: 'var(--chart-2)' },
                      { label: 'Benchmark', value: `${((payload[0].payload.benchmark as number) - 100).toFixed(1)}%` },
                    ]}
                  />
                ) : null
              }
            />
            <Area dataKey="portfolio" stroke="var(--chart-2)" strokeWidth={2} fill="var(--chart-2)" fillOpacity={0.08} />
            <Line dataKey="benchmark" stroke="var(--muted-foreground)" strokeOpacity={0.6} strokeWidth={1.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 text-[12px] text-muted-foreground">
        Outperformance is concentrated: NVDA and NBIS contributed 64% of the excess return. Excluding them, you trail the benchmark by 0.4%.
      </p>
    </Panel>
  )
}

function IncomePanel() {
  const total = income.reduce((s, i) => s + i.value, 0)
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Panel className="p-5 lg:col-span-2">
        <p className="text-[13px] font-medium text-muted-foreground">Dividends &amp; interest · trailing 12 months</p>
        <p className="num mt-1 text-3xl font-semibold tracking-tight">{formatGBP(total)}</p>
        <div className="mt-5 h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={income} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
              <YAxis tickFormatter={(v) => `£${v}`} tickLine={false} axisLine={false} width={44} orientation="right" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
              <Tooltip cursor={{ fill: 'var(--muted)' }} content={({ active, payload, label }) => (active && payload?.length ? <ChartTooltipBox title={String(label)} rows={[{ label: 'Income', value: formatGBP(payload[0].value as number) }]} /> : null)} />
              <Bar dataKey="value" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
      <Panel className="p-5">
        <h3 className="text-sm font-semibold">Top income sources</h3>
        <ul className="mt-4 flex flex-col gap-3 text-[13px]">
          {[
            { name: 'BP plc', value: 4_210, yield: '4.9%' },
            { name: 'Vanguard FTSE Global All Cap', value: 1_390, yield: '1.7%' },
            { name: 'iShares Global Agg Bond', value: 820, yield: '3.3%' },
            { name: 'Cash interest', value: 680, yield: '4.1%' },
            { name: 'Microsoft', value: 310, yield: '0.7%' },
          ].map((s) => (
            <li key={s.name} className="flex items-center justify-between gap-3">
              <span className="truncate">{s.name}</span>
              <span className="num shrink-0 text-muted-foreground"><span className="font-medium text-foreground">{formatGBP(s.value)}</span> · {s.yield}</span>
            </li>
          ))}
        </ul>
        <p className="mt-5 border-t pt-4 text-[12px] text-muted-foreground text-pretty">
          42% of income comes from BP — the same company that pays your salary.
        </p>
      </Panel>
    </div>
  )
}

function RiskMetrics() {
  const metrics = [
    { label: 'Volatility (1Y)', value: '14.8%', note: 'Balanced profile target: 10–13%', score: 74, tone: 'warning' as const },
    { label: 'Max drawdown (5Y)', value: '-21.4%', note: 'March 2025 tariff sell-off', score: 62, tone: 'warning' as const },
    { label: 'Beta to MSCI ACWI', value: '1.12', note: 'Moves more than the market', score: 56, tone: 'neutral' as const },
    { label: 'Top 5 holdings', value: '63.7%', note: 'of investable assets', score: 64, tone: 'warning' as const },
  ]
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {metrics.map((m) => (
        <Panel key={m.label} className="p-4">
          <p className="text-[12px] text-muted-foreground">{m.label}</p>
          <p className="num mt-1 text-xl font-semibold tracking-tight">{m.value}</p>
          <Meter value={m.score} tone={m.tone} className="mt-3" label={m.label} />
          <p className="mt-2 text-[11px] text-muted-foreground">{m.note}</p>
        </Panel>
      ))}
    </div>
  )
}

function SectorBars() {
  return (
    <Panel>
      <PanelHeader title="Sector exposure" description="Direct holdings only. Look-through view in Hidden Exposure." />
      <ul className="flex flex-col gap-3 p-5">
        {sectors.map(([name, value]) => {
          const pct = (value / portfolio.value) * 100
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
    </Panel>
  )
}

export function PortfolioView() {
  const router = useRouter()
  const params = useSearchParams()
  const raw = params.get('tab')
  const tab: Tab = tabs.find((t) => t.toLowerCase() === raw) ?? 'Overview'
  const setTab = (t: Tab) => router.replace(t === 'Overview' ? '/portfolio' : `/portfolio?tab=${t.toLowerCase()}`, { scroll: false })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Investable assets across 6 accounts"
        title="Portfolio"
        actions={
          <div className="text-right">
            <p className="num text-2xl font-semibold tracking-tight">{formatGBP(portfolio.value)}</p>
            <p className="flex items-center justify-end gap-1.5 text-[13px]">
              <span className="num font-medium text-positive">{formatGBP(portfolio.dayChange, { signed: true })}</span>
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
          <HiddenExposure />
          <HoldingsTable limit={6} title="Largest holdings" />
          <div className="grid gap-4 lg:grid-cols-3">
            <AllocationDonut />
            <div className="lg:col-span-2"><SectorBars /></div>
          </div>
        </>
      ) : null}
      {tab === 'Holdings' ? <HoldingsTable /> : null}
      {tab === 'Allocation' ? (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <AllocationDonut />
            <div className="lg:col-span-2"><SectorBars /></div>
          </div>
          <GlobalExposure />
        </>
      ) : null}
      {tab === 'Risk' ? (
        <>
          <RiskMetrics />
          <HiddenExposure />
        </>
      ) : null}
      {tab === 'Performance' ? <PerformancePanel /> : null}
      {tab === 'Income' ? <IncomePanel /> : null}
    </div>
  )
}
