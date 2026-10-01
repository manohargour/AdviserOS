'use client'

import { Button } from '@/components/ui/button'
import { useAdviser } from './adviser-provider'

export function AskAdviserButton({
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
  const { send, isWorking } = useAdviser()
  return (
    <Button variant={variant} size={size} className={className} disabled={isWorking} onClick={() => send(prompt)}>
      {children}
    </Button>
  )
}
