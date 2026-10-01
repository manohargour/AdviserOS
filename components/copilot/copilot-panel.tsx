'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUp, Check, Clock, Loader2, RotateCcw, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LogoMark } from '@/components/brand/logo-mark'
import { cn } from '@/lib/utils'
import { suggestedPromptsFor } from '@/lib/copilot-engine'
import { getClient, type Client } from '@/lib/data'
import { useCopilot, type CopilotMessage } from './copilot-provider'
import { CopilotResponse } from './copilot-responses'

function ProactiveCard({ client }: { client?: Client }) {
  const { send, dismissed, dismiss, isWorking } = useCopilot()

  let card: { id: string; eyebrow: string; title: string; body?: React.ReactNode; action: string; prompt: string } | null =
    null

  if (client?.id === 'john-smith') {
    card = {
      id: 'john-review',
      eyebrow: 'Review due',
      title: "John's annual review is due.",
      body: (
        <>
          <p className="text-muted-foreground">I&apos;ve detected three items you may want to review:</p>
          <ol className="mt-1.5 list-inside list-decimal space-y-0.5">
            <li>Equity allocation increased by 7 percentage points</li>
            <li>Pension withdrawals started since the previous review</li>
            <li>Current risk score remains Moderate 5/10</li>
          </ol>
        </>
      ),
      action: 'Prepare Review',
      prompt: "Prepare John's annual review",
    }
  } else if (client?.meeting) {
    card = {
      id: `${client.id}-meeting`,
      eyebrow: 'Before a client meeting',
      title: `${client.name} meeting ${client.meeting.inMinutes ? `in ${client.meeting.inMinutes} minutes` : `at ${client.meeting.time}`}`,
      body: <p className="text-muted-foreground">Would you like me to prepare a briefing?</p>,
      action: 'Prepare Client Brief',
      prompt: `Prepare ${client.firstName}'s client brief`,
    }
  } else if (client && client.changes.length > 0) {
    card = {
      id: `${client.id}-changes`,
      eyebrow: 'Changes detected',
      title: `${client.changes.length} ${client.changes.length === 1 ? 'change' : 'changes'} since ${client.firstName}'s last review`,
      body: <p className="text-muted-foreground">{client.changes[0].detail}</p>,
      action: 'Show Changes',
      prompt: `What changed since ${client.firstName}'s last review?`,
    }
  } else if (!client) {
    const sarah = getClient('sarah-williams')!
    card = {
      id: 'sarah-meeting',
      eyebrow: 'Before a client meeting',
      title: `${sarah.name} meeting in ${sarah.meeting?.inMinutes} minutes`,
      body: <p className="text-muted-foreground">Would you like me to prepare a briefing?</p>,
      action: 'Prepare Client Brief',
      prompt: "Prepare me for Sarah's meeting",
    }
  }

  if (!card || dismissed[card.id]) return null

  return (
    <div className="rounded-xl border border-brass/40 bg-accent/50 p-3.5 text-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-accent-foreground">
          {card.id.includes('meeting') ? <Clock aria-hidden className="size-3" /> : <Sparkles aria-hidden className="size-3" />}
          {card.eyebrow}
        </p>
        <button
          type="button"
          onClick={() => dismiss(card.id)}
          className="-m-1 rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground"
          aria-label="Dismiss suggestion"
        >
          <X className="size-3.5" />
        </button>
      </div>
      <p className="mt-1.5 font-medium">{card.title}</p>
      <div className="mt-1">{card.body}</div>
      <Button
        size="sm"
        className="mt-3"
        disabled={isWorking}
        onClick={() => {
          dismiss(card.id)
          send(card.prompt)
        }}
      >
        {card.action}
      </Button>
    </div>
  )
}

function Message({ message }: { message: CopilotMessage }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
          {message.text}
        </p>
      </div>
    )
  }

  const { plan, visibleSteps, done } = message
  return (
    <div className="flex gap-2.5">
      <LogoMark className="mt-0.5 size-6 rounded text-xs" />
      <div className="min-w-0 flex-1 text-sm">
        {plan.steps.length > 0 && (
          <ol className="mb-2 space-y-1" aria-label="Actions taken">
            {plan.steps.map((step, i) => {
              const complete = i < visibleSteps
              const active = i === visibleSteps && !done
              if (!complete && !active) return null
              return (
                <li key={step} className="flex items-center gap-2 text-[13px] text-muted-foreground">
                  {complete ? (
                    <Check aria-hidden className="size-3.5 text-positive" />
                  ) : (
                    <Loader2 aria-hidden className="size-3.5 animate-spin" />
                  )}
                  <span className={cn(complete && 'text-foreground/80')}>{step}</span>
                </li>
              )
            })}
          </ol>
        )}
        {done && (
          <div className="animate-in fade-in slide-in-from-bottom-1 duration-300">
            <CopilotResponse plan={plan} />
          </div>
        )}
      </div>
    </div>
  )
}

export function CopilotPanel() {
  const { messages, send, clear, isWorking, contextClient, panelOpen, setPanelOpen } = useCopilot()
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const prompts = suggestedPromptsFor(contextClient)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const submit = () => {
    if (!input.trim() || isWorking) return
    send(input)
    setInput('')
  }

  return (
    <>
      <div
        aria-hidden
        onClick={() => setPanelOpen(false)}
        className={cn(
          'fixed inset-0 z-40 bg-foreground/20 backdrop-blur-[1px] transition-opacity xl:hidden',
          panelOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />
      <aside
        aria-label="AdviserOS"
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-full max-w-[400px] flex-col border-l bg-card transition-transform xl:static xl:z-auto xl:w-[380px] xl:max-w-none xl:translate-x-0',
          panelOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <header className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <div className="flex items-center gap-2.5">
            <LogoMark className="size-7 text-base" />
            <div>
              <h2 className="text-sm font-semibold leading-tight">AdviserOS</h2>
              <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-positive opacity-60" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-positive" />
                </span>
                {contextClient ? 'Client context loaded' : 'Book context loaded · 412 clients'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <Button variant="ghost" size="icon-sm" onClick={clear} aria-label="Clear conversation">
                <RotateCcw />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              className="xl:hidden"
              onClick={() => setPanelOpen(false)}
              aria-label="Close AdviserOS"
            >
              <X />
            </Button>
          </div>
        </header>

        <div className="border-b bg-muted/50 px-4 py-2 text-xs">
          {contextClient ? (
            <span>
              Working with <span className="font-semibold">{contextClient.name}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">Working across your client book</span>
          )}
        </div>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4" aria-live="polite">
          <ProactiveCard client={contextClient} />
          {messages.map((m) => (
            <Message key={m.id} message={m} />
          ))}
          {messages.length === 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Suggested</p>
              <ul className="flex flex-col gap-1.5">
                {prompts.map((p) => (
                  <li key={p}>
                    <button
                      type="button"
                      onClick={() => send(p)}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-left text-sm transition-colors hover:border-primary/30 hover:bg-muted"
                    >
                      {p}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="border-t p-3">
          {messages.length > 0 && (
            <div className="-mx-3 mb-2 flex gap-1.5 overflow-x-auto px-3 pb-1">
              {prompts.slice(0, 5).map((p) => (
                <button
                  key={p}
                  type="button"
                  disabled={isWorking}
                  onClick={() => send(p)}
                  className="shrink-0 rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  {p}
                </button>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              submit()
            }}
            className="flex items-end gap-2 rounded-xl border bg-background p-1.5 focus-within:ring-2 focus-within:ring-ring/30"
          >
            <label htmlFor="copilot-input" className="sr-only">
              Message AdviserOS
            </label>
            <textarea
              id="copilot-input"
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  if (e.nativeEvent.isComposing || e.keyCode === 229) return
                  e.preventDefault()
                  submit()
                }
              }}
              placeholder={contextClient ? `Ask about ${contextClient.firstName}…` : 'Ask or tell AdviserOS what to do…'}
              className="max-h-32 min-h-8 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
            />
            <Button type="submit" size="icon-sm" disabled={!input.trim() || isWorking} aria-label="Send">
              <ArrowUp />
            </Button>
          </form>
          <p className="mt-2 text-center text-[10px] text-muted-foreground">
            AdviserOS prepares the work. Advice and approval remain with you.
          </p>
        </div>
      </aside>
    </>
  )
}
