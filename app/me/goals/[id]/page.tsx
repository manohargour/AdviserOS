import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { GoalDetail } from '@/components/personal/goals/goal-detail'
import { requirePersonal } from '@/lib/roles'
import { getPersonalSnapshot } from '@/lib/personal/store'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const user = await requirePersonal()
  const snapshot = await getPersonalSnapshot(user)
  return { title: snapshot.goals.find((g) => g.id === id)?.name ?? 'Goal' }
}

export default async function GoalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requirePersonal()
  const snapshot = await getPersonalSnapshot(user)
  const goal = snapshot.goals.find((g) => g.id === id)
  if (!goal) notFound()
  return <GoalDetail goal={goal} />
}
