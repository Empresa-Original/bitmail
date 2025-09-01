/* Lightweight client-side click/event logger
 * - Toggle via localStorage key: bitmail.logs.enabled = '1' | '0'
 * - Or via env: NEXT_PUBLIC_LOG_EVENTS = '1'
 * - Logs to console as single-line JSON and keeps an in-memory ring buffer
 */

type EventItem = { ts: number; name: string; data?: Record<string, unknown> }

const MAX = 500
const buf: EventItem[] = []

function isBrowser() {
  return typeof window !== 'undefined'
}

function enabledFromEnv() {
  // @ts-ignore process may be undefined at runtime in the browser
  const env = typeof process !== 'undefined' && process?.env?.NEXT_PUBLIC_LOG_EVENTS
  return env === '1'
}

export function isEnabled() {
  if (!isBrowser()) return enabledFromEnv()
  try {
    const v = localStorage.getItem('bitmail.logs.enabled')
    return v === '1' || enabledFromEnv()
  } catch {
    return enabledFromEnv()
  }
}

export function setEnabled(v: boolean) {
  if (!isBrowser()) return
  try { localStorage.setItem('bitmail.logs.enabled', v ? '1' : '0') } catch {}
}

export function logEvent(name: string, data?: Record<string, unknown>) {
  const item: EventItem = { ts: Date.now(), name, data }
  buf.push(item)
  if (buf.length > MAX) buf.shift()
  if (isEnabled()) {
    try { console.log('[EVT]', JSON.stringify(item)) } catch { console.log('[EVT]', item) }
  }
}

export function withLogClick<T extends React.MouseEvent | undefined>(name: string, data?: Record<string, unknown>, fn?: (e: any) => void) {
  return (e: T) => {
    logEvent(name, data)
    fn?.(e)
  }
}

export function getEvents() { return [...buf] }
export function clearEvents() { buf.splice(0, buf.length) }

