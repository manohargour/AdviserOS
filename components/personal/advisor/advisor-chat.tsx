'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUp, BookOpen, Calculator, Lightbulb, ListChecks, ShieldCheck } from 'lucide-react'
import { answerQuestion, suggestedQuestions, type AdvisorAnswer } from '@/lib/personal/advisor'
import { AiMark, Pill } from '@/components/personal/wealth/primitives'
import { cn } from '@/lib/utils'

type Message = { id: number; role: 'user' | 'assistant'; content: string; answer?: AdvisorAnswer; pending?: boolean }

const sections = [
  { key: 'facts', label: 'Facts', icon: BookOpen, hint: 'From your connected accounts' },
  { key: 'assumptions', label: 'Assumptions', icon: Calculator, hint: 'Inputs you can change' },
  { key: 'analysis', label: 'Analysis', icon: Lightbulb, hint: 'What the numbers suggest' },
  { key: 'actions', label: 'Possible actions', icon: ListChecks, hint: 'Options, not instructions' },
] as const

function AnswerBlock({ answer, compact }: { answer: AdvisorAnswer; compact?: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      <p className={cn('font-medium text-foreground text-pretty', compact ? 'text-[13px]' : 'text-[15px] leading-relaxed')}>
        {answer.summary}
      </p>
      <div className={cn('grid gap-2', !compact && 'md:grid-cols-2')}>
        {sections.map(({ key, label, icon: Icon, hint }) => (
          <div key={key} className="rounded-xl border bg-background/60 p-3">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Icon className={cn('size-3.5', key === 'actions' ? 'text-ai' : 'text-muted-foreground')} aria-hidden />
                {label}
              </span>
              {!compact ? <span className="text-[11px] text-muted-foreground">{hint}</span> : null}
            </div>
            <ul className="flex flex-col gap-1.5">
              {answer[key].map((item) => (
                <li key={item} className="flex gap-2 text-[13px] leading-relaxed text-muted-foreground">
                  <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground/50" />
                  <span className="text-pretty">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <Pill tone="ai">Confidence: {answer.confidence}</Pill>
        <span className="flex items-center gap-1">
          <ShieldCheck className="size-3" aria-hidden />
          Projections are estimates, not predictions. Not regulated financial advice.
        </span>
      </div>
    </div>
  )
}

export function AdvisorChat({ compact = false, initialQuestion }: { compact?: boolean; initialQuestion?: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const nextId = useRef(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const askedInitial = useRef(false)
  const busy = messages.some((m) => m.pending)

  function ask(question: string) {
    const q = question.trim()
    if (!q || busy) return
    const userId = nextId.current++
    const botId = nextId.current++
    setMessages((m) => [
      ...m,
      { id: userId, role: 'user', content: q },
      { id: botId, role: 'assistant', content: '', pending: true },
    ])
    setInput('')
    window.setTimeout(() => {
      setMessages((m) => m.map((msg) => (msg.id === botId ? { ...msg, pending: false, answer: answerQuestion(q) } : msg)))
    }, 900)
  }

  useEffect(() => {
    if (initialQuestion && !askedInitial.current) {
      askedInitial.current = true
      ask(initialQuestion)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestion])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const empty = messages.length === 0

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={scrollRef} className={cn('min-h-0 flex-1 overflow-y-auto', compact ? 'px-4 py-4' : 'px-1 py-2')}>
        {empty ? (
          <div className={cn('flex flex-col', compact ? 'gap-3' : 'gap-6 py-6')}>
            <div className="flex items-start gap-3">
              <AiMark size={compact ? 'sm' : 'md'} />
              <div>
                <p className={cn('font-medium', compact ? 'text-[13px]' : 'text-[15px]')}>
                  I have context on your 9 accounts, 5 goals and 13 holdings.
                </p>
                <p className="mt-0.5 text-[13px] text-muted-foreground text-pretty">
                  Ask about your plan, a decision, or a what-if. I&apos;ll separate facts from assumptions.
                </p>
              </div>
            </div>
            <div className={cn('grid gap-2', !compact && 'sm:grid-cols-2')}>
              {(compact ? suggestedQuestions.slice(0, 4) : suggestedQuestions).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => ask(q)}
                  className="rounded-xl border bg-card px-3 py-2.5 text-left text-[13px] text-foreground transition-colors hover:border-ai/30 hover:bg-ai-soft/60 focus-visible:outline-2 focus-visible:outline-ring"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ol className="flex flex-col gap-5" aria-live="polite">
            {messages.map((m) =>
              m.role === 'user' ? (
                <li key={m.id} className="flex justify-end">
                  <p className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-[13px] text-primary-foreground">
                    {m.content}
                  </p>
                </li>
              ) : (
                <li key={m.id} className="flex gap-3">
                  <AiMark size="sm" className="mt-0.5" />
                  <div className="min-w-0 flex-1">
                    {m.pending ? (
                      <div className="flex items-center gap-2 py-1 text-[13px] text-muted-foreground">
                        <span className="flex gap-1" aria-hidden>
                          <span className="size-1.5 animate-pulse rounded-full bg-ai" />
                          <span className="size-1.5 animate-pulse rounded-full bg-ai [animation-delay:150ms]" />
                          <span className="size-1.5 animate-pulse rounded-full bg-ai [animation-delay:300ms]" />
                        </span>
                        Analysing your accounts and goals…
                      </div>
                    ) : m.answer ? (
                      <AnswerBlock answer={m.answer} compact={compact} />
                    ) : null}
                  </div>
                </li>
              ),
            )}
          </ol>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          ask(input)
        }}
        className={cn('shrink-0', compact ? 'border-t p-3' : 'pt-3')}
      >
        <div className="flex items-end gap-2 rounded-2xl border bg-card p-2 shadow-[0_1px_2px_rgba(16,24,40,0.04)] focus-within:border-ai/40 focus-within:ring-3 focus-within:ring-ai/10">
          <label htmlFor={compact ? 'ai-panel-input' : 'advisor-input'} className="sr-only">
            Ask your wealth
          </label>
          <textarea
            id={compact ? 'ai-panel-input' : 'advisor-input'}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                if (e.nativeEvent.isComposing || e.keyCode === 229) return
                e.preventDefault()
                ask(input)
              }
            }}
            placeholder={compact ? 'Ask about your wealth…' : 'Ask anything about your money, goals or a decision…'}
            className="max-h-32 min-h-9 flex-1 resize-none bg-transparent px-2 py-2 text-[13px] outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={!input.trim() || busy}
            aria-label="Send question"
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-opacity disabled:opacity-30"
          >
            <ArrowUp className="size-4" />
          </button>
        </div>
      </form>
    </div>
  )
}
