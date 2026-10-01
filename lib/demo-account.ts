export const DEMO_EMAIL = 'demo@example.com'

export const DEMO_RECIPIENT_EMAIL = 'manoharsingh42@gmail.com'

export function isDemoEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() === DEMO_EMAIL
}
