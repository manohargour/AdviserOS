export const DEMO_EMAIL = 'demo@example.com'

export function isDemoEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() === DEMO_EMAIL
}
