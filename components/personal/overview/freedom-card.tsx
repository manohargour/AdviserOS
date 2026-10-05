import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { AiMark, Panel, Pill } from '@/components/personal/wealth/primitives'

const milestones = [
  { at: 25, label: '£312K' },
  { at: 50, label: '£625K' },
  { at: 75, label: '£938K' },
]

export function FreedomCard() {
  const pct = 66
  return (
    <Panel className="flex flex-col p-5 lg:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">Financial Freedom</h2>
            <Pill tone="positive">Ahead of plan</Pill>
          </div>
          <p className="mt-0.5 text-[13px] text-muted-foreground">Work becomes optional at £50K/yr of sustainable income.</p>
        </div>
        <Link
          href="/me/goals/financial-freedom"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-[13px] font-medium text-primary-foreground hover:bg-primary/90"
        >
          Explore goal
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <p className="text-[12px] text-muted-foreground">Current</p>
          <p className="num text-xl font-semibold tracking-tight">£824K</p>
        </div>
        <div>
          <p className="text-[12px] text-muted-foreground">Target</p>
          <p className="num text-xl font-semibold tracking-tight">£1.25M</p>
        </div>
        <div>
          <p className="text-[12px] text-muted-foreground">Estimated date</p>
          <p className="text-xl font-semibold tracking-tight">March 2031</p>
        </div>
        <div>
          <p className="text-[12px] text-muted-foreground">Contribution</p>
          <p className="num text-xl font-semibold tracking-tight">
            £4,500<span className="text-sm font-normal text-muted-foreground">/mo</span>
          </p>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-baseline justify-between text-[12px]">
          <span className="num font-semibold text-foreground">{pct}% funded</span>
          <span className="text-muted-foreground">£426K to go</span>
        </div>
        <div className="relative h-2.5 w-full rounded-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Financial Freedom funded">
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
          <div className="absolute top-0 h-full rounded-r-full bg-ai/25" style={{ left: `${pct}%`, width: '6%' }} aria-hidden />
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
          { label: 'Probability of success', value: '87%', note: 'Monte Carlo, 5,000 paths' },
          { label: 'Expected real return', value: '5.2%', note: 'Net of fees and inflation' },
          { label: 'Time remaining', value: '4y 6m', note: 'Original plan: 5y 5m' },
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
          You are approximately <strong className="font-semibold">11 months ahead</strong> of your original plan. The shaded
          segment shows expected growth over the next 12 months at current contributions.
        </p>
      </div>
    </Panel>
  )
}
