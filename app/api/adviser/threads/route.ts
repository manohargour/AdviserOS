import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { listThreads } from '@/lib/chat-store'

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return new Response('Unauthorized', { status: 401 })
  return Response.json(await listThreads(session.user.id))
}
