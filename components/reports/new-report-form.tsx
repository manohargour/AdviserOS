'use client'

import { useState, useTransition } from 'react'
import { Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createReport } from '@/app/actions/reports'

export function NewReportForm({ clients }: { clients: { id: string; name: string }[] }) {
  const [clientId, setClientId] = useState(clients[0]?.id ?? '')
  const [pending, startTransition] = useTransition()

  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        if (clientId) startTransition(() => createReport(clientId))
      }}
    >
      <label htmlFor="new-report-client" className="sr-only">
        Client
      </label>
      <select
        id="new-report-client"
        value={clientId}
        onChange={(e) => setClientId(e.target.value)}
        className="h-9 rounded-md border bg-background px-2 text-sm"
      >
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <Button type="submit" size="lg" disabled={pending || !clientId}>
        {pending ? <Loader2 aria-hidden className="animate-spin" /> : <Plus aria-hidden />}
        New report
      </Button>
    </form>
  )
}
