import type { Metadata } from 'next'
import { GoalsBoard } from '@/components/personal/goals/goals-board'

export const metadata: Metadata = { title: 'Goals' }

export default function GoalsPage() {
  return <GoalsBoard />
}
