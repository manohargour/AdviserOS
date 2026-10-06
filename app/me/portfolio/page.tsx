import { Suspense } from 'react'
import type { Metadata } from 'next'
import { PortfolioView } from '@/components/personal/portfolio/portfolio-view'
import { requirePersonal } from '@/lib/roles'
import { getPersonalSnapshot } from '@/lib/personal/store'

export const metadata: Metadata = { title: 'Portfolio' }

export default async function PortfolioPage() {
  const user = await requirePersonal()
  const snapshot = await getPersonalSnapshot(user)
  return (
    <Suspense>
      <PortfolioView data={{ portfolio: snapshot.portfolio, holdings: snapshot.holdings, allocation: snapshot.allocation }} />
    </Suspense>
  )
}
