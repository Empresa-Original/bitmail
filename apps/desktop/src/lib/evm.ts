import { getAddress } from 'ethers';
// Lightweight EVM helpers without external deps

type RpcReply<T> = { jsonrpc: string; id: number; result?: T; error?: { code: number; message: string } }

const PUBLIC_RPCS: Record<number, string[]> = {
  1: ['https://rpc.ankr.com/eth'],
  11155111: ['https://ethereum-sepolia-rpc.publicnode.com', 'https://rpc.sepolia.org'],
  137: ['https://polygon-rpc.com'],
  80002: ['https://rpc-amoy.polygon.technology'],
}

export function formatEther(weiHexOrBig: string | bigint, decimals = 4) {
  const wei = typeof weiHexOrBig === 'string' ? BigInt(weiHexOrBig) : weiHexOrBig
  const unit = 10n ** 18n
  const whole = wei / unit
  const frac = wei % unit
  // scale fractional to requested decimals
  const scale = 10n ** BigInt(decimals)
  const fracScaled = (frac * scale) / unit
  const fracStr = fracScaled.toString().padStart(decimals, '0').replace(/0+$/, '')
  return fracStr ? `${whole.toString()}.${fracStr}` : whole.toString()
}

async function jsonRpc(url: string, method: string, params: any[]) {
  const body = { jsonrpc: '2.0', id: 1, method, params }
  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const j = (await res.json()) as RpcReply<string>
  if (j.error) throw new Error(j.error.message)
  return j.result as string
}

export async function getEthBalance(address: string, chainIdPreferred?: number) {
  let chainId = chainIdPreferred
  const eth: any = (globalThis as any).ethereum
  // Always use checksummed address
  let checksummedAddress: string
  try {
    checksummedAddress = getAddress(address)
  } catch {
    checksummedAddress = address
  }
  try {
    if (!chainId && eth?.request) {
      const hex = await eth.request({ method: 'eth_chainId' })
      chainId = parseInt(hex, 16)
    }
  } catch {}
  if (!chainId) chainId = 11155111 // default to Sepolia

  // Try provider first
  try {
    if (eth?.request) {
      const weiHex = await eth.request({ method: 'eth_getBalance', params: [checksummedAddress, 'latest'] })
      const wei = BigInt(weiHex)
      return { chainId, wei, eth: formatEther(wei) }
    }
  } catch {}

  // Fallback to public RPCs
  const urls = PUBLIC_RPCS[chainId] || []
  for (const url of urls) {
    try {
      const weiHex = await jsonRpc(url, 'eth_getBalance', [checksummedAddress, 'latest'])
      const wei = BigInt(weiHex)
      return { chainId, wei, eth: formatEther(wei) }
    } catch {}
  }
  // If all fails
  return { chainId, wei: 0n, eth: '0' }
}

