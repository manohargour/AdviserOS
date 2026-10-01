import { cn } from '@/lib/utils'
import type { ClientStatus } from '@/lib/data'

const tones: Record<ClientStatus, string> = {
  'Annual Review Due': 'bg-warning-soft text-accent-foreground border-brass/30',
  'Meeting Today': 'bg-secondary text-primary border-primary/15',
  'Risk Profile Updated': 'bg-warning-soft text-accent-foreground border-brass/30',
  'Action Required': 'bg-destructive/10 text-destructive border-destructive/20',
  'Up to Date': 'bg-positive-soft text-positive border-positive/20',
}

export function StatusBadge({ status, className }: { status: ClientStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium',
        tones[status],
        className,
      )}
    >
      {status}
    </span>
  )
}
