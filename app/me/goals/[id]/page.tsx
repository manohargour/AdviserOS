import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getGoal, goals } from '@/lib/personal/data'
import { GoalDetail } from '@/components/personal/goals/goal-detail'

export function generateStaticParams() {
  return goals.map((g) => ({ id: g.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  return { title: getGoal(id)?.name ?? 'Goal' }
}

export default async function GoalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const goal = getGoal(id)
  if (!goal) notFound()
  return <GoalDetail goal={goal} />
}
