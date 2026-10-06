'use client'

import { useState } from 'react'
import { FlaskConical, RotateCcw } from 'lucide-react'
import type { HoldingRow, NetWorth } from '@/lib/personal/store'
import { SHOCKS, runScenario } from '@/lib/personal/insights'
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

export function ScenarioSimulator({ holdings, netWorth }: { holdings: HoldingRow[]; netWorth: NetWorth }) {
  const [active, setActive] = useState<string[]>([])
  const r = runScenario(holdings, netWorth, active)
  const toggle = (id: string) => setActive((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]))

  return (
    <Panel className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-muted">
            <FlaskConical className="size-4" aria-hidden />
          </span>
          <div>
            <h2 className="text-sm font-semibold">Run a scenario</h2>
            <p className="text-[12px] text-muted-foreground">See how market shocks would move your net worth, using your real holdings.</p>
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

      <fieldset className="mt-4">
        <legend className="mb-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Market shocks</legend>
        <div className="flex flex-wrap gap-2">
          {SHOCKS.map((s) => {
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

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3" aria-live="polite">
        <Impact
          label="Net worth"
          before={formatGBP(netWorth.total)}
          after={formatGBP(r.netWorth)}
          delta={r.delta ? formatGBP(r.delta, { signed: true }) : undefined}
          tone={r.delta > 0 ? 'up' : r.delta < 0 ? 'down' : 'flat'}
        />
        <Impact
          label="Change"
          before="0.0%"
          after={`${r.drawdownPct.toFixed(1)}%`}
          tone={r.drawdownPct < 0 ? 'down' : 'flat'}
        />
        <Impact
          label="Cash (unaffected)"
          before={formatGBP(netWorth.cash)}
          after={formatGBP(netWorth.cash)}
          tone="flat"
        />
      </div>

      {active.length === 0 ? (
        <p className="mt-4 border-t pt-4 text-[12px] text-muted-foreground">Select one or more shocks to model their combined effect on your net worth.</p>
      ) : null}
      <p className="mt-3 text-[11px] text-muted-foreground">
        Illustrative stress test applying each shock to the relevant part of your holdings. Real events interact in ways a simple model cannot predict.
      </p>
    </Panel>
  )
}
