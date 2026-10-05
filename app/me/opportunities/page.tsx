import type { Metadata } from 'next'
import { OpportunitiesBoard } from '@/components/personal/opportunities/opportunities-board'

export const metadata: Metadata = { title: 'Opportunities' }

export default function OpportunitiesPage() {
  return <OpportunitiesBoard />
}
