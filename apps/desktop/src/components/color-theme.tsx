"use client"

import React, { createContext, useCallback, useContext, useEffect, useState } from "react"

export type AccentTheme =
  | "default"
  | "blue"
  | "green"
  | "amber"
  | "rose"
  | "purple"
  | "orange"
  | "teal"

export type UiMode = "default" | "mono" | "scaled"

type Ctx = {
  accent: AccentTheme
  setAccent: (t: AccentTheme) => void
  mode: UiMode
  setMode: (m: UiMode) => void
}

const ColorThemeContext = createContext<Ctx | null>(null)

const STORAGE_KEY = "bitmail.accent.v1"
const MODE_KEY = "bitmail.mode.v1"

export function ColorThemeProvider({ children }: { children: React.ReactNode }) {
  const [accent, setAccentState] = useState<AccentTheme>("default")
  const [mode, setModeState] = useState<UiMode>("default")

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as AccentTheme | null
      if (saved) {
        const migrate: Record<string, AccentTheme> = { violet: 'purple', yellow: 'amber', red: 'rose' }
        // @ts-expect-error runtime migration from older keys
        setAccentState(migrate[saved] ?? saved)
      }
      const savedMode = localStorage.getItem(MODE_KEY) as UiMode | null
      if (savedMode) setModeState(savedMode)
    } catch {}
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (accent === "default") {
      root.removeAttribute("data-accent")
    } else {
      root.setAttribute("data-accent", accent)
    }
    try { localStorage.setItem(STORAGE_KEY, accent) } catch {}
  }, [accent])

  useEffect(() => {
    const root = document.documentElement
    if (mode === "default") root.removeAttribute("data-mode")
    else root.setAttribute("data-mode", mode)
    try { localStorage.setItem(MODE_KEY, mode) } catch {}
  }, [mode])

  const setAccent = useCallback((t: AccentTheme) => setAccentState(t), [])
  const setMode = useCallback((m: UiMode) => setModeState(m), [])

  return (
    <ColorThemeContext.Provider value={{ accent, setAccent, mode, setMode }}>
      {children}
    </ColorThemeContext.Provider>
  )
}

export function useColorTheme() {
  const ctx = useContext(ColorThemeContext)
  if (!ctx) throw new Error("useColorTheme must be used within ColorThemeProvider")
  return ctx
}
