import Link from 'next/link'
import { AskAdviserButton } from '@/components/adviser/ask-adviser-button'

const schedule = [
  { time: '09:25', name: 'Sarah Williams', id: 'sarah-williams', purpose: 'Mid-year check-in', soon: true },
  { time: '11:00', name: 'Internal', purpose: 'Investment committee' },
  { time: '14:00', name: 'Emma Thompson', id: 'emma-thompson', purpose: 'Business sale planning' },
  { time: '16:30', name: 'Michael Chen', id: 'michael-chen', purpose: 'Review call' },
]

export function TodaySchedule() {
  return (
    <section aria-labelledby="schedule" className="rounded-xl border bg-card p-4">
      <h2 id="schedule" className="text-sm font-semibold">
        Today
      </h2>
      <ol className="mt-3 space-y-3">
        {schedule.map((item) => (
          <li key={item.time} className="flex gap-3">
            <span className="w-11 shrink-0 pt-0.5 text-xs font-medium tabular-nums text-muted-foreground">
              {item.time}
            </span>
            <div className="min-w-0 flex-1 border-l pl-3">
              {item.id ? (
                <Link href={`/clients/${item.id}`} className="text-sm font-medium hover:underline">
                  {item.name}
                </Link>
              ) : (
                <p className="text-sm font-medium">{item.name}</p>
              )}
              <p className="text-xs text-muted-foreground">{item.purpose}</p>
              {item.soon && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded bg-warning-soft px-1.5 py-0.5 text-[11px] font-medium text-accent-foreground">
                    In 25 minutes
                  </span>
                  <AskAdviserButton prompt="Prepare me for Sarah's meeting">Prepare Client Brief</AskAdviserButton>
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
