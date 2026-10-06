import { redirect } from 'next/navigation'

// Per-security research requires a market-data connection, which is not wired up.
// Until then, send users back to the derived, data-grounded opportunities list.
export default function AnalysisPage() {
  redirect('/me/opportunities')
}
