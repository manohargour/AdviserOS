import { timingSafeEqual } from 'node:crypto'
import { findDemoUserId, resetDemoWorkspace } from '@/lib/demo'

export const dynamic = 'force-dynamic'

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const expected = Buffer.from(`Bearer ${secret}`)
  const received = Buffer.from(request.headers.get('authorization') ?? '')
  return received.length === expected.length && timingSafeEqual(received, expected)
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = await findDemoUserId()
  if (!userId) return Response.json({ reset: false, reason: 'Demo account not found' })

  await resetDemoWorkspace(userId)
  return Response.json({ reset: true, at: new Date().toISOString() })
}
