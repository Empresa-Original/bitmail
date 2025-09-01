"use client";

import React, { useState } from 'react';
import { utils as ethersUtils } from 'ethers';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Checkbox } from '../../components/ui/checkbox';
import { Label } from '../../components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { connectAndSiwe, resetSiweLocal } from '../../lib/siwe-client';
import { shortAddress } from '../../lib/format';
import { JazzAvatar } from './JazzAvatar';
import { Tooltip, TooltipTrigger, TooltipContent } from '../../components/ui/tooltip';
import { CopyButton } from '../../components/ui/copy';
import { logEvent } from '../../lib/analytics';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/select';

export function LoginDialog({
  open,
  onOpenChange,
  onLogin,
  onGenerate,
  onSiweComplete,
  siweSession,
  walletAddress,
  onStartCheck,
  onEndCheck,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onLogin: (privateKeyHex: string, remember: boolean) => void;
  onGenerate: (remember: boolean) => void;
  onSiweComplete?: (session: { address: string; chainId: number }) => void;
  siweSession?: { address: string; chainId: number } | null;
  walletAddress?: string | null;
  onStartCheck?: () => void;
  onEndCheck?: () => void;
}) {
  const [key, setKey] = useState('');
  const [remember, setRemember] = useState(false);
  const [tab, setTab] = useState<'wallet'|'key'>('wallet');
  const [busy, setBusy] = useState(false);
  const [siweErr, setSiweErr] = useState('');
  const [network, setNetwork] = useState<string>('11155111'); // default sepolia
  const [ok, setOk] = useState(false);
  const [phase, setPhase] = useState<'idle'|'connecting'|'signing'|'verifying'|'success'|'error'>('idle')

  // Helper: finish with success, show brief message, then close dialog
  function finishSuccess(session?: { address: string; chainId: number }) {
    try { if (session) onSiweComplete?.(session) } catch {}
    setSiweErr('');
    setOk(true);
    setPhase('success');
    const t = setTimeout(() => { onOpenChange(false); setOk(false); }, 700);
    return () => clearTimeout(t);
  }

  // Close as soon as wallet reports a connected account (first-time connect)
  React.useEffect(() => {
    if (!open) return
    const eth: any = (globalThis as any).ethereum
    if (!eth || !eth.on) return
    const onAccountsChanged = async (accs: string[]) => {
      if (accs && accs[0]) {
        // Try to detect an active SIWE session; if not yet, still close to avoid stale modal
        try {
          const r = await fetch('/api/siwe/me', { cache: 'no-store', credentials: 'include' })
          const j = await r.json()
          if (j?.ok && j.session?.address) {
            finishSuccess(j.session)
            return
          }
        } catch {}
        // No server session yet – consider wallet connected and close optimistically
        setSiweErr('')
        setOk(true)
        const t = setTimeout(() => { onOpenChange(false); setOk(false); }, 400)
        return () => clearTimeout(t)
      }
    }
    eth.on('accountsChanged', onAccountsChanged)
    return () => {
      try { eth.removeListener('accountsChanged', onAccountsChanged) } catch {}
    }
  }, [open])

  // During signing/verifying, poll the server briefly for a session and close ASAP when it appears
  React.useEffect(() => {
    if (!open) return
    if (!(phase === 'signing' || phase === 'verifying')) return
    let canceled = false
    let attempts = 0
    async function tick() {
      if (canceled) return
      attempts += 1
      try {
        const r = await fetch('/api/siwe/me', { cache: 'no-store', credentials: 'include' })
        const j = await r.json()
        if (j?.ok && j.session?.address) {
          finishSuccess(j.session)
          return
        }
      } catch {}
      if (attempts < 12) setTimeout(tick, 250)
    }
    tick()
    return () => { canceled = true }
  }, [open, phase])

  // If parent detects a session while the dialog is open, auto-close gracefully
  React.useEffect(() => {
    if (open && siweSession && siweSession.address) {
      setSiweErr('');
      setPhase('success')
      setOk(true);
      const t = setTimeout(() => { onOpenChange(false); setOk(false); }, 700);
      return () => clearTimeout(t);
    }
  }, [siweSession, open]);

  // Reset transient UI when reopened
  React.useEffect(() => {
    if (open) {
      setSiweErr('');
      setOk(false);
      setBusy(false);
      setPhase('idle')
    }
  }, [open])

  const looksHex = /^[0-9a-fA-F]+$/.test(key) && key.length >= 64;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{siweSession ? 'Connected' : 'Sign in'}</DialogTitle>
          <DialogDescription>{siweSession ? 'Wallet session is active.' : 'Connect a wallet or use a private key.'}</DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList>
            <TabsTrigger value="wallet">Wallet</TabsTrigger>
            <TabsTrigger value="key">Key</TabsTrigger>
          </TabsList>
        </Tabs>

        {tab === 'wallet' && (
          <div className="grid gap-3 py-3">
            <div className="text-sm text-muted-foreground">
              Use Sign-In with Ethereum (SIWE). Testnets are supported.
            </div>
            <div className="grid gap-1 md:grid-cols-[160px_1fr] md:items-center">
              <label className="text-sm text-muted-foreground">Network</label>
              <Select value={network} onValueChange={setNetwork}>
                <SelectTrigger className="w-full md:w-[220px]"><SelectValue placeholder="Select network" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="11155111">Sepolia (ETH testnet)</SelectItem>
                  <SelectItem value="1">Ethereum Mainnet</SelectItem>
                  <SelectItem value="137">Polygon</SelectItem>
                  <SelectItem value="80002">Polygon Amoy (testnet)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {siweErr && <div className="text-xs text-destructive">{siweErr}</div>}
            {!siweSession && (
              <div className="flex gap-2">
                <Button
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true); setSiweErr(''); setPhase('connecting'); onStartCheck?.();
                    try {
                      logEvent('siwe.sign.click', { chainId: parseInt(network) })
                      // Move to signing state and perform SIWE
                      setPhase('signing')
                      // Validate wallet address format before SIWE
                      const eth = (globalThis as any).ethereum;
                      const [rawAddress] = await eth.request({ method: 'eth_requestAccounts' });
                      let address: string;
                      try {
                        address = ethersUtils.getAddress(rawAddress);
                      } catch {
                        setSiweErr(`Invalid wallet address: ${rawAddress}`);
                        setPhase('error');
                        setBusy(false); onEndCheck?.();
                        return;
                      }
                      console.log('Using wallet address:', address, 'ChainId:', network);
                      // Pass checksummed address to SIWE client if needed
                      const sess = await connectAndSiwe(location.host, location.origin, { targetChainId: parseInt(network) });
                      setPhase('verifying')
                      finishSuccess(sess);
                    } catch (e: any) {
                      setPhase('error')
                      // Detailed error logging
                      console.error('SIWE connect error:', e);
                      // Fallback: if session is already valid, treat as success
                      try {
                        const r = await fetch('/api/siwe/me', { cache: 'no-store', credentials: 'include' })
                        const j = await r.json()
                        console.log('Fallback /api/siwe/me response:', j);
                        if (j?.ok && j.session?.address) {
                          finishSuccess(j.session)
                          setSiweErr('')
                          return
                        }
                      } catch (err) {
                        console.error('Fallback /api/siwe/me error:', err);
                      }
                      // If wallet is connected (or session existed already), consider this a success UX-wise
                      if (siweSession?.address) {
                        finishSuccess(siweSession)
                        setSiweErr('')
                        return
                      }
                      if (walletAddress) {
                        finishSuccess({ address: walletAddress, chainId: parseInt(network) })
                        setSiweErr('')
                        return
                      }
                      setSiweErr(e?.message ? `Failed to connect: ${e.message}` : 'Failed to connect');
                    } finally {
                      setBusy(false); onEndCheck?.();
                    }
                  }}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                >{busy ? (phase === 'signing' ? 'Signing…' : phase === 'verifying' ? 'Verifying…' : 'Connecting…') : (walletAddress ? 'Sign message' : 'Connect & sign')}</Button>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={async () => {
                    logEvent('siwe.reset');
                    resetSiweLocal();
                    try { await fetch('/api/siwe/nonce', { cache: 'no-store', credentials: 'include' }) } catch {}
                    setSiweErr('');
                    setPhase('idle')
                  }}
                >Reset</Button>
              </div>
            )}
            {ok && (
              <div className="text-xs text-green-600 dark:text-green-400">Connected successfully</div>
            )}
            {phase !== 'idle' && !ok && busy && (
              <div className="text-xs text-muted-foreground">{phase === 'signing' ? 'Please sign the message in your wallet…' : phase === 'verifying' ? 'Verifying signature…' : 'Connecting to wallet…'}</div>
            )}
            {siweSession && (
              <div className="flex items-center justify-between rounded-md border p-2 text-sm">
                <div className="flex items-center gap-2">
                    <JazzAvatar address={siweSession.address} diameter={32} />
                    <span>Connected {shortAddress(siweSession.address)} on chain {siweSession.chainId}</span>
                    <CopyButton value={siweSession.address} />
                  </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={async () => {
                        logEvent('siwe.disconnect');
                        resetSiweLocal();
                        try { await fetch('/api/siwe/logout', { method: 'POST', credentials: 'include' }) } catch {}
                        onSiweComplete?.({ address: '', chainId: 0 } as { address: string; chainId: number })
                        onOpenChange(false)
                      }}
                  >Disconnect</Button>
                </div>
              </div>
            )}
            <div className="text-xs text-muted-foreground">No wallet? Install MetaMask or use another EVM wallet.</div>
          </div>
        )}

        {tab === 'key' && (
          <div className="grid gap-3 py-2">
            <div className="grid gap-1">
              <label className="text-sm text-muted-foreground">Private key</label>
              <Input value={key} onChange={(e) => setKey(e.target.value.trim())} placeholder="hex-encoded private key" />
              {!looksHex && key && (
                <div className="text-xs text-muted-foreground">Expecting a hex string, 64+ chars.</div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="remember-login" checked={remember} onCheckedChange={(v) => setRemember(Boolean(v))} />
              <Label htmlFor="remember-login" className="text-sm">Remember on this device</Label>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { logEvent('key.generate'); onGenerate(remember) }}>Generate new</Button>
              <Button onClick={() => { logEvent('key.login'); onLogin(key, remember) }} disabled={!looksHex}>Log in</Button>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
