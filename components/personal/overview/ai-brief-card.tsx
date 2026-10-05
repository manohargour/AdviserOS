import Link from 'next/link'
import { ArrowRight, Compass, ShieldAlert } from 'lucide-react'
import { AiMark, Panel } from '@/components/personal/wealth/primitives'
import { AskAiButton } from '@/components/personal/shell/ask-ai-button'

export function AiBriefCard() {
  return (
    <Panel className="relative flex flex-col overflow-hidden border-ai/15 p-5">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-ai-soft/80 to-transparent" />
      <div className="relative flex items-center gap-3">
        <AiMark />
        <div>
          <h2 className="text-sm font-semibold">Your AI Wealth Brief</h2>
          <p className="text-[12px] text-muted-foreground">Updated 7:02am · Tuesday 29 September</p>
        </div>
      </div>

      <div className="relative mt-5 flex flex-1 flex-col gap-3 text-[14px] leading-relaxed text-foreground/90">
        <p className="text-pretty">
          Your portfolio gained <strong className="num font-semibold text-positive">2.8%</strong> this month, primarily driven by
          AI infrastructure and semiconductor holdings.
        </p>
        <p className="text-pretty">
          Your overall financial position remains healthy, but technology now represents{' '}
          <strong className="num font-semibold text-warning">41%</strong> of your investable assets.
        </p>
        <p className="text-pretty">
          Your largest hidden concentration is <strong className="font-semibold">Nvidia exposure</strong> across individual stocks,
          ETFs and pension funds.
        </p>
      </div>

      <div className="relative mt-5 flex flex-wrap gap-2 border-t pt-4">
        <AskAiButton question="Where am I overexposed?" variant="solid" />
        <Link
          href="/me/portfolio#hidden-exposure"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border bg-card px-3 text-[13px] font-medium hover:bg-muted"
        >
          <ShieldAlert className="size-3.5 text-warning" aria-hidden />
          View Risks
        </Link>
        <Link
          href="/me/opportunities"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border bg-card px-3 text-[13px] font-medium hover:bg-muted"
        >
          <Compass className="size-3.5 text-muted-foreground" aria-hidden />
          Review Opportunities
          <ArrowRight className="size-3 text-muted-foreground" aria-hidden />
        </Link>
      </div>
    </Panel>
  )
}
