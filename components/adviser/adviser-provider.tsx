'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, generateId, type UIMessage } from 'ai'
import { usePathname, useRouter } from 'next/navigation'
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import useSWR from 'swr'
import { getClient, type Client } from '@/lib/data'

export type AdviserMessage = UIMessage

export type ThreadSummary = {
  id: string
  title: string
  clientSlug: string | null
  updatedAt: string
}

const fetchJson = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

type AdviserContextValue = {
  messages: AdviserMessage[]
  isWorking: boolean
  error?: Error
  send: (prompt: string) => void
  stop: () => void
  retry: () => void
  clear: () => void
  threadId: string
  threads: ThreadSummary[]
  threadsLoading: boolean
  openThread: (id: string) => Promise<void>
  removeThread: (id: string) => Promise<void>
  contextClient?: Client
  panelOpen: boolean
  setPanelOpen: (open: boolean) => void
  confirmed: Record<string, boolean>
  setConfirmed: (id: string, value: boolean) => void
  dismissed: Record<string, boolean>
  dismiss: (id: string) => void
}

const AdviserContext = createContext<AdviserContextValue | null>(null)

function clientIdFromPath(pathname: string) {
  const match = pathname.match(/^\/(?:clients|reviews)\/([^/]+)/)
  return match ? match[1] : undefined
}

export function AdviserProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const contextSlug = clientIdFromPath(pathname)
  const contextClient = useMemo(() => (contextSlug ? getClient(contextSlug) : undefined), [contextSlug])

  const slugRef = useRef(contextSlug)
  slugRef.current = contextSlug

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/adviser/chat',
        body: () => ({ clientSlug: slugRef.current }),
      }),
    [],
  )

  const [thread, setThread] = useState<{ id: string; messages: AdviserMessage[] }>(() => ({
    id: generateId(),
    messages: [],
  }))

  const {
    data: threads = [],
    isLoading: threadsLoading,
    mutate: refreshThreads,
  } = useSWR<ThreadSummary[]>('/api/adviser/threads', fetchJson, { revalidateOnFocus: false })

  const { messages, sendMessage, status, stop, error, regenerate, clearError } = useChat({
    id: thread.id,
    messages: thread.messages,
    transport,
    onFinish: ({ message }) => {
      refreshThreads()
      if (message.parts.some((part) => part.type === 'tool-createTask')) router.refresh()
    },
  })

  const isWorking = status === 'submitted' || status === 'streaming'

  const [panelOpen, setPanelOpen] = useState(false)
  const [confirmed, setConfirmedState] = useState<Record<string, boolean>>({})
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({})

  const send = useCallback(
    (prompt: string) => {
      const text = prompt.trim()
      if (!text || isWorking) return
      setPanelOpen(true)
      sendMessage({ text })
    },
    [isWorking, sendMessage],
  )

  const clear = useCallback(() => {
    stop()
    clearError()
    setThread({ id: generateId(), messages: [] })
  }, [stop, clearError])

  const openThread = useCallback(
    async (id: string) => {
      stop()
      clearError()
      const saved = await fetchJson<{ id: string; messages: AdviserMessage[] }>(
        `/api/adviser/threads/${encodeURIComponent(id)}`,
      )
      setThread({ id: saved.id, messages: saved.messages })
      setPanelOpen(true)
    },
    [stop, clearError],
  )

  const removeThread = useCallback(
    async (id: string) => {
      await fetch(`/api/adviser/threads/${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (id === thread.id) setThread({ id: generateId(), messages: [] })
      refreshThreads()
    },
    [thread.id, refreshThreads],
  )

  const retry = useCallback(() => {
    clearError()
    regenerate()
  }, [clearError, regenerate])

  const setConfirmed = useCallback((id: string, value: boolean) => {
    setConfirmedState((prev) => ({ ...prev, [id]: value }))
  }, [])

  const dismiss = useCallback((id: string) => setDismissed((prev) => ({ ...prev, [id]: true })), [])

  const value = useMemo(
    () => ({
      messages,
      isWorking,
      error,
      send,
      stop,
      retry,
      clear,
      threadId: thread.id,
      threads,
      threadsLoading,
      openThread,
      removeThread,
      contextClient,
      panelOpen,
      setPanelOpen,
      confirmed,
      setConfirmed,
      dismissed,
      dismiss,
    }),
    [
      messages,
      isWorking,
      error,
      send,
      stop,
      retry,
      clear,
      thread.id,
      threads,
      threadsLoading,
      openThread,
      removeThread,
      contextClient,
      panelOpen,
      confirmed,
      setConfirmed,
      dismissed,
      dismiss,
    ],
  )

  return <AdviserContext.Provider value={value}>{children}</AdviserContext.Provider>
}

export function useAdviser() {
  const ctx = useContext(AdviserContext)
  if (!ctx) throw new Error('useAdviser must be used within AdviserProvider')
  return ctx
}

export function useReviewProgress(client: Client) {
  const { confirmed } = useAdviser()
  const total = client.outstanding.length
  const done = client.outstanding.filter((item) => confirmed[item.id]).length
  const base = client.reviewReadiness
  const readiness = total === 0 ? base : Math.round(base + ((100 - base) * done) / total)
  return { total, done, remaining: total - done, readiness }
}
