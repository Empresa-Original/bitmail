import { SiweMessage } from 'siwe'
import { getAddress } from 'ethers';

function toHexChainId(id: number) { return '0x' + id.toString(16) }

function chainParamsById(id: number) {
  switch (id) {
    case 1:
      return { chainId: toHexChainId(1), chainName: 'Ethereum Mainnet', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: ['https://rpc.ankr.com/eth'], blockExplorerUrls: ['https://etherscan.io'] }
    case 11155111:
      return { chainId: toHexChainId(11155111), chainName: 'Sepolia', nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: ['https://rpc.sepolia.org', 'https://ethereum-sepolia-rpc.publicnode.com'], blockExplorerUrls: ['https://sepolia.etherscan.io'] }
    case 137:
      return { chainId: toHexChainId(137), chainName: 'Polygon', nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 }, rpcUrls: ['https://polygon-rpc.com'], blockExplorerUrls: ['https://polygonscan.com'] }
    case 80002:
      return { chainId: toHexChainId(80002), chainName: 'Polygon Amoy', nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 }, rpcUrls: ['https://rpc-amoy.polygon.technology'], blockExplorerUrls: ['https://www.oklink.com/amoy'] }
    default:
      return null
  }
}

export async function connectAndSiwe(domain: string, origin: string, opts?: { targetChainId?: number }) {
  const eth = (globalThis as any).ethereum as any | undefined
  if (!eth) throw new Error('No EVM wallet found')

  // Request accounts & chain
  const [rawAddress] = await eth.request({ method: 'eth_requestAccounts' })
  const address = getAddress(rawAddress);
  let chainIdHex = await eth.request({ method: 'eth_chainId' })
  let chainId = parseInt(chainIdHex, 16)

  if (opts?.targetChainId && chainId !== opts.targetChainId) {
    const wanted = chainParamsById(opts.targetChainId)
    if (wanted) {
      try {
        await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: wanted.chainId }] })
      } catch (e: any) {
        // Unrecognized chain – try adding then switching
        if (e?.code === 4902 && wanted) {
          await eth.request({ method: 'wallet_addEthereumChain', params: [wanted] })
          await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: wanted.chainId }] })
        } else {
          throw new Error('Please switch your wallet to the selected network')
        }
      }
      chainIdHex = await eth.request({ method: 'eth_chainId' })
      chainId = parseInt(chainIdHex, 16)
    }
  }

  const nonceRes = await fetch('/api/siwe/nonce', { cache: 'no-store', credentials: 'include' })
  const { nonce } = await nonceRes.json()

  const message = new SiweMessage({
    domain,
  address,
    statement: 'Sign in to BitMail via SIWE',
    uri: origin,
    version: '1',
    chainId,
    nonce,
  })
  const prepared = message.prepareMessage()

  const signature = await eth.request({
    method: 'personal_sign',
  params: [prepared, address],
  })

  const verifyRes = await fetch('/api/siwe/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: prepared, signature }),
    credentials: 'include',
  })
  const out = await verifyRes.json()
  if (!out.ok) throw new Error(out.error || 'SIWE verification failed')

  try { localStorage.setItem('bitmail.siwe.v1', JSON.stringify(out.session)) } catch {}
  return out.session as { address: string; chainId: number }
}

export async function fetchSiweSession() {
  try {
    const r = await fetch('/api/siwe/me', { cache: 'no-store' })
    const j = await r.json()
    if (j.ok) return j.session as { address: string; chainId: number }
  } catch {}
  try { const raw = localStorage.getItem('bitmail.siwe.v1'); if (raw) return JSON.parse(raw) } catch {}
  return null
}

export function resetSiweLocal() {
  try { localStorage.removeItem('bitmail.siwe.v1') } catch {}
}

export async function disconnectWallet() {
  // Clear local/session state
  resetSiweLocal()
  try { await fetch('/api/siwe/logout', { method: 'POST', credentials: 'include' }) } catch {}
  // Best-effort revoke permissions (not supported by all wallets)
  try {
    const eth: any = (globalThis as any).ethereum
    if (eth?.request) {
      // MetaMask supports wallet_revokePermissions for eth_accounts
      await eth.request({ method: 'wallet_revokePermissions', params: [{ eth_accounts: {} }] })
    }
  } catch {}
}
