"use client"

import * as React from "react"
import { Toast as ToastPrimitive } from "@radix-ui/react-toast"
import {
  ToastProvider as RadixToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from "./toast"
import { useToastState } from "./use-toast"

export function Toaster() {
  const { toasts, remove } = useToastState()

  return (
    <RadixToastProvider swipeDirection="right">
      {toasts.map((t) => (
        <Toast key={t.id} onOpenChange={(o) => { if (!o) remove(t.id) }} open duration={3000}>
          <div className="grid gap-1">
            {t.title && <ToastTitle>{t.title}</ToastTitle>}
            {t.description && <ToastDescription>{t.description}</ToastDescription>}
          </div>
          {t.action}
          <ToastClose aria-label="Close" />
        </Toast>
      ))}
      <ToastViewport />
    </RadixToastProvider>
  )
}
