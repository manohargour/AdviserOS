import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  tool,
  toUIMessageStream,
  type UIMessage,
} from 'ai'
import { headers } from 'next/headers'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { tasks } from '@/lib/db/schema'
import { ensureSeeded, getAlerts, getClientBySlug, getClients, getReviews, getTasks } from '@/lib/workspace'
import { logActivity } from '@/lib/activity'
import { getThread, saveThread, THREAD_ID_PATTERN, threadOwnedByAnotherUser } from '@/lib/chat-store'
import { AI_MODEL } from '@/lib/ai'
import { rateLimit, tooManyRequests } from '@/lib/rate-limit'

export const maxDuration = 60

const MAX_MESSAGES = 40

const requestSchema = z.object({
  id: z.string().regex(THREAD_ID_PATTERN),
  messages: z.array(z.any()).min(1).max(MAX_MESSAGES),
  clientSlug: z
    .string()
    .regex(/^[a-z0-9-]{1,64}$/)
    .optional(),
})

function instructionsFor(adviserName: string, clientSlug?: string) {
  return `You are AdviserOS, an assistant for UK financial advisers. You are working for ${adviserName}.

You prepare the work; the adviser gives the advice and makes every decision. Never present a recommendation as final advice, and flag anything that needs the adviser's judgement or confirmation.

Always use the tools to look up real data before answering questions about clients, reviews, tasks or alerts. Never invent client facts, figures or dates. If data is missing, say what is missing.

Money is in GBP. Format values like £1,240,000. Be concise and well structured: short headings, bullet points and small tables in Markdown. When drafting letters or notes, write them in a professional, plain-English UK style.

${clientSlug ? `The adviser is currently viewing the client with slug "${clientSlug}". Assume questions refer to this client unless they say otherwise.` : 'The adviser is viewing their whole client book.'}`
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return new Response('Unauthorized', { status: 401 })
  const userId = session.user.id

  const limited = rateLimit(`chat:${userId}`, 20, 60_000)
  if (!limited.ok) return tooManyRequests(limited.retryAfter)

  const parsed = requestSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return new Response('Invalid request', { status: 400 })
  const { id: threadId, messages, clientSlug } = parsed.data
  if (await threadOwnedByAnotherUser(userId, threadId)) return new Response('Forbidden', { status: 403 })
  await ensureSeeded(userId)

  const existingThread = await getThread(userId, threadId)
  const threadClientSlug = existingThread?.clientSlug ?? clientSlug ?? null
  if (!existingThread) {
    const contextClient = clientSlug ? await getClientBySlug(userId, clientSlug) : null
    await logActivity(userId, {
      actor: 'adviser',
      action: 'conversation.started',
      summary: contextClient
        ? `Started an AdviserOS conversation about ${contextClient.name}`
        : 'Started an AdviserOS conversation about the client book',
      clientSlug: contextClient ? clientSlug : null,
    })
  }

  const result = streamText({
    model: AI_MODEL,
    instructions: instructionsFor(session.user.name || 'the adviser', clientSlug),
    messages: await convertToModelMessages(messages as UIMessage[]),
    stopWhen: isStepCount(8),
    tools: {
      listClients: tool({
        description: "List every client in the adviser's book with headline figures.",
        inputSchema: z.object({}),
        execute: async () => {
          const book = await getClients(userId)
          return book.map((c) => ({
            slug: c.id,
            name: c.name,
            status: c.status,
            portfolioValue: c.portfolioValue,
            risk: `${c.risk.label} ${c.risk.score}/10`,
            nextReview: c.nextReview,
            reviewReadiness: c.reviewReadiness,
            meeting: c.meeting ?? null,
            changesSinceLastReview: c.changes.length,
            missingInformation: c.missing.length,
          }))
        },
      }),
      getClientProfile: tool({
        description:
          'Get the full profile for one client: holdings, goals, risk, changes since last review, outstanding items, missing information, notes, documents and activity.',
        inputSchema: z.object({ slug: z.string().describe('Client slug, for example "john-smith"') }),
        execute: async ({ slug }) => {
          const client = await getClientBySlug(userId, slug)
          return client ?? { error: `No client found with slug "${slug}".` }
        },
      }),
      listReviews: tool({
        description: 'List upcoming and in-progress client reviews with due dates and readiness.',
        inputSchema: z.object({}),
        execute: async () => {
          const rows = await getReviews(userId)
          return rows.map(({ userId: _u, ...r }) => r)
        },
      }),
      listTasks: tool({
        description: "List the adviser's tasks, including completed ones.",
        inputSchema: z.object({}),
        execute: async () => {
          const rows = await getTasks(userId)
          return rows.map(({ userId: _u, ...t }) => t)
        },
      }),
      listAlerts: tool({
        description: 'List active (not dismissed) alerts across the client book.',
        inputSchema: z.object({}),
        execute: async () => {
          const rows = await getAlerts(userId)
          return rows.map(({ userId: _u, ...a }) => a)
        },
      }),
      createTask: tool({
        description:
          "Add a follow-up task to the adviser's task list. Only use this when the adviser asks you to create, add or schedule a task.",
        inputSchema: z.object({
          title: z.string().min(3).max(200),
          client: z.string().min(1).max(100).describe('Client full name, or "General"'),
          due: z.string().min(1).max(40).describe('Short due label, for example "Today", "Fri" or "12 Oct"'),
        }),
        execute: async ({ title, client, due }) => {
          const [created] = await db
            .insert(tasks)
            .values({ userId, title, client, due, source: 'AdviserOS' })
            .returning({ id: tasks.id })
          const book = await getClients(userId)
          const matched = book.find((c) => c.name.toLowerCase() === client.toLowerCase())
          await logActivity(userId, {
            actor: 'assistant',
            action: 'task.created',
            summary: `AdviserOS added task "${title}" (due ${due})`,
            clientSlug: matched?.id ?? null,
          })
          return { created: true, id: created.id, title, client, due }
        },
      }),
    },
  })

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      originalMessages: messages as UIMessage[],
      onEnd: async ({ messages: finalMessages }) => {
        try {
          await saveThread(userId, threadId, threadClientSlug, finalMessages)
        } catch (error) {
          console.error('Failed to save AdviserOS conversation', error)
        }
      },
    }),
  })
}
