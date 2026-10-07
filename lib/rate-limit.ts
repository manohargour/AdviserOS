/**
 * Minimal fixed-window rate limiter.
 *
 * In-memory and therefore per-instance; it caps abuse and runaway cost on the
 * streaming AI endpoints without external infrastructure. For multi-instance
 * enforcement, back this with a shared store (e.g. Redis) using the same API.
 */
const buckets = new Map<string, number[]>()

export type RateLimitResult = { ok: true } | { ok: false; retryAfter: number }

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs)
  if (hits.length >= limit) {
    buckets.set(key, hits)
    return { ok: false, retryAfter: Math.ceil((windowMs - (now - hits[0])) / 1000) }
  }
  hits.push(now)
  buckets.set(key, hits)
  // Opportunistic cleanup so the map does not grow without bound.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (v.every((t) => now - t >= windowMs)) buckets.delete(k)
  }
  return { ok: true }
}

export function tooManyRequests(retryAfter: number) {
  return new Response('Too many requests. Please slow down.', {
    status: 429,
    headers: { 'Retry-After': String(retryAfter) },
  })
}
