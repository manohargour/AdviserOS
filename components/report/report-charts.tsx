'use client'

import { Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import type { AssetClass } from '@/lib/data'
import { ASSET_COLORS } from '@/components/report/asset-colors'

const compactGbp = (v: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', notation: 'compact', maximumFractionDigits: 1 }).format(v)

export function AllocationDonut({
  rows,
  total,
}: {
  rows: { assetClass: AssetClass; value: number; pct: number }[]
  total: string
}) {
  return (
    <div className="relative mx-auto size-52" role="img" aria-label={`Asset allocation: ${rows.map((r) => `${r.assetClass} ${r.pct.toFixed(1)}%`).join(', ')}`}>
      <PieChart width={208} height={208}>
        <Pie
          data={rows}
          dataKey="value"
          nameKey="assetClass"
          innerRadius={66}
          outerRadius={100}
          paddingAngle={1.5}
          stroke="none"
          isAnimationActive={false}
        >
          {rows.map((r) => (
            <Cell key={r.assetClass} fill={ASSET_COLORS[r.assetClass]} />
          ))}
        </Pie>
      </PieChart>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Total</span>
        <span className="font-serif text-xl tabular-nums">{total}</span>
      </div>
    </div>
  )
}

export function ValuationChart({ data }: { data: { label: string; value: number }[] }) {
  return (
    <div className="h-56 w-full" role="img" aria-label={data.map((d) => `${d.label}: ${compactGbp(d.value)}`).join(', ')}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 24, right: 8, bottom: 0, left: 0 }} barCategoryGap="28%">
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
          <YAxis
            tickFormatter={compactGbp}
            tickLine={false}
            axisLine={false}
            width={56}
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          />
          <Bar dataKey="value" radius={[3, 3, 0, 0]} isAnimationActive={false}>
            {data.map((d, i) => (
              <Cell key={d.label} fill={i === data.length - 1 ? 'var(--chart-1)' : 'var(--chart-4)'} />
            ))}
            <LabelList dataKey="value" position="top" formatter={(v) => compactGbp(Number(v))} style={{ fontSize: 11, fill: 'var(--foreground)' }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ExposureChart({ data }: { data: { label: string; previous: number; current: number }[] }) {
  return (
    <div
      className="h-44 w-full"
      role="img"
      aria-label={data.map((d) => `${d.label}: ${d.previous.toFixed(1)}% previously, ${d.current.toFixed(1)}% now`).join('; ')}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 0 }} barGap={3}>
          <CartesianGrid horizontal={false} stroke="var(--border)" />
          <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
          <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} width={84} tick={{ fontSize: 11, fill: 'var(--foreground)' }} />
          <Bar dataKey="previous" name="Last review" fill="var(--chart-4)" radius={[0, 3, 3, 0]} barSize={10} isAnimationActive={false}>
            <LabelList dataKey="previous" position="right" formatter={(v) => `${Number(v).toFixed(0)}%`} style={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
          </Bar>
          <Bar dataKey="current" name="This review" fill="var(--chart-1)" radius={[0, 3, 3, 0]} barSize={10} isAnimationActive={false}>
            <LabelList dataKey="current" position="right" formatter={(v) => `${Number(v).toFixed(0)}%`} style={{ fontSize: 10, fill: 'var(--foreground)' }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
