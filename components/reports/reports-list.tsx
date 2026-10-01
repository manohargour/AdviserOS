'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Download, FileText, Loader2, Pencil, Trash2 } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { deleteReport } from '@/app/actions/reports'
import { REPORT_STATUS_LABEL, type ReportStatus } from '@/lib/report-status'
import { ReportStatusBadge } from '@/components/reports/report-status-badge'

type Row = {
  id: number
  title: string
  status: ReportStatus
  clientName: string
  recipientEmail: string | null
  updatedAt: string
}

export function ReportsList({ reports }: { reports: Row[] }) {
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [pending, startTransition] = useTransition()

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-16 text-center">
        <FileText aria-hidden className="size-6 text-muted-foreground" />
        <p className="font-medium">No saved reports yet</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Pick a client above and choose New report, or open a review and select Save as report.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <table className="w-full min-w-[720px] text-sm">
        <caption className="sr-only">Saved reports</caption>
        <thead>
          <tr className="border-b text-left text-[11px] uppercase tracking-wider text-muted-foreground">
            <th scope="col" className="px-4 py-3 font-medium">Report</th>
            <th scope="col" className="px-4 py-3 font-medium">Status</th>
            <th scope="col" className="px-4 py-3 font-medium">Recipient</th>
            <th scope="col" className="px-4 py-3 font-medium">Updated</th>
            <th scope="col" className="px-4 py-3 text-right font-medium">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {reports.map((r) => (
            <tr key={r.id} className="hover:bg-muted/40">
              <td className="px-4 py-3">
                <Link href={`/reports/${r.id}`} className="font-medium hover:underline">
                  {r.clientName}
                </Link>
                <p className="line-clamp-1 text-xs text-muted-foreground">{r.title}</p>
              </td>
              <td className="px-4 py-3">
                <ReportStatusBadge status={r.status} />
              </td>
              <td className="px-4 py-3 text-muted-foreground">{r.recipientEmail ?? '—'}</td>
              <td className="px-4 py-3 tabular-nums text-muted-foreground">
                {new Date(r.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  {confirmId === r.id ? (
                    <>
                      <span className="mr-1 text-xs text-muted-foreground">Delete?</span>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={pending}
                        onClick={() => startTransition(async () => {
                          await deleteReport(r.id)
                          setConfirmId(null)
                        })}
                      >
                        {pending ? <Loader2 aria-hidden className="animate-spin" /> : null}
                        Delete
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setConfirmId(null)}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link
                        href={`/reports/${r.id}`}
                        className={buttonVariants({ size: 'icon', variant: 'ghost' })}
                        aria-label={`Open ${REPORT_STATUS_LABEL[r.status].toLowerCase()} report for ${r.clientName}`}
                      >
                        <Pencil aria-hidden />
                      </Link>
                      <a
                        href={`/api/reports/${r.id}/pdf`}
                        className={buttonVariants({ size: 'icon', variant: 'ghost' })}
                        aria-label={`Download PDF for ${r.clientName}`}
                      >
                        <Download aria-hidden />
                      </a>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Delete report for ${r.clientName}`}
                        onClick={() => setConfirmId(r.id)}
                      >
                        <Trash2 aria-hidden />
                      </Button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
