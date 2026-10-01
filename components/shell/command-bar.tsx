'use client'

import { useEffect, useRef, useState } from 'react'
import { CornerDownLeft, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAdviser } from '@/components/adviser/adviser-provider'

const EXAMPLES = [
  'Prepare all reviews due this week',
  'Show clients requiring adviser attention',
  "Draft John's annual review",
  'Which clients have changed risk profiles?',
  "Prepare me for Sarah's meeting",
]

export function CommandBar() {
  const { send, isWorking } = useAdviser()
  const [value, setValue] = useState('')
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const matches = EXAMPLES.filter((ex) => ex.toLowerCase().includes(value.toLowerCase()))

  const run = (command: string) => {
    if (!command.trim() || isWorking) return
    send(command)
    setValue('')
    setOpen(false)
    setHighlight(-1)
    inputRef.current?.blur()
  }

  return (
    <div className="relative w-full max-w-2xl">
      <form
        data-tour="command-bar"
        onSubmit={(e) => {
          e.preventDefault()
          run(highlight >= 0 && matches[highlight] ? matches[highlight] : value)
        }}
        className="flex h-10 items-center gap-2 rounded-lg border bg-card px-3 shadow-xs focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-ring/20"
      >
        <Sparkles aria-hidden className="size-4 shrink-0 text-brass" />
        <label htmlFor="command-bar" className="sr-only">
          Ask AdviserOS or tell it what to do
        </label>
        <input
          ref={inputRef}
          id="command-bar"
          role="combobox"
          aria-expanded={open && matches.length > 0}
          aria-controls="command-suggestions"
          aria-autocomplete="list"
          autoComplete="off"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setHighlight(-1)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setHighlight((h) => Math.min(h + 1, matches.length - 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setHighlight((h) => Math.max(h - 1, -1))
            } else if (e.key === 'Escape') {
              setOpen(false)
              inputRef.current?.blur()
            } else if (e.key === 'Enter' && (e.nativeEvent.isComposing || e.keyCode === 229)) {
              e.preventDefault()
            }
          }}
          placeholder="Ask AdviserOS or tell it what to do…"
          className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 font-sans text-[10px] text-muted-foreground sm:inline">
          ⌘K
        </kbd>
      </form>
      {open && matches.length > 0 && (
        <ul
          id="command-suggestions"
          role="listbox"
          className="absolute inset-x-0 top-full z-30 mt-1.5 overflow-hidden rounded-lg border bg-popover p-1 shadow-lg"
        >
          <li className="px-2.5 pb-1 pt-1.5 text-[11px] font-medium text-muted-foreground" role="presentation">
            Try a command
          </li>
          {matches.map((ex, i) => (
            <li
              key={ex}
              role="option"
              aria-selected={i === highlight}
              onMouseDown={(e) => {
                e.preventDefault()
                run(ex)
              }}
              onMouseEnter={() => setHighlight(i)}
              className={cn(
                'flex cursor-pointer items-center justify-between rounded-md px-2.5 py-2 text-sm',
                i === highlight && 'bg-muted',
              )}
            >
              {ex}
              {i === highlight && <CornerDownLeft aria-hidden className="size-3.5 text-muted-foreground" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
