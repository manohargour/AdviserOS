import { cn } from '@/lib/utils'
import { REPORT_STATUS_LABEL, type ReportStatus } from '@/lib/report-status'

const tone: Record<ReportStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  in_review: 'bg-warning/15 text-warning',
  approved: 'bg-positive/15 text-positive',
  sent: 'bg-primary text-primary-foreground',
}

export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  return (
    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', tone[status])}>
      {REPORT_STATUS_LABEL[status]}
    </span>
  )
}
