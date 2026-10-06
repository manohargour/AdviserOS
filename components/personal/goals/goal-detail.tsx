'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowLeft, Info, Trash2 } from 'lucide-react'
import { projectGoal, type Goal } from '@/lib/personal/data'
import { deleteGoal } from '@/app/actions/personal-data'
import { formatCompactGBP, formatGBP } from '@/lib/personal/format'
import { AiMark, Panel, PanelHeader, Pill } from '@/components/personal/wealth/primitives'
import { ChartTooltipBox } from '@/components/personal/wealth/chart-tooltip'
import { AskAiButton } from '@/components/personal/shell/ask-ai-button'
import { GoalIcon, confidenceLabel, statusTone } from './goal-meta'

function probabilityWith(goal: Goal, extra: number, techCut: boolean) {
  const lift = Math.min(97 - goal.probability, (extra / 750) * 7)
  return Math.round(goal.probability + lift + (techCut ? 0.6 : 0))
}

export function GoalDetail({ goal }: { goal: Goal }) {
  const router = useRouter()
  const [deleting, startDelete] = useTransition()
  const [extra, setExtra] = useState(0)
  const [techCut, setTechCut] = useState(false)
  const data = useMemo(() => projectGoal(goal, extra), [goal, extra])
  const probability = probabilityWith(goal, extra, techCut)
  const monthsLeft = Math.round((goal.targetYear + 0.2 - 2026.75) * 12)
  const years = Math.floor(monthsLeft / 12)

  const stats = [
    { label: 'Current portfolio assigned', value: formatGBP(goal.current), note: `${Math.round((goal.current / goal.target) * 100)}% of target` },
    { label: 'Monthly contribution', value: formatGBP(goal.monthly + extra), note: extra ? `+${formatGBP(extra)} modelled` : 'Direct debit, 1st of month' },
    { label: 'Expected return', value: `${goal.expectedReturn.toFixed(1)}%`, note: 'Real, after fees' },
    { label: 'Required return', value: `${goal.requiredReturn.toFixed(1)}%`, note: goal.requiredReturn <= goal.expectedReturn ? 'Below expected ✓' : 'Above expected' },
    { label: 'Time remaining', value: `${years}y ${monthsLeft % 12}m`, note: goal.targetDate },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/me/goals" className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" aria-hidden />
          All goals
        </Link>
        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <GoalIcon icon={goal.icon} className="size-11" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">{goal.name}</h1>
                <Pill tone={statusTone(goal.status)}>{goal.status}</Pill>
              </div>
              <p className="text-sm text-muted-foreground">{goal.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AskAiButton question={`Analyse my ${goal.name} goal`} variant="soft">
              Discuss this goal
            </AskAiButton>
            <button
              type="button"
              onClick={() => {
                if (confirm(`Delete the "${goal.name}" goal?`))
                  startDelete(async () => {
                    await deleteGoal(goal.id)
                    router.push('/me/goals')
                    router.refresh()
                  })
              }}
              disabled={deleting}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border bg-card px-3 text-[13px] font-medium text-muted-foreground hover:border-negative/30 hover:text-negative disabled:opacity-50"
            >
              <Trash2 className="size-3.5" aria-hidden />
              Delete
            </button>
          </div>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="p-5 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[13px] font-medium text-muted-foreground">Goal probability</p>
              <p className="mt-1 text-pretty text-[15px] leading-snug">
                <span className="num text-3xl font-semibold tracking-tight">{probability}%</span>
                <span className="ml-2 text-muted-foreground">
                  probability of reaching {formatCompactGBP(goal.target)} by {goal.targetDate}
                </span>
              </p>
            </div>
            <Pill tone="neutral">{confidenceLabel(probability)}</Pill>
          </div>

          <div className="mt-5 flex flex-wrap gap-4 text-[12px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-[var(--chart-2)]" />Expected path</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-sm bg-[var(--chart-2)]/15" />Optimistic – conservative range</span>
            <span className="flex items-center gap-1.5"><span className="h-0 w-4 border-t border-dashed border-foreground/60" />Required target</span>
          </div>

          <div className="mt-3 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={48} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                <YAxis
                  tickFormatter={(v) => formatCompactGBP(v)}
                  tickLine={false}
                  axisLine={false}
                  width={56}
                  orientation="right"
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    const p = payload[0].payload as (typeof data)[number]
                    return (
                      <ChartTooltipBox
                        title={String(label)}
                        rows={[
                          { label: 'Optimistic', value: formatCompactGBP(p.band[1]) },
                          { label: 'Expected', value: formatCompactGBP(p.expected), color: 'var(--chart-2)' },
                          { label: 'Conservative', value: formatCompactGBP(p.band[0]) },
                          { label: 'Target', value: formatCompactGBP(p.target) },
                        ]}
                      />
                    )
                  }}
                />
                <Area dataKey="band" stroke="none" fill="var(--chart-2)" fillOpacity={0.12} isAnimationActive={false} />
                <ReferenceLine y={goal.target} stroke="var(--foreground)" strokeOpacity={0.55} strokeDasharray="4 4" />
                <Line dataKey="expected" stroke="var(--chart-2)" strokeWidth={2} dot={false} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 flex items-start gap-1.5 text-[11px] text-muted-foreground">
            <Info className="mt-px size-3 shrink-0" aria-hidden />
            Projections are simulations, not forecasts. Ranges reflect ±1 standard deviation of historical returns for your current mix.
          </p>
        </Panel>

        <Panel className="flex flex-col border-ai/15 p-5">
          <div className="flex items-center gap-2.5">
            <AiMark />
            <h2 className="text-sm font-semibold">How can I improve this goal?</h2>
          </div>

          <div className="mt-5 flex flex-col gap-4">
            <div className="rounded-xl border p-4">
              <p className="text-[13px] leading-relaxed text-pretty">
                Adding <strong className="font-semibold">£750/month</strong> increases your projected success probability from{' '}
                <span className="num font-semibold">{goal.probability}%</span> to{' '}
                <span className="num font-semibold text-positive">{probabilityWith(goal, 750, false)}%</span>.
              </p>
              <label htmlFor="extra-monthly" className="mt-4 flex items-center justify-between text-[12px] text-muted-foreground">
                <span>Model extra monthly</span>
                <span className="num font-medium text-foreground">{formatGBP(extra)}</span>
              </label>
              <input
                id="extra-monthly"
                type="range"
                min={0}
                max={2000}
                step={50}
                value={extra}
                onChange={(e) => setExtra(Number(e.target.value))}
                className="mt-2 w-full accent-[var(--ai)]"
              />
            </div>

            <div className="rounded-xl border p-4">
              <p className="text-[13px] leading-relaxed text-pretty">
                Reducing your technology allocation by <strong className="font-semibold">8%</strong> lowers downside risk without
                materially changing expected returns.
              </p>
              <label className="mt-4 flex cursor-pointer items-center justify-between gap-3 text-[12px]">
                <span className="text-muted-foreground">Include in projection</span>
                <input type="checkbox" checked={techCut} onChange={(e) => setTechCut(e.target.checked)} className="size-4 accent-[var(--ai)]" />
              </label>
              {techCut ? (
                <p className="mt-2 text-[12px] text-muted-foreground">Conservative-case outcome improves by ~£38K; expected path moves &lt;1%.</p>
              ) : null}
            </div>
          </div>

          <p className="mt-auto pt-4 text-[11px] text-muted-foreground">
            Analysis, not a recommendation. Figures assume current tax wrappers and no change to your other goals.
          </p>
        </Panel>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {stats.map((s) => (
          <Panel key={s.label} className="p-4">
            <p className="text-[12px] text-muted-foreground">{s.label}</p>
            <p className="num mt-1 text-lg font-semibold tracking-tight">{s.value}</p>
            <p className="text-[11px] text-muted-foreground">{s.note}</p>
          </Panel>
        ))}
      </div>

      <Panel>
        <PanelHeader title="Assets funding this goal" description="Holdings are assigned to one goal at a time. Reassign from the Portfolio page." />
        <ul className="divide-y px-5 pt-3 pb-2">
          {[
            { name: 'BP Pension · BP plc & L&G Global', share: 45 },
            { name: 'Trading 212 ISA · VWRL, NVDA', share: 30 },
            { name: 'Interactive Brokers · MSFT, NBIS, TSM, MU', share: 15 },
            { name: 'BullionVault · Physical gold', share: 5 },
            { name: 'Seedrs · Private portfolio', share: 5 },
          ].map((a) => (
            <li key={a.name} className="flex items-center gap-4 py-3 text-[13px]">
              <span className="min-w-0 flex-1 truncate">{a.name}</span>
              <div className="hidden h-1.5 w-40 overflow-hidden rounded-full bg-muted sm:block">
                <div className="h-full rounded-full bg-primary" style={{ width: `${a.share}%` }} />
              </div>
              <span className="num w-20 text-right font-medium">{formatCompactGBP((goal.current * a.share) / 100)}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}
