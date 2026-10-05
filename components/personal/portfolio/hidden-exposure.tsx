import Link from 'next/link'
import { ArrowRight, Briefcase, Cpu } from 'lucide-react'
import { hiddenExposures } from '@/lib/personal/data'
import { AiMark, Panel, Pill } from '@/components/personal/wealth/primitives'
import { AskAiButton } from '@/components/personal/shell/ask-ai-button'

const segColors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)']

function NvidiaCard() {
  const e = hiddenExposures[0]
  return (
    <Panel className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-negative-soft text-negative">
            <Cpu className="size-4" aria-hidden />
          </span>
          <h3 className="text-[15px] font-semibold tracking-tight">{e.title}</h3>
        </div>
        <Pill tone="negative">High concentration</Pill>
      </div>

      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-[12px] text-muted-foreground">Effective exposure</p>
          <p className="num text-3xl font-semibold tracking-tight">{e.effective}%</p>
        </div>
        <div className="text-right">
          <p className="text-[12px] text-muted-foreground">Appears as</p>
          <p className="num text-lg font-medium text-muted-foreground line-through decoration-1">10.2%</p>
        </div>
      </div>

      <div className="mt-4 flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-muted" role="img" aria-label="Breakdown of Nvidia ecosystem exposure">
        {e.breakdown.map((b, i) => (
          <div key={b.label} className="h-full" style={{ width: `${(b.value / 25) * 100}%`, background: segColors[i] }} />
        ))}
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-[13px]">
        {e.breakdown.map((b, i) => (
          <li key={b.label} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="size-2 rounded-[2px]" style={{ background: segColors[i] }} aria-hidden />
              {b.label}
            </span>
            <span className="num font-medium">{b.value}%</span>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex items-start gap-3 rounded-xl bg-ai-soft/70 p-3.5">
        <AiMark size="sm" className="bg-card" />
        <p className="text-[13px] leading-relaxed text-pretty">{e.explanation}</p>
      </div>
      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        <Link href="/me/opportunities" className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-[13px] font-medium text-primary-foreground hover:bg-primary/90">
          See diversification options <ArrowRight className="size-3.5" aria-hidden />
        </Link>
        <AskAiButton question="What happens if US technology falls 30%?" variant="ghost">Stress test</AskAiButton>
      </div>
    </Panel>
  )
}

function EmployerCard() {
  const e = hiddenExposures[1]
  return (
    <Panel className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-negative-soft text-negative">
            <Briefcase className="size-4" aria-hidden />
          </span>
          <h3 className="text-[15px] font-semibold tracking-tight">{e.title}</h3>
        </div>
        <Pill tone="negative">High concentration</Pill>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl border p-3">
          <p className="text-[12px] text-muted-foreground">BP in liquid portfolio</p>
          <p className="num mt-0.5 text-2xl font-semibold tracking-tight">28.2%</p>
          <p className="num text-[11px] text-muted-foreground">£173,000 · pension</p>
        </div>
        <div className="rounded-xl border p-3">
          <p className="text-[12px] text-muted-foreground">Income linked to BP</p>
          <p className="num mt-0.5 text-2xl font-semibold tracking-tight">100%</p>
          <p className="text-[11px] text-muted-foreground">Salary · bonus · share scheme</p>
        </div>
      </div>

      <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground text-pretty">
        Recommended ceiling for a single stock, given your goals: <span className="num font-medium text-foreground">10%</span>. Reducing to that level
        inside the pension carries no tax cost.
      </p>

      <div className="mt-5 flex items-start gap-3 rounded-xl bg-ai-soft/70 p-3.5">
        <AiMark size="sm" className="bg-card" />
        <p className="text-[13px] leading-relaxed text-pretty">{e.explanation}</p>
      </div>
      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        <Link href="/me/opportunities" className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-[13px] font-medium text-primary-foreground hover:bg-primary/90">
          See diversification options <ArrowRight className="size-3.5" aria-hidden />
        </Link>
        <AskAiButton question="Where am I overexposed?" variant="ghost">Explain</AskAiButton>
      </div>
    </Panel>
  )
}

export function HiddenExposure() {
  return (
    <section id="hidden-exposure" aria-labelledby="hidden-exposure-title" className="scroll-mt-24">
      <div className="mb-3 flex items-center gap-2.5">
        <AiMark size="sm" />
        <div>
          <h2 id="hidden-exposure-title" className="text-sm font-semibold">Hidden Exposure</h2>
          <p className="text-[12px] text-muted-foreground">Overlap across stocks, ETFs, mutual funds, pensions and employer stock — looked through to the underlying holdings.</p>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <NvidiaCard />
        <EmployerCard />
      </div>
    </section>
  )
}
