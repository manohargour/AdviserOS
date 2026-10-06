import type { Metadata } from 'next'
import { InsightsFeed } from '@/components/personal/insights/insights-feed'
import { requirePersonal } from '@/lib/roles'
import { getPersonalSnapshot } from '@/lib/personal/store'
import { derivePersonalInsights } from '@/lib/personal/insights'

export const metadata: Metadata = { title: 'Insights' }

export default async function InsightsPage() {
  const user = await requirePersonal()
  const s = await getPersonalSnapshot(user)
  const insights = derivePersonalInsights({
    netWorth: s.netWorth,
    portfolio: s.portfolio,
    holdings: s.holdings,
    allocation: s.allocation,
    goals: s.goals,
    profile: s.profile,
  })
  return (
    <div className="flex flex-col gap-8">
      <InsightsFeed insights={insights} />
    </div>
  )
}
