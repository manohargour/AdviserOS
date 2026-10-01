'use client'

import { usePathname } from 'next/navigation'
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { planFor, type AdviserPlan } from '@/lib/adviser-engine'
import { getClient, type Client } from '@/lib/data'

export type AdviserMessage =
  | { id: string; role: 'user'; text: string }
  | { id: string; role: 'adviser'; plan: AdviserPlan; visibleSteps: number; done: boolean }

type AdviserContextValue = {
  messages: AdviserMessage[]
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

const AdviserContext = createContext<AdviserContextValue | null>(null)

const STEP_DELAY = 420

function clientIdFromPath(pathname: string) {
  const match = pathname.match(/^\/(?:clients|reviews)\/([^/]+)/)
  return match ? match[1] : undefined
}

export function AdviserProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const contextClient = useMemo(() => {
    const id = clientIdFromPath(pathname)
    return id ? getClient(id) : undefined
  }, [pathname])

  const [messages, setMessages] = useState<AdviserMessage[]>([])
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
      const adviserId = `m${counter.current++}`
      setPanelOpen(true)
      setIsWorking(true)
      setMessages((prev) => [
        ...prev,
        { id: userId, role: 'user', text: trimmed },
        { id: adviserId, role: 'adviser', plan, visibleSteps: 0, done: false },
      ])

      const update = (patch: { visibleSteps?: number; done?: boolean }) =>
        setMessages((prev) =>
          prev.map((m) => (m.id === adviserId && m.role === 'adviser' ? { ...m, ...patch } : m)),
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
