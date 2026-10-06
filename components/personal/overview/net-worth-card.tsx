'use client'

import { useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Period } from '@/lib/personal/data'
import type { NetWorth } from '@/lib/personal/store'
import { formatCompactGBP, formatGBP } from '@/lib/personal/format'
import { Delta, Panel, Segmented } from '@/components/personal/wealth/primitives'
import { ChartTooltipBox } from '@/components/personal/wealth/chart-tooltip'

const periods: Period[] = ['1M', '3M', '1Y', '5Y', 'ALL']
const periodLabel: Record<Period, string> = { '1M': 'this month', '3M': 'past 3 months', '1Y': 'past year', '5Y': 'past 5 years', ALL: 'all time' }

function formatTick(iso: string, period: Period) {
  const d = new Date(iso)
  if (period === '1M' || period === '3M') return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  if (period === '1Y') return d.toLocaleDateString('en-GB', { month: 'short' })
  return d.toLocaleDateString('en-GB', { year: 'numeric' })
}

export function NetWorthCard({ netWorth, series }: { netWorth: NetWorth; series: Record<Period, { date: string; value: number }[]> }) {
  const [period, setPeriod] = useState<Period>('1M')
  const data = series[period]
  const { change, pct } = useMemo(() => {
    if (period === '1M') return { change: netWorth.monthChange, pct: netWorth.monthChangePct }
    const first = data[0]?.value ?? netWorth.total
    const c = netWorth.total - first
    return { change: c, pct: first > 0 ? (c / first) * 100 : 0 }
  }, [data, period, netWorth])

  const min = Math.min(...data.map((d) => d.value))
  const max = Math.max(...data.map((d) => d.value))
  const pad = (max - min) * 0.15 || 1

  return (
    <Panel className="flex flex-col p-5 lg:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-muted-foreground">Total net worth</p>
          <p className="num mt-1 text-4xl font-semibold tracking-tight">{formatGBP(netWorth.total)}</p>
          <p className="mt-1.5 flex items-center gap-2 text-[13px]">
            <span className="num font-medium text-positive">{formatGBP(change, { signed: true })}</span>
            <Delta value={pct} className="text-[13px]" />
            <span className="text-muted-foreground">{periodLabel[period]}</span>
          </p>
        </div>
        <Segmented options={periods} value={period} onChange={setPeriod} label="Chart period" />
      </div>

      <div className="mt-6 h-56 w-full md:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="nw-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.16} />
                <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(v) => formatTick(v, period)}
              tickLine={false}
              axisLine={false}
              minTickGap={40}
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            />
            <YAxis
              domain={[min - pad, max + pad]}
              tickFormatter={(v) => formatCompactGBP(v)}
              tickLine={false}
              axisLine={false}
              width={52}
              orientation="right"
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            />
            <Tooltip
              cursor={{ stroke: 'var(--muted-foreground)', strokeDasharray: '3 3', strokeOpacity: 0.5 }}
              content={({ active, payload }) =>
                active && payload?.length ? (
                  <ChartTooltipBox
                    title={new Date(payload[0].payload.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    rows={[{ label: 'Net worth', value: formatGBP(payload[0].value as number), color: 'var(--chart-2)' }]}
                  />
                ) : null
              }
            />
            <Area type="monotone" dataKey="value" stroke="var(--chart-2)" strokeWidth={2} fill="url(#nw-fill)" animationDuration={600} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  )
}
