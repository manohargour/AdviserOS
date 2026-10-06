import type { Metadata } from 'next'
import { AccountsGrid } from '@/components/personal/accounts/accounts-grid'
import { requirePersonal } from '@/lib/roles'
import { getPersonalSnapshot } from '@/lib/personal/store'

export const metadata: Metadata = { title: 'Accounts' }

export default async function AccountsPage() {
  const user = await requirePersonal()
  const snapshot = await getPersonalSnapshot(user)
  return <AccountsGrid accounts={snapshot.accounts} />
}
