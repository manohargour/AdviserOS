'use client'

import { isToolUIPart, getToolName } from 'ai'
import { AlertCircle, Check, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { LogoMark } from '@/components/brand/logo-mark'
import { cn } from '@/lib/utils'
import type { AdviserMessage as Message } from './adviser-provider'

const TOOL_LABELS: Record<string, { running: string; done: string }> = {
  listClients: { running: 'Reading your client book', done: 'Read your client book' },
  getClientProfile: { running: 'Loading client profile', done: 'Loaded client profile' },
  listReviews: { running: 'Checking reviews', done: 'Checked reviews' },
  listTasks: { running: 'Checking tasks', done: 'Checked tasks' },
  listAlerts: { running: 'Checking alerts', done: 'Checked alerts' },
  createTask: { running: 'Adding task', done: 'Added task to your list' },
}

function ToolStep({ name, state }: { name: string; state: string }) {
  const label = TOOL_LABELS[name] ?? { running: 'Working', done: 'Done' }
  const failed = state === 'output-error'
  const complete = state === 'output-available'
  return (
    <li className="flex items-center gap-2 text-[13px] text-muted-foreground">
      {failed ? (
        <AlertCircle aria-hidden className="size-3.5 text-destructive" />
      ) : complete ? (
        <Check aria-hidden className="size-3.5 text-positive" />
      ) : (
        <Loader2 aria-hidden className="size-3.5 animate-spin" />
      )}
      <span className={cn(complete && 'text-foreground/80')}>
        {failed ? `Couldn't complete: ${label.running.toLowerCase()}` : complete ? label.done : label.running}
      </span>
    </li>
  )
}

function Markdown({ text }: { text: string }) {
  return (
    <div
      className={cn(
        'space-y-2 leading-relaxed text-foreground',
        '[&_h1]:text-sm [&_h1]:font-semibold [&_h2]:mt-3 [&_h2]:text-sm [&_h2]:font-semibold [&_h3]:mt-3 [&_h3]:text-[13px] [&_h3]:font-semibold',
        '[&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-4',
        '[&_strong]:font-semibold [&_a]:text-primary [&_a]:underline',
        '[&_table]:w-full [&_table]:border-collapse [&_table]:text-xs [&_th]:border-b [&_th]:py-1 [&_th]:pr-2 [&_th]:text-left [&_th]:font-medium [&_th]:text-muted-foreground [&_td]:border-b [&_td]:py-1 [&_td]:pr-2',
        '[&_blockquote]:border-l-2 [&_blockquote]:border-brass [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground',
        '[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:text-xs [&_hr]:my-3',
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  )
}

export function AdviserMessage({ message, streaming }: { message: Message; streaming: boolean }) {
  if (message.role === 'user') {
    const text = message.parts.map((p) => (p.type === 'text' ? p.text : '')).join('')
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
          {text}
        </p>
      </div>
    )
  }

  const tools = message.parts.filter(isToolUIPart)
  const hasText = message.parts.some((p) => p.type === 'text' && p.text.trim())

  return (
    <div className="flex gap-2.5">
      <LogoMark className="mt-0.5 size-6 shrink-0 rounded text-xs" />
      <div className="min-w-0 flex-1 text-sm">
        {tools.length > 0 && (
          <ol className="mb-2 space-y-1" aria-label="Actions taken">
            {tools.map((part) => (
              <ToolStep key={part.toolCallId} name={getToolName(part)} state={part.state} />
            ))}
          </ol>
        )}
        {message.parts.map((part, i) =>
          part.type === 'text' && part.text.trim() ? <Markdown key={i} text={part.text} /> : null,
        )}
        {streaming && !hasText && tools.length === 0 && (
          <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <Loader2 aria-hidden className="size-3.5 animate-spin" />
            Thinking
          </p>
        )}
      </div>
    </div>
  )
}
