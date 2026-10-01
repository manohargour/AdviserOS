import { createUIMessageStreamResponse, streamText, toUIMessageStream } from 'ai'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { logActivity } from '@/lib/activity'
import { ensureSeeded, getClientBySlug, saveLetterDraft } from '@/lib/workspace'

export const maxDuration = 60

const RECOMMENDATION_PLACEHOLDER = '[ADVISER RECOMMENDATION - to be written by your adviser before sending]'

export async function POST(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return new Response('Unauthorized', { status: 401 })

  const { slug } = await params
  if (!/^[a-z0-9-]{1,64}$/.test(slug)) return new Response('Invalid client', { status: 400 })

  const userId = session.user.id
  await ensureSeeded(userId)
  const client = await getClientBySlug(userId, slug)
  if (!client) return new Response('Client not found', { status: 404 })

  const result = streamText({
    model: 'anthropic/claude-sonnet-5.5',
    system: `You draft annual review letters for a UK financial adviser named ${session.user.name}. The adviser edits and approves every letter before it is sent.

Rules:
- Use only the facts in the client record. Never invent figures, dates, products or events. If something important is missing, write [TO CONFIRM: what is missing] in place.
- Do not give advice or recommendations. Where the recommendation belongs, insert this line exactly, on its own: ${RECOMMENDATION_PLACEHOLDER}
- Plain-English, warm, professional UK style. Use GBP formatted like £1,240,000.
- Output plain text only: no Markdown, no headings, no bullet symbols other than a simple dash. Separate paragraphs with a blank line.
- Structure: greeting using the client's first name; thanks for the review; how the portfolio has changed since the last review; key changes in their circumstances; confirmation of their attitude to risk and how it was assessed; anything we still need from them; the recommendation placeholder; next steps; sign-off from ${session.user.name}.
- Keep it under 400 words.`,
    prompt: `Client record (JSON):\n${JSON.stringify(client)}\n\nWrite the draft annual review letter.`,
    onFinish: async ({ text }) => {
      if (!text.trim()) return
      await saveLetterDraft(userId, client, text.trim())
      await logActivity(userId, {
        action: 'letter.drafted',
        actor: 'assistant',
        summary: `Drafted the annual review letter for ${client.name}`,
        clientSlug: slug,
      })
    },
  })

  return createUIMessageStreamResponse({ stream: toUIMessageStream({ stream: result.stream }) })
}
