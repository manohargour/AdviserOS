import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { AskAdviserButton } from '@/components/adviser/ask-adviser-button'

const suggestions = [
  {
    clientId: 'john-smith',
    name: 'John Smith',
    initials: 'JS',
    title: 'Annual review due',
    detail: '4 changes detected',
    action: 'Prepare Review',
    prompt: "Prepare John's annual review",
    tone: 'warning',
  },
  {
    clientId: 'emma-thompson',
    name: 'Emma Thompson',
    initials: 'ET',
    title: 'Client meeting today',
    detail: '2 outstanding actions',
    action: 'Prepare Brief',
    prompt: "Prepare Emma's client brief",
    tone: 'info',
  },
  {
    clientId: 'david-patel',
    name: 'David Patel',
    initials: 'DP',
    title: 'Risk profile updated',
    detail: 'Portfolio review may be required',
    action: 'Review Changes',
    prompt: "What changed since David's last review?",
    tone: 'warning',
  },
]

export function AdviserSuggestions() {
  return (
    <section aria-labelledby="suggests">
      <h2 id="suggests" className="flex items-center gap-2 text-sm font-semibold">
        <Sparkles aria-hidden className="size-4 text-brass" />
        AdviserOS suggests
      </h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-3">
        {suggestions.map((s) => (
          <li key={s.name} className="flex flex-col rounded-xl border bg-card p-4">
            <Link href={`/clients/${s.clientId}`} className="flex items-center gap-2.5 hover:underline">
              <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-xs font-medium">
                {s.initials}
              </span>
              <span className="text-sm font-semibold">{s.name}</span>
            </Link>
            <p className="mt-3 text-sm">{s.title}</p>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                aria-hidden
                className={s.tone === 'warning' ? 'size-1.5 rounded-full bg-warning' : 'size-1.5 rounded-full bg-chart-3'}
              />
              {s.detail}
            </p>
            <AskAdviserButton prompt={s.prompt} variant="default" className="mt-4 self-start">
              {s.action}
            </AskAdviserButton>
          </li>
        ))}
      </ul>
    </section>
  )
}
