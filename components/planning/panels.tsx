import { gbp, type Client } from '@/lib/data'
import { MODEL_RANGES, type GoalStatus, type Plan, type Priority } from '@/lib/planning'
import { PerformanceChart, ProjectionChart, WRAPPER_COLORS, WrapperDonut } from '@/components/planning/planning-charts'
import { cn } from '@/lib/utils'

const pct = (n: number, d = 1) => `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(d)}%`
const th = 'pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground'
const printColor = 'print:[print-color-adjust:exact]'

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'positive' | 'negative' | 'warning' }) {
  return (
    <div className="flex flex-col gap-0.5 border-l-2 border-brass/60 pl-3">
      <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          'font-serif text-xl tabular-nums leading-tight',
          tone === 'positive' && 'text-positive',
          tone === 'negative' && 'text-destructive',
          tone === 'warning' && 'text-accent-foreground',
        )}
      >
        {value}
      </dd>
      {sub && <dd className="text-xs text-muted-foreground">{sub}</dd>}
    </div>
  )
}

function Legend({ items }: { items: { label: string; color: string; dashed?: boolean }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span aria-hidden className={cn('h-0.5 w-4', printColor, i.dashed && 'opacity-70')} style={{ background: i.color }} />
          {i.label}
        </li>
      ))}
    </ul>
  )
}

export function Pill({ children, tone }: { children: React.ReactNode; tone: 'positive' | 'warning' | 'negative' | 'neutral' }) {
  return (
    <span
      className={cn(
        'inline-flex w-fit shrink-0 items-center rounded-sm px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
        printColor,
        tone === 'positive' && 'bg-positive-soft text-positive',
        tone === 'warning' && 'bg-warning-soft text-accent-foreground',
        tone === 'negative' && 'bg-destructive/10 text-destructive',
        tone === 'neutral' && 'bg-muted text-muted-foreground',
      )}
    >
      {children}
    </span>
  )
}

const goalTone: Record<GoalStatus, 'positive' | 'warning' | 'negative' | 'neutral'> = {
  Achieved: 'positive',
  'On track': 'positive',
  Monitor: 'warning',
  Behind: 'negative',
}
const priorityTone: Record<Priority, 'negative' | 'warning' | 'neutral'> = { High: 'negative', Medium: 'warning', Low: 'neutral' }

export function RiskPanel({ client, plan }: { client: Client; plan: Plan }) {
  const r = plan.risk
  const riskMoved = client.risk.score !== client.risk.previousScore
  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-2 gap-5 md:grid-cols-4">
        <Stat label="Attitude to risk" value={`${client.risk.score}/10`} sub={riskMoved ? `${client.risk.label} · was ${client.risk.previousScore}/10` : client.risk.label} />
        <Stat label="Capacity for loss" value={r.capacityForLoss} sub={`Age ${client.age}`} />
        <Stat label="Severe market fall" value={`−${gbp(Math.abs(r.stressLoss))}`} sub={`${r.stressPct.toFixed(1)}% estimated`} tone="negative" />
        <Stat label="Expected volatility" value={`${r.volatility.toFixed(1)}%`} sub="a year, indicative" />
      </dl>

      <div>
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-sm font-semibold">Equity exposure against model range</h3>
          <Pill tone={r.alignment === 'Within range' ? 'positive' : r.alignment === 'Above range' ? 'negative' : 'warning'}>{r.alignment}</Pill>
        </div>
        <div
          className="relative mt-3 h-6 rounded-sm bg-muted"
          role="img"
          aria-label={`Equity ${r.equity.toFixed(0)}% against a model range of ${r.modelMin} to ${r.modelMax}%`}
        >
          <div
            className={cn('absolute inset-y-0 rounded-sm bg-positive/25', printColor)}
            style={{ left: `${r.modelMin}%`, width: `${r.modelMax - r.modelMin}%` }}
          />
          <div className={cn('absolute -inset-y-1 w-0.5 bg-foreground', printColor)} style={{ left: `${r.equity}%` }} />
          <span className="absolute -top-5 -translate-x-1/2 text-xs font-semibold tabular-nums" style={{ left: `${r.equity}%` }}>
            {r.equity.toFixed(0)}%
          </span>
        </div>
        <div className="mt-1.5 flex justify-between text-[11px] tabular-nums text-muted-foreground">
          <span>0% equity</span>
          <span>
            Model range {r.modelMin}–{r.modelMax}%
          </span>
          <span>100%</span>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold">Risk scale</h3>
        <div className="mt-3 flex gap-1" role="img" aria-label={`Risk score ${client.risk.score} of 10${riskMoved ? `, previously ${client.risk.previousScore}` : ''}`}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <div key={n} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={cn(
                  'h-7 w-full rounded-sm',
                  printColor,
                  n === client.risk.score ? 'bg-primary' : n === client.risk.previousScore ? 'bg-chart-4' : 'bg-muted',
                )}
              />
              <span className={cn('text-xs tabular-nums', n === client.risk.score ? 'font-semibold' : 'text-muted-foreground')}>{n}</span>
              <span className="hidden text-[10px] tabular-nums text-muted-foreground md:block">
                {MODEL_RANGES[n][0]}–{MODEL_RANGES[n][1]}%
              </span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Assessed {client.risk.assessedOn} using {client.risk.tool}. Percentages show the equity range for each risk level.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h3 className="text-sm font-semibold">Capacity for loss</h3>
          <p className="mt-1 text-sm text-muted-foreground">{r.capacityNote}</p>
        </div>
        <div className={cn('rounded-lg border-l-4 bg-muted/50 p-4', r.alignment === 'Within range' ? 'border-positive' : 'border-destructive')}>
          <h3 className="text-sm font-semibold">Suitability</h3>
          <p className="mt-1 text-sm text-pretty">{r.statement}</p>
        </div>
      </div>
    </div>
  )
}

export function GoalsPanel({ plan }: { plan: Plan }) {
  const { goals, projection, assumptions } = plan.goals
  const at = (y: number) => projection[y]
  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-semibold">Projected portfolio value</h3>
          <Legend
            items={[
              { label: 'Strong', color: 'var(--chart-3)', dashed: true },
              { label: 'Central', color: 'var(--chart-1)' },
              { label: 'Weak', color: 'var(--chart-2)', dashed: true },
            ]}
          />
        </div>
        <ProjectionChart data={projection} />
        <table className="mt-3 w-full text-sm">
          <caption className="sr-only">Projected values</caption>
          <thead>
            <tr className="border-b">
              <th scope="col" className={cn(th, 'text-left')}>Scenario</th>
              <th scope="col" className={cn(th, 'text-right')}>In 5 years ({at(5).year})</th>
              <th scope="col" className={cn(th, 'text-right')}>In 10 years ({at(10).year})</th>
            </tr>
          </thead>
          <tbody className="divide-y tabular-nums">
            {(['strong', 'central', 'weak'] as const).map((k) => (
              <tr key={k} className={k === 'central' ? 'font-semibold' : undefined}>
                <th scope="row" className="py-2 text-left font-normal capitalize">{k}</th>
                <td className="py-2 text-right">{gbp(at(5)[k])}</td>
                <td className="py-2 text-right">{gbp(at(10)[k])}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-muted-foreground">{assumptions} Projections are illustrations, not guarantees.</p>
      </div>

      <div>
        <h3 className="text-sm font-semibold">Objectives</h3>
        <ul className="mt-3 divide-y rounded-lg border">
          {goals.map((g) => (
            <li key={g.title} className="flex flex-col gap-2 p-3 md:flex-row md:items-center md:gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{g.title}</p>
                <p className="text-xs text-muted-foreground">
                  Target {g.target} · {g.horizon}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-40 overflow-hidden rounded-full bg-muted" aria-hidden>
                  <div
                    className={cn('h-full rounded-full', printColor, g.status === 'Behind' ? 'bg-destructive' : g.status === 'Monitor' ? 'bg-brass' : 'bg-positive')}
                    style={{ width: `${Math.min(100, g.progress)}%` }}
                  />
                </div>
                <span className="w-10 text-right text-sm tabular-nums">{g.progress}%</span>
                <span className="w-20">
                  <Pill tone={goalTone[g.status]}>{g.status}</Pill>
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function PerformancePanel({ plan }: { plan: Plan }) {
  const p = plan.performance
  return (
    <div className="space-y-6">
      <table className="w-full text-sm">
        <caption className="sr-only">Returns against benchmark</caption>
        <thead>
          <tr className="border-b">
            <th scope="col" className={cn(th, 'text-left')}>Period</th>
            <th scope="col" className={cn(th, 'text-right')}>Portfolio</th>
            <th scope="col" className={cn(th, 'text-right')}>Benchmark</th>
            <th scope="col" className={cn(th, 'text-right')}>Relative</th>
          </tr>
        </thead>
        <tbody className="divide-y tabular-nums">
          {p.periods.map((row) => (
            <tr key={row.label}>
              <th scope="row" className="py-2 text-left font-medium">{row.label}</th>
              <td className="py-2 text-right">{pct(row.portfolio)}</td>
              <td className="py-2 text-right text-muted-foreground">{pct(row.benchmark)}</td>
              <td className={cn('py-2 text-right font-semibold', row.relative >= 0 ? 'text-positive' : 'text-destructive')}>{pct(row.relative)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-semibold">Calendar year returns</h3>
          <Legend
            items={[
              { label: 'Portfolio', color: 'var(--chart-1)' },
              { label: p.benchmark, color: 'var(--chart-4)' },
            ]}
          />
        </div>
        <PerformanceChart data={p.calendar} />
      </div>
      <p className="text-xs text-muted-foreground">
        Returns are after fund charges, before platform and advice fees. Benchmark: {p.benchmark} sector average. Past performance is not a reliable
        indicator of future returns.
      </p>
    </div>
  )
}

export function TaxPanel({ plan }: { plan: Plan }) {
  const t = plan.tax
  return (
    <div className="space-y-6">
      <div className="grid items-center gap-6 md:grid-cols-5">
        <div className="md:col-span-2">
          <WrapperDonut rows={t.wrappers} />
        </div>
        <table className="w-full text-sm md:col-span-3">
          <caption className="sr-only">Holdings by tax wrapper</caption>
          <thead>
            <tr className="border-b">
              <th scope="col" className={cn(th, 'text-left')}>Wrapper</th>
              <th scope="col" className={cn(th, 'w-24 text-right')}>Value</th>
              <th scope="col" className={cn(th, 'w-16 text-right')}>Share</th>
            </tr>
          </thead>
          <tbody className="divide-y align-top">
            {t.wrappers.map((w, i) => (
              <tr key={w.name}>
                <td className="py-2 pr-3">
                  <span className="flex items-center gap-2 font-medium">
                    <span aria-hidden className={cn('size-2.5 shrink-0 rounded-sm', printColor)} style={{ background: WRAPPER_COLORS[i] }} />
                    {w.name}
                  </span>
                  <span className="mt-0.5 block pl-4.5 text-xs text-muted-foreground">{w.treatment}</span>
                </td>
                <td className="py-2 text-right tabular-nums">{gbp(w.value)}</td>
                <td className="py-2 text-right tabular-nums">{w.pct.toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="text-sm font-semibold">Allowances used, {t.taxYear} tax year</h3>
        <ul className="mt-3 grid gap-4 md:grid-cols-2">
          {t.allowances.map((a) => {
            const used = (a.used / a.limit) * 100
            return (
              <li key={a.name} className="rounded-lg border p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-medium">{a.name}</p>
                  <p className="text-xs tabular-nums text-muted-foreground">{gbp(a.limit)}</p>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
                  <div className={cn('h-full rounded-full bg-primary', printColor)} style={{ width: `${used}%` }} />
                </div>
                <p className="mt-1.5 flex justify-between text-xs tabular-nums">
                  <span>{gbp(a.used)} used</span>
                  <span className={a.remaining > 0 ? 'font-semibold text-accent-foreground' : 'text-muted-foreground'}>{gbp(a.remaining)} remaining</span>
                </p>
              </li>
            )
          })}
        </ul>
        {t.giaGain > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">Estimated unrealised gain in the general investment account: {gbp(t.giaGain)}.</p>
        )}
      </div>
    </div>
  )
}

export function CostsPanel({ plan }: { plan: Plan }) {
  const c = plan.costs
  const colors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)']
  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-2 gap-5 md:grid-cols-3">
        <Stat label="Total ongoing cost" value={`${c.totalPct.toFixed(2)}%`} sub="a year" />
        <Stat label="In pounds" value={gbp(c.total)} sub="this year, estimated" />
        <Stat label="Effect over 10 years" value={gbp(c.chargesEffect)} sub="reduction in projected value" />
      </dl>
      <div>
        <div className="flex h-4 overflow-hidden rounded-sm" role="img" aria-label={c.lines.map((l) => `${l.label} ${l.pct.toFixed(2)}%`).join(', ')}>
          {c.lines.map((l, i) => (
            <div key={l.label} className={printColor} style={{ width: `${(l.pct / c.totalPct) * 100}%`, background: colors[i] }} />
          ))}
        </div>
        <table className="mt-4 w-full text-sm">
          <caption className="sr-only">Breakdown of charges</caption>
          <thead>
            <tr className="border-b">
              <th scope="col" className={cn(th, 'text-left')}>Charge</th>
              <th scope="col" className={cn(th, 'text-right')}>Rate</th>
              <th scope="col" className={cn(th, 'text-right')}>Cost a year</th>
            </tr>
          </thead>
          <tbody className="divide-y tabular-nums">
            {c.lines.map((l, i) => (
              <tr key={l.label}>
                <td className="py-2">
                  <span className="flex items-center gap-2">
                    <span aria-hidden className={cn('size-2.5 rounded-sm', printColor)} style={{ background: colors[i] }} />
                    {l.label}
                    {l.label === 'Platform fee' && <span className="text-muted-foreground">({c.platform})</span>}
                  </span>
                </td>
                <td className="py-2 text-right">{l.pct.toFixed(2)}%</td>
                <td className="py-2 text-right">{gbp(l.amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-foreground/20 font-semibold tabular-nums">
              <td className="pt-2">Total</td>
              <td className="pt-2 text-right">{c.totalPct.toFixed(2)}%</td>
              <td className="pt-2 text-right">{gbp(c.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        Costs are estimated on the current valuation and shown in line with MiFID II disclosure. Your annual ex-post statement confirms the exact amounts.
      </p>
    </div>
  )
}

export function ActionsPanel({ plan, adviserName }: { plan: Plan; adviserName: string }) {
  return (
    <div className="space-y-3">
      <ol className="divide-y rounded-lg border">
        {plan.actions.map((a, i) => (
          <li key={a.title} className="flex gap-4 p-4">
            <span className="font-serif text-lg tabular-nums leading-none text-brass">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold">{a.title}</p>
                <Pill tone={priorityTone[a.priority]}>{a.priority}</Pill>
              </div>
              <p className="mt-1 text-sm text-muted-foreground text-pretty">{a.rationale}</p>
              <p className="mt-1.5 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{a.owner === 'Client' ? 'For you' : adviserName}</span> · {a.timing}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <p className="text-xs text-muted-foreground">
        Proposed actions are based on the information held at the review date and are confirmed by {adviserName} before the report is issued.
      </p>
    </div>
  )
}
