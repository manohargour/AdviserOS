import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { Goal } from '@/lib/personal/data'
import { formatCompactGBP, formatGBP } from '@/lib/personal/format'
import { AiMark, Panel, Pill } from '@/components/personal/wealth/primitives'
import { confidenceLabel } from '@/components/personal/goals/goal-meta'

export function FreedomCard({ goal }: { goal?: Goal }) {
  if (!goal) {
    return (
      <Panel className="flex flex-col items-start gap-3 p-5 lg:col-span-2">
        <div className="flex items-center gap-2">
          <AiMark size="sm" />
          <h2 className="text-sm font-semibold">Your headline goal</h2>
        </div>
        <p className="max-w-md text-[13px] text-muted-foreground text-pretty">
          Create a goal — such as financial freedom or retirement — to track progress, probability and your estimated date here.
        </p>
        <Link href="/me/goals" className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-[13px] font-medium text-primary-foreground hover:bg-primary/90">
          Create a goal
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </Panel>
    )
  }

  const pct = goal.target > 0 ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0
  const remaining = Math.max(0, goal.target - goal.current)
  const milestones = [25, 50, 75].map((at) => ({ at, label: formatCompactGBP((goal.target * at) / 100) }))
  const ahead = goal.status === 'Ahead' || goal.status === 'On Track'

  return (
    <Panel className="flex flex-col p-5 lg:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">{goal.name}</h2>
            <Pill tone={ahead ? 'positive' : 'warning'}>{goal.status}</Pill>
          </div>
          <p className="mt-0.5 text-[13px] text-muted-foreground">{goal.description}</p>
        </div>
        <Link
          href={`/me/goals/${goal.id}`}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-[13px] font-medium text-primary-foreground hover:bg-primary/90"
        >
          Explore goal
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <p className="text-[12px] text-muted-foreground">Current</p>
          <p className="num text-xl font-semibold tracking-tight">{formatCompactGBP(goal.current)}</p>
        </div>
        <div>
          <p className="text-[12px] text-muted-foreground">Target</p>
          <p className="num text-xl font-semibold tracking-tight">{formatCompactGBP(goal.target)}</p>
        </div>
        <div>
          <p className="text-[12px] text-muted-foreground">Target date</p>
          <p className="text-xl font-semibold tracking-tight">{goal.targetDate}</p>
        </div>
        <div>
          <p className="text-[12px] text-muted-foreground">Contribution</p>
          <p className="num text-xl font-semibold tracking-tight">
            {formatGBP(goal.monthly)}<span className="text-sm font-normal text-muted-foreground">/mo</span>
          </p>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-baseline justify-between text-[12px]">
          <span className="num font-semibold text-foreground">{pct}% funded</span>
          <span className="text-muted-foreground">{formatCompactGBP(remaining)} to go</span>
        </div>
        <div className="relative h-2.5 w-full rounded-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${goal.name} funded`}>
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
          {milestones.map((m) => (
            <span key={m.at} aria-hidden className="absolute top-1/2 h-4 w-px -translate-y-1/2 bg-background" style={{ left: `${m.at}%` }} />
          ))}
        </div>
        <div className="relative mt-1.5 h-4 text-[11px] text-muted-foreground" aria-hidden>
          {milestones.map((m) => (
            <span key={m.at} className="num absolute -translate-x-1/2" style={{ left: `${m.at}%` }}>
              {m.label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Probability of success', value: `${goal.probability}%`, note: confidenceLabel(goal.probability) },
          { label: 'Expected return', value: `${goal.expectedReturn.toFixed(1)}%`, note: 'Assumed, per annum' },
          { label: 'Required return', value: `${goal.requiredReturn.toFixed(1)}%`, note: 'To reach target on time' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-background/50 p-3">
            <p className="text-[12px] text-muted-foreground">{s.label}</p>
            <p className="num mt-0.5 text-lg font-semibold tracking-tight">{s.value}</p>
            <p className="text-[11px] text-muted-foreground">{s.note}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-xl bg-ai-soft/70 p-3.5">
        <AiMark size="sm" className="bg-card" />
        <p className="text-[13px] leading-relaxed text-foreground/90 text-pretty">
          At {formatGBP(goal.monthly)}/month and {goal.expectedReturn.toFixed(1)}% assumed return, this goal has an estimated {goal.probability}% chance of reaching {formatCompactGBP(goal.target)} by {goal.targetDate}. Projections are estimates, not guarantees.
        </p>
      </div>
    </Panel>
  )
}
