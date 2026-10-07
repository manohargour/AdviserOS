import Link from 'next/link'
import { ArrowRight, Compass, ShieldAlert } from 'lucide-react'
import type { AllocationSlice } from '@/lib/personal/data'
import type { NetWorth } from '@/lib/personal/store'
import { formatGBP, formatPct } from '@/lib/personal/format'
import { AiMark, Panel } from '@/components/personal/wealth/primitives'
import { AskAiButton } from '@/components/personal/shell/ask-ai-button'

export function AiBriefCard({
  netWorth,
  assetAllocation,
  isEmpty,
}: {
  netWorth: NetWorth
  assetAllocation: AllocationSlice[]
  isEmpty: boolean
}) {
  const topAsset = assetAllocation[0]
  return (
    <Panel className="relative flex flex-col overflow-hidden border-ai/15 p-5">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-ai-soft/80 to-transparent" />
      <div className="relative flex items-center gap-3">
        <AiMark />
        <div>
          <h2 className="text-sm font-semibold">Your AI Wealth Brief</h2>
          <p className="text-[12px] text-muted-foreground">Based on the accounts and holdings you have entered</p>
        </div>
      </div>

      <div className="relative mt-5 flex flex-1 flex-col gap-3 text-[14px] leading-relaxed text-foreground/90">
        {isEmpty ? (
          <p className="text-pretty">
            Add your accounts, holdings and goals to get a personalised brief. Everything here is computed from your own data —
            nothing is shared with anyone.
          </p>
        ) : (
          <>
            <p className="text-pretty">
              Your net worth is <strong className="num font-semibold">{formatGBP(netWorth.total)}</strong>, a change of{' '}
              <strong className={`num font-semibold ${netWorth.monthChange >= 0 ? 'text-positive' : 'text-negative'}`}>
                {formatPct(netWorth.monthChangePct, { signed: true })}
              </strong>{' '}
              this month.
            </p>
            {topAsset ? (
              <p className="text-pretty">
                Your largest asset class is <strong className="font-semibold">{topAsset.name}</strong> at{' '}
                <strong className={`num font-semibold ${topAsset.value >= 40 ? 'text-warning' : ''}`}>{topAsset.value}%</strong>{' '}
                of your investments.
              </p>
            ) : (
              <p className="text-pretty">Add holdings to see how your investments are allocated.</p>
            )}
            <p className="text-pretty">
              Review your concentration and currency exposure to check they match your goals and future spending.
            </p>
          </>
        )}
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
