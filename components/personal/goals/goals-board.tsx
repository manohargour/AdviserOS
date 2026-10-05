'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { goals as initialGoals, type Goal } from '@/lib/personal/data'
import { formatCompactGBP, formatGBP } from '@/lib/personal/format'
import { AiMark, PageHeader, Panel } from '@/components/personal/wealth/primitives'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/personal/ui/sheet'
import { GoalCard } from './goal-card'
import { GoalIcon, goalIcons } from './goal-meta'
import { cn } from '@/lib/utils'

const iconOptions: { value: Goal['icon']; label: string }[] = [
  { value: 'freedom', label: 'Freedom' },
  { value: 'retirement', label: 'Retirement' },
  { value: 'home', label: 'Home' },
  { value: 'education', label: 'Education' },
  { value: 'car', label: 'Purchase' },
]

function estimateProbability(current: number, target: number, monthly: number, years: number, rate: number) {
  let v = current
  for (let m = 0; m < years * 12; m++) v = v * (1 + rate / 100 / 12) + monthly
  const ratio = v / target
  return Math.max(8, Math.min(96, Math.round(40 + (ratio - 1) * 120 + 35)))
}

function CreateGoalSheet({ open, onOpenChange, onCreate }: { open: boolean; onOpenChange: (v: boolean) => void; onCreate: (g: Goal) => void }) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState<Goal['icon']>('home')
  const [target, setTarget] = useState(100_000)
  const [current, setCurrent] = useState(10_000)
  const [monthly, setMonthly] = useState(800)
  const [year, setYear] = useState(2032)
  const rate = icon === 'home' || icon === 'car' ? 3.8 : 5.5
  const years = Math.max(1, year - 2026)
  const probability = estimateProbability(current, target, monthly, years, rate)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onCreate({
      id: `goal-${Date.now()}`,
      name: name.trim(),
      description: 'New goal · funding will be assigned from unallocated assets.',
      current,
      target,
      targetDate: `December ${year}`,
      targetYear: year,
      monthly,
      expectedReturn: rate,
      requiredReturn: rate - 0.4,
      status: probability >= 80 ? 'On Track' : probability >= 60 ? 'Slightly Behind' : 'Behind',
      probability,
      icon,
    })
    setName('')
    onOpenChange(false)
  }

  const field = 'h-9 w-full rounded-lg border bg-card px-3 text-[13px] outline-none focus:border-ring/50 focus:ring-3 focus:ring-ring/15'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>Create a goal</SheetTitle>
          <SheetDescription>Give your money a job. We&apos;ll model it against your whole portfolio.</SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="flex flex-1 flex-col gap-5 overflow-y-auto p-4">
          <div>
            <label htmlFor="goal-name" className="mb-1.5 block text-[13px] font-medium">
              What is it for?
            </label>
            <input id="goal-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sabbatical year" className={field} required />
          </div>
          <fieldset>
            <legend className="mb-1.5 text-[13px] font-medium">Type</legend>
            <div className="grid grid-cols-5 gap-2">
              {iconOptions.map((o) => {
                const Icon = goalIcons[o.value]
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setIcon(o.value)}
                    aria-pressed={icon === o.value}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-xl border p-2 text-[11px] transition-colors',
                      icon === o.value ? 'border-primary bg-muted font-medium' : 'text-muted-foreground hover:bg-muted',
                    )}
                  >
                    <Icon className="size-4" aria-hidden />
                    {o.label}
                  </button>
                )
              })}
            </div>
          </fieldset>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'target', label: 'Target amount (£)', value: target, set: setTarget },
              { id: 'current', label: 'Already saved (£)', value: current, set: setCurrent },
              { id: 'monthly', label: 'Monthly (£)', value: monthly, set: setMonthly },
              { id: 'year', label: 'Target year', value: year, set: setYear },
            ].map((f) => (
              <div key={f.id}>
                <label htmlFor={`goal-${f.id}`} className="mb-1.5 block text-[13px] font-medium">
                  {f.label}
                </label>
                <input
                  id={`goal-${f.id}`}
                  type="number"
                  inputMode="numeric"
                  min={f.id === 'year' ? 2027 : 0}
                  value={f.value}
                  onChange={(e) => f.set(Number(e.target.value) || 0)}
                  className={cn(field, 'num')}
                />
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-ai-soft/70 p-4">
            <div className="flex items-center gap-2">
              <AiMark size="sm" className="bg-card" />
              <p className="text-[13px] font-medium">Initial projection</p>
            </div>
            <p className="num mt-3 text-2xl font-semibold tracking-tight">{probability}%</p>
            <p className="text-[12px] text-muted-foreground">
              estimated probability of reaching {formatCompactGBP(target)} by {year}, assuming {rate}% p.a. and{' '}
              {formatGBP(monthly)}/month. Assumption only — refine once funding is assigned.
            </p>
          </div>

          <button
            type="submit"
            className="mt-auto inline-flex h-10 items-center justify-center rounded-lg bg-primary text-[13px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            disabled={!name.trim()}
          >
            Create goal
          </button>
        </form>
      </SheetContent>
    </Sheet>
  )
}

export function GoalsBoard() {
  const [goals, setGoals] = useState(initialGoals)
  const [open, setOpen] = useState(false)
  const totalTarget = goals.reduce((s, g) => s + g.target, 0)
  const totalMonthly = goals.reduce((s, g) => s + g.monthly, 0)
  const onTrack = goals.filter((g) => g.status === 'Ahead' || g.status === 'On Track').length
  const [featured, ...rest] = goals

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Goals"
        title="Your Money Has a Job"
        description="Connect every investment decision to the life you are building."
        actions={
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-[13px] font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="size-4" aria-hidden />
            Create a Goal
          </button>
        }
      />

      <Panel className="grid grid-cols-2 divide-y p-0 md:grid-cols-4 md:divide-x md:divide-y-0">
        {[
          { label: 'Active goals', value: String(goals.length) },
          { label: 'On track or ahead', value: `${onTrack} of ${goals.length}` },
          { label: 'Combined target', value: formatCompactGBP(totalTarget) },
          { label: 'Monthly contributions', value: formatGBP(totalMonthly) },
        ].map((s) => (
          <div key={s.label} className="p-4 md:px-5">
            <p className="text-[12px] text-muted-foreground">{s.label}</p>
            <p className="num mt-0.5 text-lg font-semibold tracking-tight">{s.value}</p>
          </div>
        ))}
      </Panel>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <GoalCard goal={featured} featured />
        </div>
        <Panel className="flex flex-col gap-4 p-5">
          <div className="flex items-center gap-2.5">
            <AiMark size="sm" />
            <h2 className="text-sm font-semibold">What needs attention</h2>
          </div>
          <div className="rounded-xl border border-warning/20 bg-warning-soft p-3.5">
            <div className="flex items-center gap-2">
              <GoalIcon icon="retirement" className="size-7 bg-card" />
              <p className="text-[13px] font-medium">India Retirement is slightly behind</p>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-foreground/80 text-pretty">
              It requires 7.1% p.a. against an expected 6.4%. Redirecting £400/month from the Family Car goal after March 2028
              closes most of the gap.
            </p>
          </div>
          <p className="text-[12px] leading-relaxed text-muted-foreground text-pretty">
            Four of five goals are on track. Financial Freedom and Home Purchase share the same ISA — a large house deposit in 2029
            would reduce Freedom probability by roughly 6 points.
          </p>
        </Panel>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rest.map((g) => (
          <GoalCard key={g.id} goal={g} />
        ))}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex min-h-56 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-card hover:text-foreground"
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-muted">
            <Plus className="size-4" aria-hidden />
          </span>
          <span className="text-[13px] font-medium">Create a Goal</span>
          <span className="max-w-52 text-center text-[12px]">Sabbatical, wedding, business, parents&apos; care…</span>
        </button>
      </div>

      <CreateGoalSheet open={open} onOpenChange={setOpen} onCreate={(g) => setGoals((gs) => [...gs, g])} />
    </div>
  )
}
