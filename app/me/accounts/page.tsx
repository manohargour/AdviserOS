import type { Metadata } from 'next'
import { AccountsGrid } from '@/components/personal/accounts/accounts-grid'

export const metadata: Metadata = { title: 'Accounts' }

export default function AccountsPage() {
  return <AccountsGrid />
}
