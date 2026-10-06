import { describe, expect, it } from 'vitest'
import { rateLimit } from '@/lib/rate-limit'

describe('rateLimit', () => {
  it('allows requests up to the limit then blocks', () => {
    const key = `test-${Math.random()}`
    for (let i = 0; i < 5; i++) {
      expect(rateLimit(key, 5, 60_000).ok).toBe(true)
    }
    const blocked = rateLimit(key, 5, 60_000)
    expect(blocked.ok).toBe(false)
    if (!blocked.ok) expect(blocked.retryAfter).toBeGreaterThan(0)
  })

  it('tracks each key independently', () => {
    const a = `a-${Math.random()}`
    const b = `b-${Math.random()}`
    expect(rateLimit(a, 1, 60_000).ok).toBe(true)
    expect(rateLimit(a, 1, 60_000).ok).toBe(false)
    expect(rateLimit(b, 1, 60_000).ok).toBe(true)
  })
})
