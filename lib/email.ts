import 'server-only'

import { Resend } from 'resend'
import { ADVISER } from '@/lib/data'

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY)
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)

export async function sendReportEmail(input: {
  to: string
  replyTo: string
  subject: string
  message: string
  adviserName: string
  pdf: Buffer
  fileName: string
  idempotencyKey: string
}) {
  if (!process.env.RESEND_API_KEY) {
    return { ok: false as const, error: 'Email is not connected yet. Connect Resend to send reports.' }
  }
  const resend = new Resend(process.env.RESEND_API_KEY)
  const from = process.env.RESEND_FROM_EMAIL || `${ADVISER.firm} <onboarding@resend.dev>`
  const html = `<div style="font-family:Georgia,serif;font-size:15px;line-height:1.6;color:#1f2328;max-width:560px">
${escapeHtml(input.message)
  .split(/\n{2,}/)
  .map((p) => `<p style="margin:0 0 14px">${p.replace(/\n/g, '<br>')}</p>`)
  .join('')}
<p style="margin:24px 0 0;font-family:Arial,sans-serif;font-size:12px;color:#6b7280">Your report is attached as a PDF.<br>${escapeHtml(input.adviserName)} · ${escapeHtml(ADVISER.firm)}</p>
</div>`

  const { data, error } = await resend.emails.send(
    {
      from,
      to: [input.to],
      replyTo: input.replyTo,
      subject: input.subject,
      html,
      text: `${input.message}\n\nYour report is attached as a PDF.\n${input.adviserName}, ${ADVISER.firm}`,
      attachments: [{ filename: input.fileName, content: input.pdf }],
    },
    { idempotencyKey: input.idempotencyKey },
  )
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, id: data?.id ?? null }
}
