import type { Metadata } from 'next'
import { InsightsFeed } from '@/components/personal/insights/insights-feed'
import { InvestorBehaviour } from '@/components/personal/insights/investor-behaviour'

export const metadata: Metadata = { title: 'Insights' }

export default function InsightsPage() {
  return (
    <div className="flex flex-col gap-8">
      <InsightsFeed />
      <InvestorBehaviour />
    </div>
  )
}
