import type { GoalStatus } from '@/lib/personal/data'

/** Monthly-compounded projection of a goal's value to its target year. */
export function projectGoalValue(current: number, monthly: number, years: number, rate: number) {
  let v = current
  for (let m = 0; m < Math.round(years * 12); m++) v = v * (1 + rate / 100 / 12) + monthly
  return v
}

/** Derives a goal's status and success probability from its inputs. */
export function deriveGoalStatus(
  current: number,
  target: number,
  monthly: number,
  targetYear: number,
  expectedReturn: number,
  currentYear = new Date().getFullYear(),
) {
  const years = Math.max(1, targetYear - currentYear)
  const projected = projectGoalValue(current, monthly, years, expectedReturn)
  const ratio = target > 0 ? projected / target : 0
  const probability = Math.max(8, Math.min(96, Math.round(40 + (ratio - 1) * 120 + 35)))
  const status: GoalStatus = ratio >= 1.15 ? 'Ahead' : ratio >= 1 ? 'On Track' : ratio >= 0.85 ? 'Slightly Behind' : 'Behind'
  return { status, probability }
}
