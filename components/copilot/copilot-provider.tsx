'use client'

import { usePathname } from 'next/navigation'
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { planFor, type CopilotPlan } from '@/lib/copilot-engine'
import { getClient, type Client } from '@/lib/data'

export type CopilotMessage =
  | { id: string; role: 'user'; text: string }
  | { id: string; role: 'copilot'; plan: CopilotPlan; visibleSteps: number; done: boolean }

type CopilotContextValue = {
  messages: CopilotMessage[]
  isWorking: boolean
  send: (prompt: string) => void
  clear: () => void
  contextClient?: Client
  panelOpen: boolean
  setPanelOpen: (open: boolean) => void
  confirmed: Record<string, boolean>
  setConfirmed: (id: string, value: boolean) => void
  dismissed: Record<string, boolean>
  dismiss: (id: string) => void
}

const CopilotContext = createContext<CopilotContextValue | null>(null)

const STEP_DELAY = 420

function clientIdFromPath(pathname: string) {
  const match = pathname.match(/^\/(?:clients|reviews)\/([^/]+)/)
  return match ? match[1] : undefined
}

export function CopilotProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const contextClient = useMemo(() => {
    const id = clientIdFromPath(pathname)
    return id ? getClient(id) : undefined
  }, [pathname])

  const [messages, setMessages] = useState<CopilotMessage[]>([])
  const [isWorking, setIsWorking] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [confirmed, setConfirmedState] = useState<Record<string, boolean>>({})
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({})
  const counter = useRef(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const send = useCallback(
    (prompt: string) => {
      const trimmed = prompt.trim()
      if (!trimmed) return
      const plan = planFor(trimmed, contextClient?.id)
      const userId = `m${counter.current++}`
      const copilotId = `m${counter.current++}`
      setPanelOpen(true)
      setIsWorking(true)
      setMessages((prev) => [
        ...prev,
        { id: userId, role: 'user', text: trimmed },
        { id: copilotId, role: 'copilot', plan, visibleSteps: 0, done: false },
      ])

      const update = (patch: { visibleSteps?: number; done?: boolean }) =>
        setMessages((prev) =>
          prev.map((m) => (m.id === copilotId && m.role === 'copilot' ? { ...m, ...patch } : m)),
        )

      plan.steps.forEach((_, index) => {
        timers.current.push(setTimeout(() => update({ visibleSteps: index + 1 }), STEP_DELAY * (index + 1)))
      })
      timers.current.push(
        setTimeout(
          () => {
            update({ done: true })
            setIsWorking(false)
          },
          STEP_DELAY * (plan.steps.length + 1),
        ),
      )
    },
    [contextClient?.id],
  )

  const clear = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setMessages([])
    setIsWorking(false)
  }, [])

  const setConfirmed = useCallback((id: string, value: boolean) => {
    setConfirmedState((prev) => ({ ...prev, [id]: value }))
  }, [])

  const dismiss = useCallback((id: string) => setDismissed((prev) => ({ ...prev, [id]: true })), [])

  const value = useMemo(
    () => ({
      messages,
      isWorking,
      send,
      clear,
      contextClient,
      panelOpen,
      setPanelOpen,
      confirmed,
      setConfirmed,
      dismissed,
      dismiss,
    }),
    [messages, isWorking, send, clear, contextClient, panelOpen, confirmed, setConfirmed, dismissed, dismiss],
  )

  return <CopilotContext.Provider value={value}>{children}</CopilotContext.Provider>
}

export function useCopilot() {
  const ctx = useContext(CopilotContext)
  if (!ctx) throw new Error('useCopilot must be used within CopilotProvider')
  return ctx
}

export function useReviewProgress(client: Client) {
  const { confirmed } = useCopilot()
  const total = client.outstanding.length
  const done = client.outstanding.filter((item) => confirmed[item.id]).length
  const base = client.reviewReadiness
  const readiness = total === 0 ? base : Math.round(base + ((100 - base) * done) / total)
  return { total, done, remaining: total - done, readiness }
}
