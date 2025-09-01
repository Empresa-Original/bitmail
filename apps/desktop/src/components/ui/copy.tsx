"use client"

import * as React from "react"
import { Copy as CopyIcon } from "lucide-react"
import { Tooltip, TooltipTrigger, TooltipContent } from "./tooltip"
import { cn } from "./utils"

type CopyButtonProps = {
  value: string
  className?: string
  iconClassName?: string
  label?: string
  onCopy?: () => void
}

export function CopyButton({ value, className, iconClassName, label = "Copy", onCopy }: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false)
  const timeoutRef = React.useRef<number | null>(null)

  React.useEffect(() => () => { if (timeoutRef.current) window.clearTimeout(timeoutRef.current) }, [])

  async function doCopy() {
    try { await navigator.clipboard?.writeText(value) } catch {}
    onCopy?.()
    // Show tooltip once per click, then auto-hide
    setCopied(true)
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    timeoutRef.current = window.setTimeout(() => setCopied(false), 1100)
  }

  return (
    // Control open state so it only appears on click, not on hover
    <Tooltip open={copied}>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={doCopy}
          className={cn("inline-flex h-7 w-7 items-center justify-center rounded-md border border-border hover:bg-[var(--hover-medium)] focus:outline-none", className)}
        >
          <CopyIcon className={cn("h-4 w-4", iconClassName)} />
        </button>
      </TooltipTrigger>
      <TooltipContent>Copied!</TooltipContent>
    </Tooltip>
  )
}
