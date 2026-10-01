import type { Metadata } from 'next'
import { PageContainer, PageHeader } from '@/components/shell/page-header'
import { cn } from '@/lib/utils'
import { tasks } from '@/lib/data'

export const metadata: Metadata = { title: 'Tasks' }

export default function TasksPage() {
  return (
    <PageContainer>
      <PageHeader title="Tasks" description="Created from reviews, alerts, meeting notes and compliance checks" />
      <ul className="divide-y rounded-xl border bg-card">
        {tasks.map((t) => (
          <li key={t.id} className="flex items-center gap-3 px-4 py-3">
            <input
              type="checkbox"
              defaultChecked={t.done}
              aria-label={t.title}
              className="size-4 shrink-0 accent-primary"
            />
            <div className="min-w-0 flex-1">
              <p className={cn('text-sm font-medium', t.done && 'text-muted-foreground line-through')}>{t.title}</p>
              <p className="text-xs text-muted-foreground">
                {t.client} · from {t.source}
              </p>
            </div>
            <span className={cn('text-xs', t.due === 'Today' ? 'font-medium text-warning' : 'text-muted-foreground')}>
              {t.due}
            </span>
          </li>
        ))}
      </ul>
    </PageContainer>
  )
}
