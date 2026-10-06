import { describe, expect, it } from 'vitest'
import { deriveGoalStatus, projectGoalValue } from '@/lib/personal/projection'

describe('projectGoalValue', () => {
  it('returns the current value when there is no time and no contribution', () => {
    expect(projectGoalValue(1000, 0, 0, 5)).toBe(1000)
  })

  it('grows with contributions and compounding', () => {
    const v = projectGoalValue(10_000, 500, 10, 6)
    // 10 years of £500/month plus growth on £10k is comfortably over £80k.
    expect(v).toBeGreaterThan(80_000)
  })

  it('is monotonic in the contribution amount', () => {
    const low = projectGoalValue(5000, 100, 5, 4)
    const high = projectGoalValue(5000, 300, 5, 4)
    expect(high).toBeGreaterThan(low)
  })
})

describe('deriveGoalStatus', () => {
  it('marks a well-funded goal as Ahead with high probability', () => {
    const { status, probability } = deriveGoalStatus(900_000, 1_000_000, 4000, 2031, 6, 2026)
    expect(status).toBe('Ahead')
    expect(probability).toBeGreaterThanOrEqual(85)
  })

  it('marks an underfunded goal as Behind with low probability', () => {
    const { status, probability } = deriveGoalStatus(5_000, 500_000, 50, 2028, 3, 2026)
    expect(status).toBe('Behind')
    expect(probability).toBeLessThan(40)
  })

  it('clamps probability to the 8–96 range', () => {
    const { probability } = deriveGoalStatus(10_000_000, 1000, 0, 2027, 10, 2026)
    expect(probability).toBeLessThanOrEqual(96)
    expect(probability).toBeGreaterThanOrEqual(8)
  })

  it('handles a zero target without dividing by zero', () => {
    const { probability } = deriveGoalStatus(1000, 0, 0, 2030, 5, 2026)
    expect(Number.isFinite(probability)).toBe(true)
  })
})
