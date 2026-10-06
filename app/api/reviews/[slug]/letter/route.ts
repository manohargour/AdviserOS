import { createUIMessageStreamResponse, streamText, toUIMessageStream } from 'ai'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { logActivity } from '@/lib/activity'
import { ensureSeeded, getClientBySlug, saveLetterDraft } from '@/lib/workspace'
import { AI_MODEL } from '@/lib/ai'
import { rateLimit, tooManyRequests } from '@/lib/rate-limit'

export const maxDuration = 60

const RECOMMENDATION_PLACEHOLDER = '[ADVISER RECOMMENDATION - to be written by your adviser before sending]'

export async function POST(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return new Response('Unauthorized', { status: 401 })

  const { slug } = await params
  if (!/^[a-z0-9-]{1,64}$/.test(slug)) return new Response('Invalid client', { status: 400 })

  const userId = session.user.id
  const limited = rateLimit(`letter:${userId}`, 10, 60_000)
  if (!limited.ok) return tooManyRequests(limited.retryAfter)
  await ensureSeeded(userId)
  const client = await getClientBySlug(userId, slug)
  if (!client) return new Response('Client not found', { status: 404 })

  const result = streamText({
    model: AI_MODEL,
    system: `You draft annual review letters for a UK financial adviser named ${session.user.name}. The adviser edits and approves every letter before it is sent.

Rules:
- Use only the facts in the client record. Never invent figures, dates, products or events. If something important is missing, write [TO CONFIRM: what is missing] in place.
- Do not give advice or recommendations. Where the recommendation belongs, insert this line exactly, on its own: ${RECOMMENDATION_PLACEHOLDER}
- Write as an experienced UK wealth manager: formal, measured, concise and factual. Use GBP formatted like £1,240,000 and dates like 12 October 2026.
- Avoid filler and AI-sounding phrasing. Never use: "I hope this finds you well", "delighted", "thrilled", "exciting", "journey", "rest assured", "navigate", "landscape", "delve", "robust", exclamation marks, or em dashes.
- State figures plainly with their source date. Use short paragraphs and do not repeat the same point twice.
- Open with "Dear [title or first name]," and close with "Yours sincerely," followed by the adviser's name and "Financial Adviser".
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
