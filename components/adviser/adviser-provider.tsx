'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { usePathname, useRouter } from 'next/navigation'
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { getClient, type Client } from '@/lib/data'

export type AdviserMessage = UIMessage

type AdviserContextValue = {
  messages: AdviserMessage[]
  isWorking: boolean
  error?: Error
  send: (prompt: string) => void
  stop: () => void
  retry: () => void
  clear: () => void
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

  const { messages, sendMessage, status, stop, error, regenerate, setMessages, clearError } = useChat({
    transport,
    onFinish: ({ message }) => {
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
    setMessages([])
  }, [stop, clearError, setMessages])

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
      contextClient,
      panelOpen,
      setPanelOpen,
      confirmed,
      setConfirmed,
      dismissed,
      dismiss,
    }),
    [messages, isWorking, error, send, stop, retry, clear, contextClient, panelOpen, confirmed, setConfirmed, dismissed, dismiss],
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
