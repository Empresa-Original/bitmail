import * as React from 'react'
import { cn } from './utils'

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {}

function Separator({ className, ...props }: SeparatorProps) {
  return (
    <div role="presentation" className={cn('h-px w-full bg-border', className)} {...props} />
  )
}

export { Separator }

