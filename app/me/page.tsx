import { NetWorthCard } from '@/components/personal/overview/net-worth-card'
import { SummaryCards } from '@/components/personal/overview/summary-cards'
import { AiBriefCard } from '@/components/personal/overview/ai-brief-card'
import { FreedomCard } from '@/components/personal/overview/freedom-card'
import { HealthCard } from '@/components/personal/overview/health-card'
import { GlobalExposure } from '@/components/personal/overview/global-exposure'
import { AllocationDonut } from '@/components/personal/wealth/allocation-donut'
import { PageHeader } from '@/components/personal/wealth/primitives'
import { requirePersonal } from '@/lib/roles'

export default async function OverviewPage() {
  const user = await requirePersonal()
  const firstName = user.name.split(/\s+/)[0] || 'there'
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        title={`Hello, ${firstName}`}
        description="Here’s how your wealth is tracking."
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <NetWorthCard />
        <AiBriefCard />
      </div>
      <SummaryCards />
      <div className="grid gap-4 lg:grid-cols-3">
        <FreedomCard />
        <HealthCard />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <AllocationDonut />
        <GlobalExposure className="lg:col-span-2" />
      </div>
    </div>
  )
}
