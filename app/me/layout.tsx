import type { Metadata } from 'next'
import { AppShell } from '@/components/personal/shell/app-shell'
import { requirePersonal } from '@/lib/roles'

export const metadata: Metadata = {
  title: { default: 'Meridian', template: '%s · Meridian' },
  description: 'Your personal wealth, with an AI copilot and your adviser’s reports in one place.',
}

export default async function PersonalLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePersonal()
  return (
    <div className="personal">
      <AppShell user={{ name: user.name, email: user.email, role: user.role }}>{children}</AppShell>
    </div>
  )
}
