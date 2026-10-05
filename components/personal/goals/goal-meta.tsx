import { Car, GraduationCap, Home, Palmtree, Sunrise, Target } from 'lucide-react'
import type { Goal, GoalStatus } from '@/lib/personal/data'
import { cn } from '@/lib/utils'

export const goalIcons = {
  freedom: Sunrise,
  education: GraduationCap,
  home: Home,
  retirement: Palmtree,
  car: Car,
  other: Target,
} as const

export function GoalIcon({ icon, className }: { icon: Goal['icon'] | 'other'; className?: string }) {
  const Icon = goalIcons[icon] ?? Target
  return (
    <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground/80', className)}>
      <Icon className="size-4" aria-hidden />
    </span>
  )
}

export function statusTone(status: GoalStatus) {
  if (status === 'Ahead') return 'positive' as const
  if (status === 'On Track') return 'neutral' as const
  return 'warning' as const
}

export function confidenceLabel(probability: number) {
  if (probability >= 85) return 'High confidence'
  if (probability >= 72) return 'Good confidence'
  if (probability >= 60) return 'Moderate confidence'
  return 'Low confidence'
}
