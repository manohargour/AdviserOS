import type { Metadata } from 'next'
import { AppShell } from '@/components/personal/shell/app-shell'
import { requirePersonal } from '@/lib/roles'
import { getPersonalSnapshot } from '@/lib/personal/store'

export const metadata: Metadata = {
  title: { default: 'Meridian', template: '%s · Meridian' },
  description: 'Your personal wealth, with an AI copilot and your adviser’s reports in one place.',
}

export default async function PersonalLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePersonal()
  const s = await getPersonalSnapshot(user)
  const advisorData = {
    netWorth: s.netWorth,
    portfolio: s.portfolio,
    holdings: s.holdings,
    allocation: s.allocation,
    goals: s.goals,
    profile: s.profile,
  }
  return (
    <div className="personal">
      <AppShell user={{ name: user.name, email: user.email, role: user.role }} advisorData={advisorData}>
        {children}
      </AppShell>
    </div>
  )
}
