'use client'

import { useOptimistic, useTransition } from 'react'
import { setTaskDone } from '@/app/actions/workspace'
import { cn } from '@/lib/utils'

type TaskItem = { id: number; title: string; client: string; due: string; source: string; done: boolean }

export function TaskList({ tasks }: { tasks: TaskItem[] }) {
  const [, startTransition] = useTransition()
  const [optimistic, setOptimistic] = useOptimistic(tasks, (state, update: { id: number; done: boolean }) =>
    state.map((t) => (t.id === update.id ? { ...t, done: update.done } : t)),
  )

  if (optimistic.length === 0) {
    return <p className="rounded-xl border bg-card px-4 py-10 text-center text-sm text-muted-foreground">No tasks yet.</p>
  }

  return (
    <ul className="divide-y rounded-xl border bg-card">
      {optimistic.map((t) => (
        <li key={t.id}>
          <label className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-muted/40">
            <input
              type="checkbox"
              checked={t.done}
              onChange={(e) => {
                const done = e.target.checked
                startTransition(async () => {
                  setOptimistic({ id: t.id, done })
                  await setTaskDone(t.id, done)
                })
              }}
              className="size-4 shrink-0 accent-primary"
            />
            <div className="min-w-0 flex-1">
              <p className={cn('text-sm font-medium', t.done && 'text-muted-foreground line-through')}>{t.title}</p>
              <p className="text-xs text-muted-foreground">
                {t.client} · from {t.source}
              </p>
            </div>
            <span className={cn('text-xs', t.due === 'Today' && !t.done ? 'font-medium text-warning' : 'text-muted-foreground')}>
              {t.due}
            </span>
          </label>
        </li>
      ))}
    </ul>
  )
}
