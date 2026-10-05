import { health } from '@/lib/personal/data'
import { Meter, Panel, PanelHeader } from '@/components/personal/wealth/primitives'

function toneFor(score: number) {
  if (score >= 85) return 'positive' as const
  if (score >= 72) return 'ink' as const
  return 'warning' as const
}

export function HealthCard() {
  const r = 44
  const c = 2 * Math.PI * r
  const arc = c * 0.75
  const filled = arc * (health.score / 100)

  return (
    <Panel className="flex flex-col pb-5">
      <PanelHeader title="Portfolio health" description="Structural quality of your plan, not performance." />
      <div className="mt-4 flex items-center gap-5 px-5">
        <div className="relative size-28 shrink-0">
          <svg viewBox="0 0 100 100" className="size-full rotate-[135deg]" aria-hidden>
            <circle cx="50" cy="50" r={r} fill="none" stroke="var(--muted)" strokeWidth="6" strokeDasharray={`${arc} ${c}`} strokeLinecap="round" />
            <circle cx="50" cy="50" r={r} fill="none" stroke="var(--primary)" strokeWidth="6" strokeDasharray={`${filled} ${c}`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="num text-3xl font-semibold tracking-tight">{health.score}</span>
            <span className="text-[11px] text-muted-foreground">of 100</span>
          </div>
        </div>
        <p className="text-[13px] leading-relaxed text-muted-foreground text-pretty">
          <span className="font-medium text-foreground">Sound foundations.</span> Goal alignment and liquidity are strong;
          concentration and tax efficiency have the most room to improve.
        </p>
      </div>
      <ul className="mt-5 flex flex-col gap-3.5 px-5">
        {health.factors.map((f) => (
          <li key={f.name}>
            <div className="mb-1.5 flex items-baseline justify-between gap-2 text-[13px]">
              <span className="font-medium">{f.name}</span>
              <span className="num text-muted-foreground">{f.score}</span>
            </div>
            <Meter value={f.score} tone={toneFor(f.score)} label={`${f.name} score`} />
            <p className="mt-1 text-[11px] text-muted-foreground">{f.note}</p>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
