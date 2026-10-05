'use client'

import { useState } from 'react'
import { FlaskConical, RotateCcw } from 'lucide-react'
import { baseline, combine, scenarios } from '@/lib/personal/scenarios'
import { formatGBP } from '@/lib/personal/format'
import { Panel } from '@/components/personal/wealth/primitives'
import { cn } from '@/lib/utils'

function Impact({ label, before, after, delta, tone }: { label: string; before: string; after: string; delta?: string; tone: 'up' | 'down' | 'flat' }) {
  return (
    <div className="rounded-xl border p-3.5">
      <p className="text-[12px] text-muted-foreground">{label}</p>
      <p className="num mt-1 text-lg font-semibold tracking-tight">{after}</p>
      <p className="num mt-0.5 text-[11px] text-muted-foreground">
        from {before}
        {delta ? (
          <span className={cn('ml-1.5 font-medium', tone === 'up' && 'text-positive', tone === 'down' && 'text-negative')}>{delta}</span>
        ) : null}
      </p>
    </div>
  )
}

const fmtDate = (d: Date) => d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })

export function ScenarioSimulator() {
  const [active, setActive] = useState<string[]>(['us-tech'])
  const r = combine(active)
  const toggle = (id: string) => setActive((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]))

  return (
    <Panel className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-muted">
            <FlaskConical className="size-4" aria-hidden />
          </span>
          <div>
            <h2 className="text-sm font-semibold">Run a Scenario</h2>
            <p className="text-[12px] text-muted-foreground">Combine market and life events to see how your whole plan responds.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setActive([])}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12px] text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <RotateCcw className="size-3.5" aria-hidden />
          Reset
        </button>
      </div>

      {(['Markets', 'Life'] as const).map((group) => (
        <fieldset key={group} className="mt-4">
          <legend className="mb-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{group}</legend>
          <div className="flex flex-wrap gap-2">
            {scenarios
              .filter((s) => s.group === group)
              .map((s) => {
                const on = active.includes(s.id)
                return (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(s.id)}
                    className={cn(
                      'h-8 rounded-full border px-3 text-[13px] transition-colors',
                      on ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-muted',
                    )}
                  >
                    {s.label}
                  </button>
                )
              })}
          </div>
        </fieldset>
      ))}

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5" aria-live="polite">
        <Impact
          label="Net worth"
          before={formatGBP(baseline.netWorth)}
          after={formatGBP(r.netWorth)}
          delta={r.netWorthDelta ? formatGBP(r.netWorthDelta, { signed: true }) : undefined}
          tone={r.netWorthDelta > 0 ? 'up' : r.netWorthDelta < 0 ? 'down' : 'flat'}
        />
        <Impact
          label="Freedom probability"
          before={`${baseline.probability}%`}
          after={`${r.probability}%`}
          delta={r.probabilityDelta ? `${r.probabilityDelta > 0 ? '+' : ''}${r.probability - baseline.probability} pts` : undefined}
          tone={r.probabilityDelta > 0 ? 'up' : r.probabilityDelta < 0 ? 'down' : 'flat'}
        />
        <Impact
          label="Liquidity"
          before={`${baseline.liquidityMonths} mo`}
          after={`${r.liquidityMonths.toFixed(1)} mo`}
          delta={r.liquidityDelta ? `${r.liquidityDelta > 0 ? '+' : ''}${r.liquidityDelta.toFixed(1)}` : undefined}
          tone={r.liquidityDelta > 0 ? 'up' : r.liquidityDelta < 0 ? 'down' : 'flat'}
        />
        <Impact
          label="Freedom date"
          before={fmtDate(baseline.retirementDate)}
          after={fmtDate(r.retirement)}
          delta={r.retirementShiftMonths ? `${r.retirementShiftMonths > 0 ? '+' : ''}${r.retirementShiftMonths} mo` : undefined}
          tone={r.retirementShiftMonths < 0 ? 'up' : r.retirementShiftMonths > 0 ? 'down' : 'flat'}
        />
        <Impact
          label="Portfolio drawdown"
          before="0.0%"
          after={`${r.drawdown.toFixed(1)}%`}
          tone={r.drawdown < 0 ? 'down' : 'flat'}
        />
      </div>

      {r.picked.length ? (
        <ul className="mt-4 flex flex-col gap-2 border-t pt-4">
          {r.picked.map((s) => (
            <li key={s.id} className="text-[12px] leading-relaxed text-muted-foreground text-pretty">
              <span className="font-medium text-foreground">{s.label}:</span> {s.note}
            </li>
          ))}
          {active.includes('retire-early') || active.includes('stop-work') ? (
            <li className="text-[12px] text-muted-foreground">
              Freedom date for life events shows when you would stop working; probability shows whether the money lasts.
            </li>
          ) : null}
        </ul>
      ) : (
        <p className="mt-4 border-t pt-4 text-[12px] text-muted-foreground">Select one or more events to model their combined effect.</p>
      )}
      <p className="mt-3 text-[11px] text-muted-foreground">
        Illustrative stress tests using your current holdings and simple linear combination. Real events interact in ways models cannot predict.
      </p>
    </Panel>
  )
}
