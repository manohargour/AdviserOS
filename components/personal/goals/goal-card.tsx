import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { Goal } from '@/lib/personal/data'
import { formatCompactGBP, formatGBP } from '@/lib/personal/format'
import { Meter, Panel, Pill } from '@/components/personal/wealth/primitives'
import { GoalIcon, confidenceLabel, statusTone } from './goal-meta'
import { cn } from '@/lib/utils'

export function GoalCard({ goal, featured = false }: { goal: Goal; featured?: boolean }) {
  const pct = Math.min(100, Math.round((goal.current / goal.target) * 100))
  const tone = statusTone(goal.status)

  return (
    <Link
      href={`/me/goals/${goal.id}`}
      className="group block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <Panel className={cn('flex h-full flex-col p-5 transition-shadow group-hover:shadow-[0_4px_16px_rgba(16,24,40,0.06)]', featured && 'md:p-6')}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <GoalIcon icon={goal.icon} />
            <div>
              <h3 className="text-[15px] font-semibold tracking-tight">{goal.name}</h3>
              <p className="text-[12px] text-muted-foreground">Target {goal.targetDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Pill tone={tone}>{goal.status}</Pill>
            <ArrowUpRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
          </div>
        </div>

        <p className="mt-3 text-[13px] text-muted-foreground text-pretty">{goal.description}</p>

        <div className="mt-5 flex items-baseline justify-between gap-2">
          <p className="num text-2xl font-semibold tracking-tight">
            {formatCompactGBP(goal.current)}
            <span className="text-base font-normal text-muted-foreground"> / {formatCompactGBP(goal.target)}</span>
          </p>
          <span className="num text-[13px] font-medium">{pct}%</span>
        </div>
        <Meter value={pct} tone={tone === 'warning' ? 'warning' : 'ink'} className="mt-2 h-1.5" label={`${goal.name} funded`} />

        <dl className="mt-5 grid grid-cols-3 gap-3 border-t pt-4 text-[12px]">
          <div>
            <dt className="text-muted-foreground">Monthly</dt>
            <dd className="num mt-0.5 font-medium">{formatGBP(goal.monthly)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Return assumed</dt>
            <dd className="num mt-0.5 font-medium">{goal.expectedReturn.toFixed(1)}% p.a.</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Probability</dt>
            <dd className="num mt-0.5 font-medium">{goal.probability}%</dd>
          </div>
        </dl>
        <p className="mt-3 text-[11px] text-muted-foreground">{confidenceLabel(goal.probability)} · based on 5,000 simulated market paths</p>
      </Panel>
    </Link>
  )
}
