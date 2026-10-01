import 'server-only'

import { Resend } from 'resend'
import { ADVISER } from '@/lib/data'

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY)
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)

const MAX_ATTEMPTS = 3
const RETRYABLE_NAMES = new Set(['application_error', 'internal_server_error', 'rate_limit_exceeded', 'concurrent_idempotent_requests'])

function isRetryable(error: { name?: string; message?: string }) {
  if (error.name && RETRYABLE_NAMES.has(error.name)) return true
  return /fetch|network|timeout|ECONN|socket|503|502/i.test(error.message ?? '')
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function sendReportEmail(input: {
  to: string
  replyTo: string
  subject: string
  message: string
  adviserName: string
  pdf: Buffer
  fileName: string
  idempotencyKey: string
  acknowledgeUrl?: string
}) {
  if (!process.env.RESEND_API_KEY) {
    return { ok: false as const, error: 'Email is not connected yet. Connect Resend to send reports.' }
  }
  const resend = new Resend(process.env.RESEND_API_KEY)
  const from = process.env.RESEND_FROM_EMAIL || `${ADVISER.firm} <onboarding@resend.dev>`
  const ackButton = input.acknowledgeUrl
    ? `<p style="margin:22px 0 6px"><a href="${escapeHtml(input.acknowledgeUrl)}" style="display:inline-block;background:#1f2a3c;color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;font-size:14px;font-weight:600;padding:11px 18px;border-radius:6px">Confirm I&#39;ve received my report</a></p>
<p style="margin:0 0 14px;font-family:Arial,sans-serif;font-size:12px;color:#6b7280">It takes a few seconds and lets us keep a record that you&#39;ve received it.</p>`
    : ''
  const html = `<div style="font-family:Georgia,serif;font-size:15px;line-height:1.6;color:#1f2328;max-width:560px">
${escapeHtml(input.message)
  .split(/\n{2,}/)
  .map((p) => `<p style="margin:0 0 14px">${p.replace(/\n/g, '<br>')}</p>`)
  .join('')}
${ackButton}
<p style="margin:24px 0 0;font-family:Arial,sans-serif;font-size:12px;color:#6b7280">Your report is attached as a PDF.<br>${escapeHtml(input.adviserName)} · ${escapeHtml(ADVISER.firm)}</p>
</div>`
  const ackText = input.acknowledgeUrl ? `\n\nPlease confirm you've received your report: ${input.acknowledgeUrl}` : ''

  let lastError = 'Email could not be sent.'
  // Retries reuse the same idempotency key, so Resend never delivers the email twice.
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const { data, error } = await resend.emails.send(
        {
          from,
          to: [input.to],
          replyTo: input.replyTo,
          subject: input.subject,
          html,
          text: `${input.message}${ackText}\n\nYour report is attached as a PDF.\n${input.adviserName}, ${ADVISER.firm}`,
          attachments: [{ filename: input.fileName, content: input.pdf }],
        },
        { idempotencyKey: input.idempotencyKey },
      )
      if (!error) return { ok: true as const, id: data?.id ?? null, attempts: attempt }
      lastError = error.message
      if (!isRetryable(error)) break
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err)
      if (!isRetryable({ message: lastError })) break
    }
    if (attempt < MAX_ATTEMPTS) await wait(attempt * 800)
  }
  return { ok: false as const, error: lastError }
}
