'use client'

import { useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { AllocationSlice } from '@/lib/personal/data'
import { Panel, PanelHeader, Segmented } from '@/components/personal/wealth/primitives'
import { ChartTooltipBox } from '@/components/personal/wealth/chart-tooltip'

const views = [
  { value: 'asset', label: 'Asset Class' },
  { value: 'geography', label: 'Geography' },
  { value: 'currency', label: 'Currency' },
  { value: 'account', label: 'Account' },
] as const

type View = (typeof views)[number]['value']

export function AllocationDonut({
  allocation,
  className,
}: {
  allocation: Record<View, AllocationSlice[]>
  className?: string
}) {
  const [view, setView] = useState<View>('asset')
  const data = allocation[view]
  const top = data[0]

  return (
    <Panel className={className}>
      <PanelHeader title="Asset allocation" description="Across all accounts and wrappers" />
      <div className="px-5 pt-4">
        <Segmented options={views} value={view} onChange={setView} label="Allocation view" className="w-full [&>button]:flex-1" />
      </div>
      {data.length === 0 ? (
        <div className="p-5 text-[13px] text-muted-foreground">Add holdings to see your allocation.</div>
      ) : (
        <div className="flex flex-col items-center gap-5 p-5 sm:flex-row lg:flex-col">
          <div className="relative size-44 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius="70%" outerRadius="100%" paddingAngle={1.5} stroke="none" animationDuration={500}>
                  {data.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) =>
                    active && payload?.length ? (
                      <ChartTooltipBox
                        title="Allocation"
                        rows={[{ label: payload[0].name as string, value: `${payload[0].value}%`, color: payload[0].payload.color }]}
                      />
                    ) : null
                  }
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="num text-2xl font-semibold tracking-tight">{top.value}%</span>
              <span className="max-w-24 text-[11px] leading-tight text-muted-foreground">{top.name}</span>
            </div>
          </div>
          <ul className="flex w-full flex-col gap-2">
            {data.map((d) => (
              <li key={d.name} className="flex items-center justify-between gap-3 text-[13px]">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: d.color }} aria-hidden />
                  <span className="truncate">{d.name}</span>
                </span>
                <span className="num font-medium">{d.value}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  )
}
