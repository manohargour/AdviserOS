'use client'

import { Bar, BarChart, CartesianGrid, Cell, LabelList, Line, LineChart, Pie, PieChart, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from 'recharts'

const compactGbp = (v: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', notation: 'compact', maximumFractionDigits: 1 }).format(v)

const axisTick = { fontSize: 11, fill: 'var(--muted-foreground)' }

export const WRAPPER_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-5)']

export function ProjectionChart({ data }: { data: { year: number; weak: number; central: number; strong: number }[] }) {
  const last = data[data.length - 1]
  return (
    <div
      className="h-64 w-full"
      role="img"
      aria-label={`Projected value by ${last.year}: weak ${compactGbp(last.weak)}, central ${compactGbp(last.central)}, strong ${compactGbp(last.strong)}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 64, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="year" tickLine={false} axisLine={false} tick={axisTick} interval={1} />
          <YAxis tickFormatter={compactGbp} tickLine={false} axisLine={false} width={56} tick={axisTick} domain={['auto', 'auto']} />
          {(['strong', 'central', 'weak'] as const).map((k) => (
            <Line
              key={k}
              dataKey={k}
              type="monotone"
              dot={false}
              isAnimationActive={false}
              stroke={k === 'central' ? 'var(--chart-1)' : k === 'strong' ? 'var(--chart-3)' : 'var(--chart-2)'}
              strokeWidth={k === 'central' ? 2.5 : 1.5}
              strokeDasharray={k === 'central' ? undefined : '4 3'}
            >
              <LabelList
                dataKey={k}
                content={({ x, y, index, value }) =>
                  index === data.length - 1 ? (
                    <text x={Number(x) + 6} y={Number(y) + 4} fontSize={11} fill="var(--foreground)">
                      {compactGbp(Number(value))}
                    </text>
                  ) : null
                }
              />
            </Line>
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function PerformanceChart({ data }: { data: { year: string; portfolio: number; benchmark: number }[] }) {
  return (
    <div
      className="h-60 w-full"
      role="img"
      aria-label={data.map((d) => `${d.year}: portfolio ${d.portfolio}%, benchmark ${d.benchmark}%`).join('; ')}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 8, bottom: 0, left: 0 }} barGap={3} barCategoryGap="24%">
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="year" tickLine={false} axisLine={false} tick={axisTick} />
          <YAxis tickFormatter={(v) => `${v}%`} tickLine={false} axisLine={false} width={40} tick={axisTick} />
          <ReferenceLine y={0} stroke="var(--foreground)" strokeOpacity={0.4} />
          <Bar dataKey="portfolio" fill="var(--chart-1)" radius={[2, 2, 0, 0]} isAnimationActive={false}>
            <LabelList dataKey="portfolio" position="top" formatter={(v) => `${Number(v).toFixed(1)}`} style={{ fontSize: 10, fill: 'var(--foreground)' }} />
          </Bar>
          <Bar dataKey="benchmark" fill="var(--chart-4)" radius={[2, 2, 0, 0]} isAnimationActive={false}>
            <LabelList dataKey="benchmark" position="top" formatter={(v) => `${Number(v).toFixed(1)}`} style={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function WrapperDonut({ rows }: { rows: { name: string; value: number; pct: number }[] }) {
  return (
    <div className="mx-auto size-44" role="img" aria-label={`Tax wrappers: ${rows.map((r) => `${r.name} ${r.pct.toFixed(0)}%`).join(', ')}`}>
      <PieChart width={176} height={176}>
        <Pie data={rows} dataKey="value" nameKey="name" innerRadius={52} outerRadius={84} paddingAngle={1.5} stroke="none" isAnimationActive={false}>
          {rows.map((r, i) => (
            <Cell key={r.name} fill={WRAPPER_COLORS[i % WRAPPER_COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    </div>
  )
}
