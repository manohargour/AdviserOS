import { describe, expect, it } from 'vitest'
import { ACK_TTL_MS, REPORT_STATUS_LABEL, isEditable } from '@/lib/report-status'

describe('report status', () => {
  it('only allows editing in draft or in_review', () => {
    expect(isEditable('draft')).toBe(true)
    expect(isEditable('in_review')).toBe(true)
    expect(isEditable('approved')).toBe(false)
    expect(isEditable('sent')).toBe(false)
  })

  it('has a label for every status', () => {
    for (const status of ['draft', 'in_review', 'approved', 'sent'] as const) {
      expect(REPORT_STATUS_LABEL[status]).toBeTruthy()
    }
  })

  it('sets a 30-day acknowledgement window', () => {
    expect(ACK_TTL_MS).toBe(30 * 24 * 60 * 60 * 1000)
  })
})

describe('acknowledgement expiry', () => {
  const isExpired = (createdAt: Date) => Date.now() - createdAt.getTime() >= ACK_TTL_MS

  it('treats a fresh token as valid', () => {
    expect(isExpired(new Date())).toBe(false)
  })

  it('treats a token older than the TTL as expired', () => {
    expect(isExpired(new Date(Date.now() - ACK_TTL_MS - 1000))).toBe(true)
  })
})
