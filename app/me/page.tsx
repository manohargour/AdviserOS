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
