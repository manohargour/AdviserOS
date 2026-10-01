'use client'

import { Button } from '@/components/ui/button'
import { useCopilot } from './copilot-provider'

export function AskCopilotButton({
  prompt,
  children,
  variant = 'outline',
  size = 'sm',
  className,
}: {
  prompt: string
  children: React.ReactNode
  variant?: 'default' | 'outline' | 'secondary' | 'ghost'
  size?: 'sm' | 'default'
  className?: string
}) {
  const { send, isWorking } = useCopilot()
  return (
    <Button variant={variant} size={size} className={className} disabled={isWorking} onClick={() => send(prompt)}>
      {children}
    </Button>
  )
}
