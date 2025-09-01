'use client';

import React from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '../../components/ui/drawer';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Checkbox } from '../../components/ui/checkbox';
import { Label } from '../../components/ui/label';
import { useColorTheme, type AccentTheme } from '../../components/color-theme';
import { useTheme } from 'next-themes';
import { useToast } from '../../components/ui/use-toast';
import { caip10Account, didEthr, didPkh } from '../../lib/identity';
import { shortAddress } from '../../lib/format';
import { JazzAvatar } from './JazzAvatar';
import { BlockiesAvatar } from './BlockiesAvatar';
import { Tooltip, TooltipTrigger, TooltipContent } from '../../components/ui/tooltip';
import { CopyButton } from '../../components/ui/copy';
import { logEvent } from '../../lib/analytics';

export function SettingsPanel({
  open,
  onClose,
  pubkey,
  walletAddress,
  remember,
  onRememberChange,
  onRegenerate,
  onClearStorage,
}: {
  open: boolean;
  onClose: () => void;
  pubkey?: string;
  walletAddress?: string | null;
  remember: boolean;
  onRememberChange: (v: boolean) => void;
  onRegenerate: () => void;
  onClearStorage: () => void;
}) {
  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  const [section, setSection] = React.useState<'account'|'general'|'chains'|'people'>('account')

  return (
    <Drawer open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DrawerContent className="h-[85vh] bg-card/80 backdrop-blur-xl border-border shadow-2xl flex flex-col">
        <DrawerHeader className="pb-2">
          <DrawerTitle>Settings</DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 min-h-0 flex">
          <aside className="w-48 border-r border-border px-2 py-3 space-y-1">
            {[
              { key: 'account', label: 'Account' },
              { key: 'general', label: 'General' },
              { key: 'chains', label: 'Chains' },
              { key: 'people', label: 'People' },
            ].map((item) => (
              <Button
                key={item.key}
                variant="ghost"
                className={`w-full justify-start ${section===item.key ? 'bg-[var(--active)] text-primary' : ''}`}
                onClick={() => { logEvent('settings.section', { section: item.key }); setSection(item.key as any) }}
              >
                {item.label}
              </Button>
            ))}
          </aside>
          <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
            {section === 'account' && (
              <AccountSection
                pubkey={pubkey}
                walletAddress={walletAddress || undefined}
                remember={remember}
                onRememberChange={onRememberChange}
                onRegenerate={onRegenerate}
                onClearStorage={onClearStorage}
              />
            )}
            {section === 'general' && <AppearanceSection />}
            {section === 'chains' && <ChainsSection />}
            {section === 'people' && <PeopleSection />}
          </div>
        </div>

        <DrawerFooter className="px-4 pt-2">
          <div className="text-xs text-muted-foreground ml-auto">v0.1.0 • Experimental build</div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function AppearanceSection() {
  const { accent, setAccent, mode, setMode } = useColorTheme()
  const { theme, setTheme } = useTheme()
  const themes: { key: AccentTheme; name: string; color: string }[] = [
    { key: 'default', name: 'Default', color: 'hsl(222.2 47.4% 11.2%)' },
    { key: 'blue', name: 'Blue', color: 'hsl(221.2 83.2% 53.3%)' },
    { key: 'green', name: 'Green', color: 'hsl(142.1 70.6% 45.3%)' },
    { key: 'amber', name: 'Amber', color: 'hsl(38 92% 50%)' },
    { key: 'rose', name: 'Rose', color: 'hsl(346.8 77.2% 49.8%)' },
    { key: 'purple', name: 'Purple', color: 'hsl(262.1 83.3% 57.8%)' },
    { key: 'orange', name: 'Orange', color: 'hsl(24.6 95% 53.1%)' },
    { key: 'teal', name: 'Teal', color: 'hsl(173 80% 40%)' },
  ]
  return (
    <section className="grid gap-3">
      <div className="font-semibold">Appearance</div>
      <div className="grid gap-1">
        <div className="text-xs text-muted-foreground">Appearance mode</div>
        <div className="flex gap-2">
          {(['light','dark','system'] as const).map(mode => (
            <Button
              key={mode}
              variant={theme === mode ? 'default' : 'outline'}
              size="sm"
              onClick={() => { logEvent('theme.mode', { mode }); setTheme(mode) }}
            >
              {mode[0].toUpperCase() + mode.slice(1)}
            </Button>
          ))}
        </div>
      </div>
      <div className="grid gap-1">
        <div className="text-xs text-muted-foreground">Options</div>
        <div className="flex gap-2">
          {(['default','scaled','mono'] as const).map(m => (
            <Button
              key={m}
              variant={mode === m ? 'default' : 'outline'}
              size="sm"
              onClick={() => { logEvent('theme.option', { option: m }); setMode(m) }}
            >
              {m === 'default' ? 'Default' : m === 'scaled' ? 'Scaled' : 'Mono'}
            </Button>
          ))}
        </div>
      </div>
      <div className="text-xs text-muted-foreground">Colors</div>
      <div className="grid grid-cols-3 gap-2">
        {themes.map(t => (
          <button
            key={t.key}
            onClick={() => { logEvent('theme.accent', { accent: t.key }); setAccent(t.key) }}
            className={`relative flex items-center gap-2 rounded-md border p-2 text-left transition-all hover:bg-[var(--hover-medium)] ${accent === t.key ? 'border-primary ring-2 ring-primary/40' : 'border-border'}`}
            aria-label={`Use ${t.name} theme`}
          >
            <span className="inline-block h-4 w-4 rounded-sm" style={{ background: t.color }} />
            <span className="text-sm">{t.name}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

function AccountSection({ pubkey, walletAddress, remember, onRememberChange, onRegenerate, onClearStorage }: { pubkey?: string; walletAddress?: string; remember: boolean; onRememberChange: (v:boolean)=>void; onRegenerate: ()=>void; onClearStorage: ()=>void }) {
  const [saveStatus, setSaveStatus] = React.useState<'idle'|'saved'>('idle');
  const handleSave = () => {
    try {
      localStorage.setItem('bitmail.identity.meta.v1', JSON.stringify({ displayName, ens, ud, sns, ethChainId, ethAddress, avatarType }));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1200);
    } catch {}
  };
  const [avatarType, setAvatarType] = React.useState<'jazzicon'|'blockies'>(() => {
    if (typeof window !== 'undefined') {
      const v = localStorage.getItem('bitmail.avatarType.v1');
      if (v === 'blockies' || v === 'jazzicon') return v;
    }
    return 'jazzicon';
  });
  const handleAvatarChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value as 'jazzicon'|'blockies';
    setAvatarType(v);
    if (typeof window !== 'undefined') {
      localStorage.setItem('bitmail.avatarType.v1', v);
    }
  };
  const [displayName, setDisplayName] = React.useState('')
  const [ens, setEns] = React.useState('')
  const [ud, setUd] = React.useState('')
  const [sns, setSns] = React.useState('')
  const [ethChainId, setEthChainId] = React.useState('11155111')
  const [ethAddress, setEthAddress] = React.useState('')

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('bitmail.identity.meta.v1')
      if (raw) {
        const v = JSON.parse(raw)
        setDisplayName(v.displayName || '')
        setEns(v.ens || '')
        setUd(v.ud || '')
        setSns(v.sns || '')
        setEthChainId(v.ethChainId || '11155111')
        setEthAddress(v.ethAddress || walletAddress || '')
      }
    } catch {}
  }, [walletAddress])
  React.useEffect(() => {
    try {
      localStorage.setItem('bitmail.identity.meta.v1', JSON.stringify({ displayName, ens, ud, sns, ethChainId, ethAddress, avatarType }))
    } catch {}
  }, [displayName, ens, ud, sns, ethChainId, ethAddress, avatarType])

  const caip = caip10Account(ethChainId, ethAddress)
  const didpkh = didPkh(ethChainId, ethAddress)
  const didethr = didEthr(ethChainId, ethAddress)
  const displayCaip = ethAddress ? `eip155:${ethChainId}:${shortAddress(ethAddress)}` : ''
  const displayDidPkh = ethAddress ? `did:pkh:eip155:${ethChainId}:${shortAddress(ethAddress)}` : ''
  const displayDidEthr = ethAddress ? `did:ethr:${ethChainId}:${shortAddress(ethAddress)}` : ''

  return (
  <section className="grid gap-4">
      <div className="font-semibold">Identity</div>
      <div className="grid gap-3">
        <div className="rounded-md border p-3 grid gap-2">
          <div className="text-xs text-muted-foreground">Wallet address</div>
          <div className="flex items-center gap-2 text-sm">
            {avatarType === 'jazzicon' ? (
              <JazzAvatar address={pubkey || ''} diameter={32} />
            ) : (
              <BlockiesAvatar address={pubkey || ''} diameter={32} />
            )}
            <span className="truncate" title={pubkey || ''}>{shortAddress(pubkey)}</span>
            {pubkey && (<CopyButton value={pubkey} onCopy={() => logEvent('wallet.copy.settings')} />)}
          </div>
          <div className="flex gap-2 items-center mt-2">
            <Label className="text-xs text-muted-foreground">Profile Picture</Label>
            <select value={avatarType} onChange={e => setAvatarType(e.target.value as 'jazzicon'|'blockies')} className="border rounded px-2 py-1 text-xs">
              <option value="jazzicon">Jazzicon</option>
              <option value="blockies">Blockies</option>
            </select>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="grid gap-1">
            <Label htmlFor="id-name" className="text-xs text-muted-foreground">Display name</Label>
            <Input id="id-name" value={displayName} onChange={(e)=> setDisplayName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="id-ens" className="text-xs text-muted-foreground">ENS / UD / SNS</Label>
            <Input id="id-ens" value={ens} onChange={(e)=> setEns(e.target.value)} placeholder="mimos.eth" />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="id-ud" className="text-xs text-muted-foreground">Unstoppable (optional)</Label>
            <Input id="id-ud" value={ud} onChange={(e)=> setUd(e.target.value)} placeholder="yourname.crypto" />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="id-sns" className="text-xs text-muted-foreground">Solana Name Service (optional)</Label>
            <Input id="id-sns" value={sns} onChange={(e)=> setSns(e.target.value)} placeholder="name.sol" />
          </div>
        </div>

        <div className="grid gap-2">
          <div className="font-medium">Ethereum account</div>
          <div className="grid md:grid-cols-[120px_1fr] gap-2">
            <div className="grid gap-1">
              <Label htmlFor="id-chain" className="text-xs text-muted-foreground">Chain ID</Label>
              <Input id="id-chain" value={ethChainId} onChange={(e)=> setEthChainId(e.target.value)} placeholder="1" />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="id-addr" className="text-xs text-muted-foreground">Address</Label>
              <Input id="id-addr" value={ethAddress} onChange={(e)=> setEthAddress(e.target.value)} placeholder="0x..." />
            </div>
          </div>
          <div className="grid gap-1">
            <Label className="text-xs text-muted-foreground">CAIP-10</Label>
            <div className="flex items-center gap-2 text-sm break-all">
              <span className="truncate" title={caip || ''}>{displayCaip || '—'}</span>
              {caip && (<CopyButton value={caip} onCopy={() => logEvent('identity.copy.caip')} />)}
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-2">
            <div className="grid gap-1">
              <Label className="text-xs text-muted-foreground">did:pkh</Label>
              <div className="flex items-center gap-2 text-sm break-all">
                <span className="truncate" title={didpkh || ''}>{displayDidPkh || '—'}</span>
                {didpkh && (<CopyButton value={didpkh} onCopy={() => logEvent('identity.copy.didpkh')} />)}
              </div>
            </div>
            <div className="grid gap-1">
              <Label className="text-xs text-muted-foreground">did:ethr</Label>
              <div className="flex items-center gap-2 text-sm break-all">
                <span className="truncate" title={didethr || ''}>{displayDidEthr || '—'}</span>
                {didethr && (<CopyButton value={didethr} onCopy={() => logEvent('identity.copy.didethr')} />)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox id="remember-identity" checked={remember} onCheckedChange={(v) => onRememberChange(Boolean(v))} />
        <Label htmlFor="remember-identity" className="text-sm">Remember identity on this device</Label>
      </div>
      {remember && (
        <Button onClick={onClearStorage} variant="outline" className="w-fit text-muted-foreground">Clear stored identity</Button>
      )}
      <Button onClick={handleSave} variant="default" className="mt-2 w-fit">
        {saveStatus === 'saved' ? 'Saved!' : 'Save'}
      </Button>
    </section>
  )
}

function ChainsSection() {
  const { toast } = useToast()
  const [cfg, setCfg] = React.useState<Record<string, { enabled: boolean; address: string; chainId?: string }>>({})
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('bitmail.chains.v1')
      if (raw) setCfg(JSON.parse(raw))
    } catch {}
  }, [])
  React.useEffect(() => {
    try { localStorage.setItem('bitmail.chains.v1', JSON.stringify(cfg)) } catch {}
  }, [cfg])
  const chains = ['Bitcoin','Ethereum','Solana','Polygon'] as const
  return (
    <section className="grid gap-3">
      <div className="font-semibold">Chains</div>
      <div className="text-xs text-muted-foreground">Configure supported chains, chain IDs/networks, and sync addresses from a wallet.</div>
      <div className="grid gap-3">
        {chains.map((name) => {
          const key = name.toLowerCase()
          const c = cfg[key] || { enabled: name=== 'Bitcoin' || name=== 'Ethereum', address: '', chainId: '' }
          return (
            <div key={key} className="rounded-md border p-3 grid gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-medium">
                  <ChainIcon name={name} />
                  {name}
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id={`chain-${key}`} checked={!!c.enabled} onCheckedChange={(v)=> { logEvent('chains.enable', { chain: key, enabled: Boolean(v) }); setCfg(prev=> ({...prev, [key]: { ...c, enabled: Boolean(v) }})) }} />
                  <Label htmlFor={`chain-${key}`} className="text-sm">Enabled</Label>
                </div>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="grid gap-1">
                  <Label htmlFor={`chainid-${key}`} className="text-xs text-muted-foreground">Chain ID / Network</Label>
                  <Input id={`chainid-${key}`} value={c.chainId || ''} onChange={(e)=> setCfg(prev=> ({...prev, [key]: { ...c, chainId: e.target.value }}))} placeholder={name==='Ethereum' ? '1 (mainnet)' : name==='Polygon' ? '137' : name==='Bitcoin' ? 'mainnet' : 'mainnet'} />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor={`addr-${key}`} className="text-xs text-muted-foreground">Default address (optional)</Label>
              <Input id={`addr-${key}`} value={c.address} onChange={(e)=> setCfg(prev=> ({...prev, [key]: { ...c, address: e.target.value }}))} placeholder="0x..." />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => {
                  try {
                    const raw = localStorage.getItem(`bitmail.wallet.${key}`)
                    if (raw) {
                      const addr = JSON.parse(raw).address || String(raw)
                      logEvent('chains.sync', { chain: key });
                      setCfg(prev => ({...prev, [key]: { ...c, address: addr }}))
                      toast({ title: 'Synced', description: `${name} address loaded from wallet.` })
                    } else {
                      toast({ title: 'No wallet found', description: `Connect or save a ${name} wallet first.`, })
                    }
                  } catch {
                    toast({ title: 'No wallet found', description: `Connect or save a ${name} wallet first.`, })
                  }
                }}>Sync from wallet</Button>
                <Button variant="outline" size="sm" onClick={() => { logEvent('chains.clear', { chain: key }); setCfg(prev => ({...prev, [key]: { ...c, address: '' }})) }}>Clear address</Button>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

type Contact = { name: string; address: string }
function PeopleSection() {
  const [contacts, setContacts] = React.useState<Contact[]>([])
  const [name, setName] = React.useState('')
  const [address, setAddress] = React.useState('')
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('bitmail.people.v1')
      if (raw) setContacts(JSON.parse(raw))
    } catch {}
  }, [])
  React.useEffect(() => {
    try { localStorage.setItem('bitmail.people.v1', JSON.stringify(contacts)) } catch {}
  }, [contacts])
  function addContact() {
    const n = name.trim(), a = address.trim()
    if (!n || !a) return
    setContacts(prev => [{ name: n, address: a }, ...prev])
    setName(''); setAddress('')
  }
  return (
    <section className="grid gap-3">
      <div className="font-semibold">People</div>
      <div className="text-xs text-muted-foreground">Save contacts or watch wallet addresses.</div>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-2 items-end">
        <div className="grid gap-1">
          <Label htmlFor="contact-name" className="text-xs text-muted-foreground">Name</Label>
          <Input id="contact-name" value={name} onChange={(e)=> setName(e.target.value)} placeholder="Alice" />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="contact-addr" className="text-xs text-muted-foreground">Email or wallet address</Label>
          <Input id="contact-addr" value={address} onChange={(e)=> setAddress(e.target.value)} placeholder="name@bitmail.to or 0x..." />
        </div>
        <Button onClick={addContact}>Add</Button>
      </div>
      <div className="grid gap-2">
        {contacts.length === 0 && (
          <div className="text-sm text-muted-foreground">No contacts yet.</div>
        )}
        {contacts.map((c, i) => (
          <div key={i} className="flex items-center justify-between rounded-md border p-2">
            <div className="min-w-0">
              <div className="font-medium truncate">{c.name}</div>
              <div className="text-xs text-muted-foreground truncate">{c.address}</div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setContacts(prev => prev.filter((_, j) => j!==i))}>Remove</Button>
          </div>
        ))}
      </div>
    </section>
  )
}

function ChainIcon({ name }: { name: 'Bitcoin'|'Ethereum'|'Solana'|'Polygon' }) {
  switch (name) {
    case 'Bitcoin':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="12" r="10" fill="#F7931A" />
          <text x="12" y="16" textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff">₿</text>
        </svg>
      )
    case 'Ethereum':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
          <polygon points="12,3 6,12 12,9 18,12" fill="#627EEA" />
          <polygon points="12,21 6,13 12,16 18,13" fill="#627EEA" opacity="0.8" />
        </svg>
      )
    case 'Solana':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
          <rect x="6" y="5" width="12" height="3" rx="1" fill="#14F195" />
          <rect x="6" y="10.5" width="12" height="3" rx="1" fill="#00FFA3" />
          <rect x="6" y="16" width="12" height="3" rx="1" fill="#9945FF" />
        </svg>
      )
    case 'Polygon':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
          <path d="M8.5 7l3.5-2 3.5 2v4l-3.5 2-3.5-2V7zm-4 2l3.5-2v4L4.5 13 1 11V7l3.5 2zm11 0l3.5-2L21.5 9v4l-3.5 2-3.5-2V9z" fill="#8247E5" />
        </svg>
      )
  }
}
