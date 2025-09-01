import { getAddress } from 'ethers';
export function normalizeHexAddress(addr: string) {
  const a = addr.trim()
  if (!a) return ''
  return a.startsWith('0x') ? a : `0x${a}`
}

// CAIP-10 account id: <namespace>:<reference>:<account>
// For EVM: eip155:<chainId>:<address>
export function caip10Account(chainId: string | number, address: string) {
  const id = typeof chainId === 'number' ? String(chainId) : chainId.trim()
  let addr: string
  try {
    addr = getAddress(address)
  } catch {
    addr = normalizeHexAddress(address)
  }
  if (!id || !addr) return ''
  return `eip155:${id}:${addr}`
}

// did:pkh for EVM chains: did:pkh:eip155:<chainId>:<address>
export function didPkh(chainId: string | number, address: string) {
  const id = typeof chainId === 'number' ? String(chainId) : chainId.trim()
  let addr: string
  try {
    addr = getAddress(address)
  } catch {
    addr = normalizeHexAddress(address)
  }
  if (!id || !addr) return ''
  return `did:pkh:eip155:${id}:${addr}`
}

// did:ethr format: did:ethr:<chainId>:<address>
export function didEthr(chainId: string | number, address: string) {
  const id = typeof chainId === 'number' ? String(chainId) : chainId.trim()
  let addr: string
  try {
    addr = getAddress(address)
  } catch {
    addr = normalizeHexAddress(address)
  }
  if (!id || !addr) return ''
  return `did:ethr:${id}:${addr}`
}

