import { getAddress } from 'ethers';
export function shortAddress(addr?: string | null) {
  if (!addr) return ''
  let a: string
  try {
    a = getAddress(addr.trim())
  } catch {
    a = addr.trim()
  }
  if (a.length <= 10) return a
  // Desired style: 0xbcd....7520b (3 after 0x, 4 dots, last 5)
  const prefix = a.startsWith('0x') ? '0x' : ''
  const body = a.replace(/^0x/i, '')
  return `${prefix}${body.slice(0, 3)}....${body.slice(-5)}`
}

