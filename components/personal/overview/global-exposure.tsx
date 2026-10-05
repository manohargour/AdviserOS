import { AlertTriangle } from 'lucide-react'
import { currency, geography } from '@/lib/personal/data'
import { Panel, PanelHeader } from '@/components/personal/wealth/primitives'
import { AskAiButton } from '@/components/personal/shell/ask-ai-button'

const spending: Record<string, number> = { GBP: 68, INR: 30, USD: 2, EUR: 0 }

function StackedBar({ data, label }: { data: { name: string; value: number; color: string }[]; label: string }) {
  return (
    <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full" role="img" aria-label={label}>
      {data.map((d) => (
        <div key={d.name} className="h-full first:rounded-l-full last:rounded-r-full" style={{ width: `${d.value}%`, background: d.color }} />
      ))}
    </div>
  )
}

export function GlobalExposure({ className }: { className?: string }) {
  return (
    <Panel className={className}>
      <PanelHeader
        title="Global exposure"
        description="Where your money is invested, and the currencies it is priced in."
        action={<AskAiButton question="Where am I overexposed?" variant="ghost">Explain</AskAiButton>}
      />
      <div className="grid gap-8 p-5 md:grid-cols-2">
        <div>
          <h3 className="mb-3 text-[12px] font-medium tracking-wide text-muted-foreground uppercase">Geography</h3>
          <StackedBar data={geography} label="Geographic exposure" />
          <ul className="mt-4 flex flex-col gap-3">
            {geography.map((g) => (
              <li key={g.name} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5 text-[13px]">
                <span className="flex items-center gap-2">
                  <span className="size-2 rounded-full" style={{ background: g.color }} aria-hidden />
                  {g.name}
                </span>
                <span className="num font-medium">{g.value}%</span>
                <div className="col-span-2 h-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full" style={{ width: `${g.value}%`, background: g.color }} />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-[12px] font-medium tracking-wide text-muted-foreground uppercase">Currency · assets vs. future spending</h3>
          <StackedBar data={currency} label="Currency exposure" />
          <ul className="mt-4 flex flex-col gap-3">
            {currency.map((c) => (
              <li key={c.name} className="text-[13px]">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="size-2 rounded-full" style={{ background: c.color }} aria-hidden />
                    <span className="font-mono text-[12px] font-medium">{c.name}</span>
                  </span>
                  <span className="num text-muted-foreground">
                    <span className="font-medium text-foreground">{c.value}%</span> assets · {spending[c.name]}% spending
                  </span>
                </div>
                <div className="relative h-1 rounded-full bg-muted">
                  <div className="h-full rounded-full" style={{ width: `${c.value}%`, background: c.color }} />
                  <span
                    className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 rounded-full bg-foreground/70"
                    style={{ left: `${spending[c.name]}%` }}
                    aria-hidden
                  />
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex gap-2.5 rounded-xl border border-warning/20 bg-warning-soft p-3 text-[12px] leading-relaxed">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden />
            <p className="text-foreground/85 text-pretty">
              Your spending liabilities are primarily GBP and INR while 51% of your portfolio is USD denominated.
            </p>
          </div>
        </div>
      </div>
    </Panel>
  )
}
