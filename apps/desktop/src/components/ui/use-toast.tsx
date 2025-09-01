"use client"

// Minimal toast store inspired by shadcn/ui
import * as React from "react"

type Toast = {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
}

type ToastState = {
  toasts: Toast[]
  add: (toast: Omit<Toast, "id">) => void
  remove: (id: string) => void
}

const ToastContext = React.createContext<ToastState | null>(null)

export function ToastProviderState({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const add = React.useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((t) => [{ id, ...toast }, ...t])
  }, [])

  const remove = React.useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, add, remove }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = React.useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within ToastProviderState")
  return {
    toast: ({ title, description, action }: { title?: string; description?: string; action?: React.ReactNode }) =>
      ctx.add({ title, description, action }),
  }
}

export function useToastState() {
  const ctx = React.useContext(ToastContext)
  if (!ctx) throw new Error("useToastState must be used within ToastProviderState")
  return ctx
}
