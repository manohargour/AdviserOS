import type { Metadata } from 'next'
import { OpportunitiesBoard } from '@/components/personal/opportunities/opportunities-board'
import { requirePersonal } from '@/lib/roles'
import { getPersonalSnapshot } from '@/lib/personal/store'
import { derivePersonalOpportunities } from '@/lib/personal/insights'

export const metadata: Metadata = { title: 'Opportunities' }

export default async function OpportunitiesPage() {
  const user = await requirePersonal()
  const s = await getPersonalSnapshot(user)
  const opportunities = derivePersonalOpportunities({
    netWorth: s.netWorth,
    portfolio: s.portfolio,
    holdings: s.holdings,
    allocation: s.allocation,
    goals: s.goals,
    profile: s.profile,
  })
  return <OpportunitiesBoard opportunities={opportunities} />
}
