'use client'

import { useActionState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { acknowledgeReport } from '@/app/actions/acknowledge'

const inputCls =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring'

export function AcknowledgeForm({ token, defaultName }: { token: string; defaultName: string }) {
  const [state, action, pending] = useActionState(acknowledgeReport.bind(null, token), null)

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="ack-name" className="text-sm font-medium">Your full name</label>
        <input id="ack-name" name="name" required autoComplete="name" defaultValue={defaultName} className={inputCls} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="ack-comment" className="text-sm font-medium">
          Questions or comments <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <textarea id="ack-comment" name="comment" rows={3} className={inputCls} placeholder="Anything you'd like to discuss at our meeting" />
      </div>
      <label className="flex items-start gap-2.5 text-sm leading-relaxed">
        <input type="checkbox" name="confirm" required className="mt-1 size-4 accent-primary" />
        <span>I confirm I have received and read my annual review report.</span>
      </label>
      {state?.error && (
        <p role="alert" className="text-sm text-destructive">{state.error}</p>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 aria-hidden className="animate-spin" />}
        {pending ? 'Confirming…' : 'Confirm receipt'}
      </Button>
    </form>
  )
}
