import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { deleteThread, getThread } from '@/lib/chat-store'

async function userId() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user?.id ?? null
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const uid = await userId()
  if (!uid) return new Response('Unauthorized', { status: 401 })
  const thread = await getThread(uid, (await params).id)
  if (!thread) return new Response('Not found', { status: 404 })
  return Response.json({ id: thread.id, title: thread.title, clientSlug: thread.clientSlug, messages: thread.messages })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const uid = await userId()
  if (!uid) return new Response('Unauthorized', { status: 401 })
  await deleteThread(uid, (await params).id)
  return new Response(null, { status: 204 })
}
