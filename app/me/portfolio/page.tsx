import { Suspense } from 'react'
import type { Metadata } from 'next'
import { PortfolioView } from '@/components/personal/portfolio/portfolio-view'

export const metadata: Metadata = { title: 'Portfolio' }

export default function PortfolioPage() {
  return (
    <Suspense>
      <PortfolioView />
    </Suspense>
  )
}
