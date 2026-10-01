export type ReportStatus = 'draft' | 'in_review' | 'approved' | 'sent'

export const REPORT_STEPS: { status: ReportStatus; label: string }[] = [
  { status: 'draft', label: 'Draft' },
  { status: 'in_review', label: 'In review' },
  { status: 'approved', label: 'Approved' },
  { status: 'sent', label: 'Sent to client' },
]

export const REPORT_STATUS_LABEL: Record<ReportStatus, string> = {
  draft: 'Draft',
  in_review: 'In review',
  approved: 'Approved',
  sent: 'Sent',
}

export function isEditable(status: ReportStatus) {
  return status === 'draft' || status === 'in_review'
}
