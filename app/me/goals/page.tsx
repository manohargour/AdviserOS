import type { Metadata } from 'next'
import { GoalsBoard } from '@/components/personal/goals/goals-board'
import { requirePersonal } from '@/lib/roles'
import { getPersonalSnapshot } from '@/lib/personal/store'

export const metadata: Metadata = { title: 'Goals' }

export default async function GoalsPage() {
  const user = await requirePersonal()
  const snapshot = await getPersonalSnapshot(user)
  return <GoalsBoard goals={snapshot.goals} />
}
