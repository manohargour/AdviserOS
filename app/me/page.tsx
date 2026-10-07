import { NetWorthCard } from '@/components/personal/overview/net-worth-card'
import { SummaryCards } from '@/components/personal/overview/summary-cards'
import { AiBriefCard } from '@/components/personal/overview/ai-brief-card'
import { FreedomCard } from '@/components/personal/overview/freedom-card'
import { HealthCard } from '@/components/personal/overview/health-card'
import { GlobalExposure } from '@/components/personal/overview/global-exposure'
import { AllocationDonut } from '@/components/personal/wealth/allocation-donut'
import { PageHeader } from '@/components/personal/wealth/primitives'
import { requirePersonal } from '@/lib/roles'
import { getPersonalSnapshot } from '@/lib/personal/store'
import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'

export default async function OverviewPage() {
  const user = await requirePersonal()
  const snapshot = await getPersonalSnapshot(user)
  const firstName = snapshot.profile.firstName
  const headlineGoal = snapshot.goals.find((g) => g.icon === 'freedom') ?? snapshot.goals[0]
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        title={`Hello, ${firstName}`}
        description="Here’s how your wealth is tracking."
      />
      {snapshot.isEmpty ? (
        <Link
          href="/me/add"
          className="group flex flex-col gap-3 rounded-2xl border border-ai/20 bg-ai-soft/40 p-5 transition-colors hover:bg-ai-soft/60 sm:flex-row sm:items-center sm:justify-between"
        >
          <span className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-card text-ai">
              <Sparkles className="size-5" aria-hidden />
            </span>
            <span>
              <span className="block text-[15px] font-semibold">See your entire financial life in one place</span>
              <span className="block text-[13px] text-muted-foreground">Import a statement or add an account to build your wealth picture.</span>
            </span>
          </span>
          <span className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-[13px] font-medium text-primary-foreground group-hover:bg-primary/90">
            Build my wealth picture
            <ArrowRight className="size-4" aria-hidden />
          </span>
        </Link>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-3">
        <NetWorthCard netWorth={snapshot.netWorth} series={snapshot.netWorthSeries} />
        <AiBriefCard netWorth={snapshot.netWorth} assetAllocation={snapshot.allocation.asset} isEmpty={snapshot.isEmpty} />
      </div>
      <SummaryCards netWorth={snapshot.netWorth} />
      <div className="grid gap-4 lg:grid-cols-3">
        <FreedomCard goal={headlineGoal} />
        <HealthCard health={snapshot.health} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <AllocationDonut allocation={snapshot.allocation} />
        <GlobalExposure geography={snapshot.allocation.geography} currency={snapshot.allocation.currency} className="lg:col-span-2" />
      </div>
    </div>
  )
}
