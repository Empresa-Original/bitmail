'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Message } from '@bitmail/core';
import { createIdentity, publicKeyFromPrivate } from '@bitmail/core';
import type { Identity } from '@bitmail/core';
import { ComposePanel, type ComposeDraft } from './components/ComposePanel';
import { SettingsPanel } from './components/SettingsPanel';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Separator } from '../components/ui/separator';
import { ScrollArea } from '../components/ui/scroll-area';
import { useToast } from '../components/ui/use-toast';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '../components/ui/tooltip';
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator, CommandShortcut } from '../components/ui/command';
import { useTheme } from 'next-themes';
import { Inbox, Star, Send, FileText, Archive as ArchiveIcon, Settings as SettingsIcon, Plus, Search } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '../components/ui/dropdown-menu';
import { LoginDialog } from './components/LoginDialog';
import { JazzAvatar } from './components/JazzAvatar';
import { BlockiesAvatar } from './components/BlockiesAvatar';
import { connectAndSiwe, fetchSiweSession, resetSiweLocal, disconnectWallet } from '../lib/siwe-client';
import { shortAddress } from '../lib/format';
import { logEvent } from '../lib/analytics';
import { CopyButton } from '../components/ui/copy';
import { getEthBalance } from '../lib/evm';

type Folder = 'inbox' | 'starred' | 'sent' | 'drafts' | 'archive';

type Store = {
  inbox: Message[];
  sent: Message[];
  drafts: Message[];
  starred: Message[];
  archive: Message[];
};

// Stable demo data for SSR/CSR parity to avoid hydration mismatches
const DEMO_MESSAGES: Message[] = [
  { id: '1', from: 'alice@bitmail.to', to: ['mimos.eth'], subject: 'Welcome to BitMail', body: 'This is a placeholder message.', createdAt: 1700000000000 },
  { id: '2', from: 'bob@bitmail.to', to: ['mimos.eth'], subject: 'BTC address mapping', body: "Let's discuss mapping BTC addresses to pubkeys.", createdAt: 1699996400000 },
  { id: '3', from: 'carol@bitmail.to', to: ['mimos.eth'], subject: 'Nostr relays', body: 'Which relays should we default to?', createdAt: 1699992800000 },
];

function fmtTime(ts: number) {
  // Render HH:MM in UTC to be deterministic between server and client
  const s = new Date(ts).toISOString();
  return s.slice(11, 16) + ' UTC';
}

function fmtDateTime(ts: number) {
  const s = new Date(ts).toISOString();
  return s.slice(0, 10) + ' ' + s.slice(11, 16) + ' UTC';
}

function Icon({ name }: { name: Folder | 'search' | 'settings' }) {
  const common = { width: 16, height: 16, fill: 'currentColor' } as const;
  switch (name) {
    case 'inbox':
      return (
        <svg {...common} viewBox="0 0 24 24"><path d="M19 3H5a2 2 0 00-2 2v6h6l2 3h2l2-3h6V5a2 2 0 00-2-2zM3 13v6a2 2 0 002 2h14a2 2 0 002-2v-6h-4l-2 3H9l-2-3H3z"/></svg>
      );
    case 'starred':
      return (
        <svg {...common} viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
      );
    case 'sent':
      return (
        <svg {...common} viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>
      );
    case 'drafts':
      return (
        <svg {...common} viewBox="0 0 24 24"><path d="M3 6l9-4 9 4v6c0 5-3.5 9.74-9 11-5.5-1.26-9-6-9-11V6zm9 12a7 7 0 007-7V7.24L12 4.47 5 7.24V11a7 7 0 007 7z"/></svg>
      );
    case 'archive':
      return (
        <svg {...common} viewBox="0 0 24 24"><path d="M20.54 5.23L19.15 3.5A2 2 0 0017.59 3H6.41a2 2 0 00-1.56.73L3.46 5.23A2 2 0 003 6.5V20a2 2 0 002 2h14a2 2 0 002-2V6.5a2 2 0 00-.46-1.27zM6.41 5h11.18l1 1.27H5.41L6.41 5zM19 20H5V8h14v12zM9 12h6v2H9v-2z"/></svg>
      );
    case 'search':
      return (
        <svg {...common} viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16a6.471 6.471 0 004.23-1.57l.27.28v.79L20 21.5 21.5 20 15.5 14zM9.5 14C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
      );
    case 'settings':
      return (
        <svg {...common} viewBox="0 0 24 24"><path d="M19.14 12.94a7.97 7.97 0 000-1.88l2.03-1.58a.5.5 0 00.12-.64l-1.92-3.32a.5.5 0 00-.6-.22l-2.39.96c-.5.43-1.05.78-1.62 1l.36 2.54c.05.26.26.45.5.45h3.8c.24 0 .45-.19.5-.43l.36-2.54c.57-.22 1.11-.57 1.62-1l2.39.96c.26.12.56.02.7-.22l1.92-3.32a.5.5 0 00-.12-.64l-2.03-1.58zM11 15a3 3 0 110-6 3 3 0 010 6z"/></svg>
      );
  }
}

function Sidebar({
  pubkey,
  onCompose,
  onOpenSettings,
  selected,
  onSelect,
  inboxCount,
}: {
  pubkey?: string;
  onCompose: () => void;
  onOpenSettings: () => void;
  selected: Folder;
  onSelect: (f: Folder) => void;
  inboxCount: number;
}) {
  const { toast } = useToast();
  function copyPubkey() {
    if (!pubkey) return;
    navigator.clipboard?.writeText(pubkey).then(() => {
      toast({ title: 'Copied', description: 'Public key copied to clipboard.' });
    }).catch(() => {});
  }

  const NavButton = ({ id, label, icon, count }: { id: Folder; label: string; icon: React.ReactNode; count?: number }) => (
    <Button
      onClick={() => { logEvent('sidebar.nav.select', { id }); onSelect(id) }}
      variant="ghost"
      className={`justify-between w-full ${selected === id ? 'bg-[var(--active)] text-primary border border-border' : 'text-foreground hover:bg-[var(--hover-medium)]'}`}
    >
      <span className="inline-flex items-center gap-2">
        <span className="w-4 inline-flex">{icon}</span>
        <span className="font-medium">{label}</span>
      </span>
      {typeof count === 'number' && (
        <Badge className="h-5 bg-[var(--badge-bg)] text-[var(--badge-fg)] border-[var(--badge-bg)]">{count}</Badge>
      )}
    </Button>
  );

  return (
    <aside className="w-[280px] border-r border-border bg-card/50 backdrop-blur-sm">
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2 font-extrabold">
          <span className="w-2 h-2 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600" />
          BitMail
          <Badge className="ml-1 h-5 text-[11px] bg-[var(--badge-secondary-bg)] text-[var(--badge-secondary-fg)] border-[var(--badge-secondary-bg)]" variant="secondary">beta</Badge>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={() => { logEvent('compose.open'); onCompose() }} title="New message" variant="outline" size="icon">
              <Plus className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>New message</TooltipContent>
        </Tooltip>
      </div>
      <Separator />

      <ScrollArea className="h-[calc(100vh-60px)]">
        <div className="p-2 grid gap-2">
          <nav className="grid gap-1">
            <NavButton id="inbox" label="Inbox" icon={<Inbox className="w-4 h-4" />} count={inboxCount} />
            <NavButton id="starred" label="Starred" icon={<Star className="w-4 h-4" />} />
            <NavButton id="sent" label="Sent" icon={<Send className="w-4 h-4" />} />
            <NavButton id="drafts" label="Drafts" icon={<FileText className="w-4 h-4" />} />
            <NavButton id="archive" label="Archive" icon={<ArchiveIcon className="w-4 h-4" />} />
          </nav>

          <div className="mt-2">
            <div className="text-xs text-muted-foreground mb-1">Labels</div>
            <div className="flex gap-2 flex-wrap">
              <Badge className="bg-[var(--badge-secondary-bg)] text-[var(--badge-secondary-fg)] border-[var(--badge-secondary-bg)]" variant="secondary">Work</Badge>
              <Badge className="bg-[var(--badge-secondary-bg)] text-[var(--badge-secondary-fg)] border-[var(--badge-secondary-bg)]" variant="secondary">Personal</Badge>
            </div>
            <div className="text-xs text-muted-foreground mt-1">No custom labels yet</div>
          </div>

          <div className="mt-3">
            <Separator className="my-2" />
            <div className="text-xs text-muted-foreground mt-2">Wallet</div>
            <div className="mt-1 flex gap-2 items-center">
              <span className="truncate" title={pubkey || ''}>{(pubkey && shortAddress(pubkey)) || '—'}</span>
              {pubkey && (<CopyButton value={pubkey} onCopy={() => logEvent('wallet.copy.sidebar')} />)}
            </div>
            {!pubkey && (
              <div className="text-xs text-muted-foreground mt-1">No identity configured</div>
            )}
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}

function highlight(text: string, q: string) {
  if (!q) return text;
  const parts = text.split(new RegExp(`(${q.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'ig'));
  return parts.map((part, i) =>
    part.toLowerCase() === q.toLowerCase() ? <mark key={i}>{part}</mark> : <span key={i}>{part}</span>
  );
}

function MailList({ items, onSelect, selectedId, q, meta, drafts, selectedFolder }: { items: Message[]; onSelect: (m: Message) => void; selectedId?: string; q: string; meta: Record<string, { focused: boolean; hasAttachment?: boolean; status?: 'Verified' | 'On-chain' | 'IPFS'; chain?: 'BTC' | 'ETH' }>; drafts: Message[]; selectedFolder: Folder }) {
  function canonicalSubject(s?: string) {
    let x = (s || '(no subject)').trim();
    // strip repeated prefixes like Re:, Fwd:
    for (;;) {
      const y = x.replace(/^\s*(re:|fwd:)\s*/i, '');
      if (y === x) break;
      x = y;
    }
    return x.toLowerCase();
  }

  // Group by canonical subject
  const map = new Map<string, Message[]>();
  for (const m of items) {
    const key = canonicalSubject(m.subject);
    const arr = map.get(key) || [];
    arr.push(m);
    map.set(key, arr);
  }
  const threads = Array.from(map.entries()).map(([key, arr]) => ({ key, items: arr.sort((a, b) => b.createdAt - a.createdAt) }));

  if (threads.length === 0) {
    const folderName = selectedFolder || 'inbox';
    const folderIcon = {
      inbox: '📥',
      sent: '📤',
      drafts: '📝',
      archive: '📦',
      starred: '⭐'
    }[folderName] || '📭';
    
    return (
      <div className="w-[360px] border-r border-border h-full overflow-y-auto bg-background/30 backdrop-blur-sm flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <div className="text-4xl mb-2">{folderIcon}</div>
          <div className="font-medium">No {folderName} messages</div>
          <div className="text-sm">
            {q ? 'No search results found' : `Your ${folderName} is empty`}
          </div>
          {!q && folderName === 'inbox' && (
            <div className="text-xs mt-2 opacity-70">Try composing a message to get started</div>
          )}
        </div>
      </div>
    );
  }

  return (
<div className="w-[360px] border-r border-border h-full overflow-y-auto bg-background/30 backdrop-blur-sm">
      {threads.map((t) => (
        <div key={t.key}>
          <div className="px-3 py-2 border-b border-[var(--row-border)] flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <strong className="truncate">{highlight(t.items[0].subject || '(no subject)', q)}</strong>
              {t.items.length > 1 && (
                <Badge className="h-5 text-[10px] bg-[var(--badge-secondary-bg)] text-[var(--badge-secondary-fg)] border-[var(--badge-secondary-bg)]" variant="secondary">{t.items.length}</Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{fmtTime(t.items[0].createdAt)}</span>
          </div>
          {t.items.map((m) => {
            const mm = meta[m.id] || { focused: true };
            const badge = drafts.some((d) => d.id === m.id) ? 'Draft' : mm.status;
            return (
              <div
                key={m.id}
                onClick={() => onSelect(m)}
                className={`grid grid-cols-[36px_1fr_auto] gap-2 p-3 cursor-pointer border-b border-[var(--row-border)] ${selectedId === m.id ? 'bg-[var(--row-selected)]' : ''}`}
                aria-label={`Message from ${m.from}`}
              >
                <div className="w-9 h-9 rounded-full bg-[var(--avatar-bg)] flex items-center justify-center text-[var(--avatar-fg)] font-bold">
                  {m.from.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="truncate">{highlight(m.from, q)}</span>
                      {badge && (
                        <Badge className="h-5 bg-[var(--badge-bg)] text-[var(--badge-fg)] border-[var(--badge-bg)]" variant={badge === 'Draft' ? 'secondary' : 'default'}>{badge}</Badge>
                      )}
                      {mm.chain && (
                        <Badge className="h-5 bg-[var(--badge-secondary-bg)] text-[var(--badge-secondary-fg)] border-[var(--badge-secondary-bg)]" variant="secondary">{mm.chain}</Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{fmtTime(m.createdAt)}</span>
                  </div>
                  <div className="text-foreground flex items-center gap-1">
                    <span className="truncate">{highlight(m.subject || '(no subject)', q)}</span>
                    {mm.hasAttachment && <span title="Attachment">📎</span>}
                  </div>
                  <div className="text-muted-foreground text-xs truncate">{highlight(m.body, q)}</div>
                </div>
                <div />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function MailView({ msg, onReply, onForward, onArchive, isDraft, onEditDraft }: { msg?: Message; onReply: () => void; onForward: () => void; onArchive: () => void; isDraft: boolean; onEditDraft: () => void }) {
  if (!msg) return (
    <div className="p-6 flex items-center justify-center h-full">
      <div className="text-center text-muted-foreground">
        <div className="text-4xl mb-2">📧</div>
        <div className="font-medium">No message selected</div>
        <div className="text-sm">Choose a message from the list to read</div>
      </div>
    </div>
  );
  return (
<div className="p-4 flex flex-col h-full rounded-xl border border-border bg-card/80 backdrop-blur-sm">
      <div className="mb-2">
        <div className="text-xl font-extrabold">{msg.subject || '(no subject)'}</div>
        <div className="text-sm text-muted-foreground">From: {msg.from} · {fmtDateTime(msg.createdAt)}</div>
      </div>

      <div className="flex gap-2 mb-3">
        {isDraft ? (
          <Button variant="outline" onClick={onEditDraft}>Edit draft</Button>
        ) : (
          <>
            <Button variant="outline" onClick={onReply}>Reply</Button>
            <Button variant="outline" onClick={onForward}>Forward</Button>
            <Button variant="outline" onClick={onArchive}>Archive</Button>
          </>
        )}
      </div>

      <div className="whitespace-pre-wrap leading-relaxed flex-1 overflow-auto">
        {msg.body}
        <Separator className="my-4" />
        <div className="text-xs text-muted-foreground">
          Blockchain metadata (placeholder): TXID, proof, chain, confirmations.
        </div>
      </div>
    </div>
  );
}

function Header({ search, onSearch, wallet, siwe, walletAddr, evmBalance, isCheckingWallet, onConnectWallet, onDisconnectWallet, identity, onOpenSettings, onOpenLogin, onLogout }: { search: string; onSearch: (v: string) => void; wallet: { btc: string; eth: string }; siwe: { address: string; chainId: number } | null; walletAddr: string | null; evmBalance: string | null; isCheckingWallet: boolean; onConnectWallet: () => void; onDisconnectWallet: () => void; identity: Identity | null; onOpenSettings: () => void; onOpenLogin: () => void; onLogout: () => void }) {
  // Removed duplicate avatarType state and effect
  const [avatarType, setAvatarType] = useState<'jazzicon'|'blockies'>(() => {
    if (typeof window !== 'undefined') {
      const v = localStorage.getItem('bitmail.avatarType.v1');
      if (v === 'blockies' || v === 'jazzicon') return v;
    }
    return 'jazzicon';
  });

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'bitmail.avatarType.v1') {
        const v = e.newValue;
        if (v === 'blockies' || v === 'jazzicon') setAvatarType(v);
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);
  const short = (a: string) => a ? `${a.slice(0,6)}…${a.slice(-4)}` : ''
  return (
    <header className="flex items-center gap-3 p-3 border-b border-border bg-card/60 backdrop-blur-md">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="inline-flex text-muted-foreground"><Icon name="search" /></span>
          <div className="flex-1">
            <Input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search messages, addresses, or future TXIDs"
              aria-label="Search messages"
            />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button aria-label="Notifications" title="Notifications" variant="outline" size="icon" onClick={() => logEvent('notify.click')}>🔔</Button>
        {siwe || walletAddr ? (
          <div
            aria-live="polite"
            title={evmBalance ? `${evmBalance} ETH` : 'Balance unavailable'}
            className="text-xs text-foreground border border-border rounded-full px-3 py-1 glass-bg"
          >
            <span className="font-medium">Ξ {evmBalance ?? '—'} ETH</span>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => { logEvent('wallet.connect.open'); onConnectWallet() }}
            className={isCheckingWallet ? 'sparkle-border glass-bg' : ''}
            disabled={isCheckingWallet}
          >
            {isCheckingWallet ? 'Checking…' : 'Connect wallet'}
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button aria-label="Profile" title="Profile" variant="outline" size="icon" className="rounded-full">
              {siwe?.address || walletAddr ? (
                avatarType === 'jazzicon' ? (
                  <JazzAvatar address={(siwe?.address || walletAddr) || ''} diameter={28} />
                ) : (
                  <BlockiesAvatar address={(siwe?.address || walletAddr) || ''} diameter={28} />
                )
              ) : identity ? (identity.publicKeyHex.slice(0,2).toUpperCase()) : '👤'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {siwe || walletAddr ? (
              <>
                <DropdownMenuLabel className="text-xs">Connected {short((siwe?.address || walletAddr) || '')}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => { logEvent('settings.open'); onOpenSettings() }}>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { logEvent('wallet.disconnect'); onDisconnectWallet() }}>Disconnect wallet</DropdownMenuItem>
              </>
            ) : identity ? (
              <>
                <DropdownMenuLabel className="text-xs">Signed in</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => { logEvent('settings.open'); onOpenSettings() }}>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { logEvent('auth.logout'); onLogout() }}>Log out</DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuLabel className="text-xs">Not signed in</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => { logEvent('auth.login.open'); onOpenLogin() }}>Log in</DropdownMenuItem>
                <DropdownMenuItem onClick={() => { logEvent('wallet.connect.open'); onConnectWallet() }}>Connect wallet</DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export default function Page() {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const { toast } = useToast();
  const { setTheme } = useTheme();
  const [loginOpen, setLoginOpen] = useState(false);
  const [siwe, setSiwe] = useState<{ address: string; chainId: number } | null>(null);
  const [walletAddr, setWalletAddr] = useState<string | null>(null);
  const [booting, setBooting] = useState(true);
  const [checkingWallet, setCheckingWallet] = useState(true);
  const [evmBalance, setEvmBalance] = useState<string | null>(null);
  const [evmChain, setEvmChain] = useState<number | null>(null);

  const initialMessages: Message[] = useMemo(() => DEMO_MESSAGES, []);
  const [store, setStore] = useState<Store>({
    inbox: initialMessages,
    sent: [],
    drafts: [],
    starred: [],
    archive: [],
  });
  const [selected, setSelected] = useState<Message | undefined>(initialMessages[0]);
  const [composeOpen, setComposeOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [composeDraftId, setComposeDraftId] = useState<string | undefined>(undefined);
  const [selectedFolder, setSelectedFolder] = useState<Folder>('inbox');
  const [search, setSearch] = useState('');
  const [remember, setRemember] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'focused' | 'other'>('focused');
  const [sortBy, setSortBy] = useState<'date' | 'block'>('date');
  const [meta, setMeta] = useState<Record<string, { focused: boolean; hasAttachment?: boolean; status?: 'Verified' | 'On-chain' | 'IPFS'; chain?: 'BTC' | 'ETH' }>>({
    '1': { focused: true, status: 'Verified', chain: 'BTC' },
    '2': { focused: true, hasAttachment: true, status: 'IPFS' },
    '3': { focused: false, status: 'On-chain', chain: 'ETH' },
  });
  const [composeInitial, setComposeInitial] = useState<Partial<ComposeDraft> | undefined>(undefined);
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    let canceled = false
    async function init() {
      setCheckingWallet(true)
      try {
        const sess = await fetchSiweSession()
        if (!canceled) setSiwe(sess)
      } finally {
        if (!canceled) setCheckingWallet(false)
      }
    }
    init()
    return () => { canceled = true }
  }, []);

  // keep SIWE state in sync across tabs and wallet changes
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'bitmail.siwe.v1') {
        try { setSiwe(e.newValue ? JSON.parse(e.newValue) : null) } catch { setSiwe(null) }
      }
    }
    window.addEventListener('storage', onStorage)
    const eth: any = (globalThis as any).ethereum
    const onAccounts = async (accs?: string[]) => {
      try {
        const accounts = accs || (await eth.request({ method: 'eth_accounts' }))
        setWalletAddr(accounts && accounts[0] ? accounts[0] : null)
      } catch {}
      fetchSiweSession().then((s) => setSiwe(s))
    }
    const onChain = () => fetchSiweSession().then((s) => setSiwe(s))
    try {
      eth?.on?.('accountsChanged', onAccounts)
      eth?.on?.('chainChanged', onChain)
      // initial accounts
      setCheckingWallet(true)
      eth?.request?.({ method: 'eth_accounts' })
        .then((accs: string[]) => setWalletAddr(accs && accs[0] ? accs[0] : null))
        .finally(() => setCheckingWallet(false))
    } catch {}
    return () => {
      window.removeEventListener('storage', onStorage)
      try {
        eth?.removeListener?.('accountsChanged', onAccounts)
        eth?.removeListener?.('chainChanged', onChain)
      } catch {}
    }
  }, [])

  // Fetch ETH balance when connected (siwe or wallet address)
  useEffect(() => {
    let canceled = false
    const address = siwe?.address || walletAddr
    const cid = siwe?.chainId
    if (!address) { setEvmBalance(null); return }
    (async () => {
      try {
        const { eth, chainId } = await getEthBalance(address, cid)
        if (!canceled) { setEvmBalance(eth); setEvmChain(chainId) }
      } catch { if (!canceled) { setEvmBalance(null) } }
    })()
    return () => { canceled = true }
  }, [siwe?.address, siwe?.chainId, walletAddr])

  // Boot splash: show once on first load/refresh while initializing
  useEffect(() => {
    let hasCache = false
    try {
      hasCache = !!localStorage.getItem('bitmail.store.v1') || !!localStorage.getItem('bitmail.identity.v1') || !!localStorage.getItem('bitmail.siwe.v1')
    } catch {}
    const minDelay = new Promise((r) => setTimeout(r, hasCache ? 200 : 600))
    Promise.all([minDelay]).then(() => setBooting(false))
  }, [])

  useEffect(() => {
    // Load or create identity and store
    try {
      const raw = localStorage.getItem('bitmail.identity.v1');
      if (raw) {
        const parsed = JSON.parse(raw) as { privateKeyHex: string };
        const pub = publicKeyFromPrivate(parsed.privateKeyHex);
        setIdentity({ privateKeyHex: parsed.privateKeyHex, publicKeyHex: pub });
        setRemember(true);
      } else {
        const id = createIdentity();
        setIdentity(id);
      }
    } catch {}

    try {
      const rawStore = localStorage.getItem('bitmail.store.v1');
      if (rawStore) {
        const parsed = JSON.parse(rawStore) as Store;
        setStore(parsed);
        setSelected(parsed.inbox[0] || parsed.sent[0] || parsed.drafts[0] || parsed.archive[0] || parsed.starred[0]);
      }
    } catch {}
  }, []);

  // Persist store to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('bitmail.store.v1', JSON.stringify(store));
    } catch {}
  }, [store]);

  function persistIdentity(v: boolean) {
    setRemember(v);
    if (!identity) return;
    if (v) {
      localStorage.setItem('bitmail.identity.v1', JSON.stringify({ privateKeyHex: identity.privateKeyHex }));
    } else {
      localStorage.removeItem('bitmail.identity.v1');
    }
  }

  function clearStoredIdentity() {
    localStorage.removeItem('bitmail.identity.v1');
    setRemember(false);
  }

  function regenerateIdentity() {
    const id = createIdentity();
    setIdentity(id);
    if (remember) {
      localStorage.setItem('bitmail.identity.v1', JSON.stringify({ privateKeyHex: id.privateKeyHex }));
    }
  }

  function handleSendFromCompose(draft: ComposeDraft) {
    const id = String(Date.now());
    const msg: Message = {
      id,
      from: 'mimos.eth',
      to: draft.to,
      subject: draft.subject,
      body: draft.body,
      createdAt: Date.now(),
    };
    setStore((prev) => ({
      ...prev,
      sent: [msg, ...prev.sent],
      drafts: prev.drafts.filter((d) => d.id !== composeDraftId),
      inbox: prev.inbox, // keep inbox unchanged for now
    }));
    setMeta((prev) => ({ ...prev, [id]: { focused: true } }));
    setSelected(msg);
    setComposeDraftId(undefined);
    try { toast({ title: 'Message sent', description: 'Your message has been added to Sent.' }); } catch {}
  }

  function ensurePrefix(subject: string | undefined, prefix: string) {
    const s = subject || '';
    return s.toLowerCase().startsWith(prefix.toLowerCase()) ? s : `${prefix} ${s}`.trim();
  }

  function quoteBody(from: string, createdAt: number, body: string) {
    const quoted = body.split('\n').map((l) => `> ${l}`).join('\n');
    return `\n\nOn ${fmtDateTime(createdAt)}, ${from} wrote:\n${quoted}`;
  }

  function forwardedBody(msg: Message) {
    return `\n\n---------- Forwarded message ----------\nFrom: ${msg.from}\nDate: ${fmtDateTime(msg.createdAt)}\nSubject: ${msg.subject || '(no subject)'}\n\n${msg.body}`;
  }

  const allMessages = useMemo(() => [...store.inbox, ...store.sent, ...store.drafts, ...store.archive, ...store.starred], [store]);

  const isDraft = (m?: Message) => (m ? store.drafts.some((d) => d.id === m.id) : false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    // Choose base by folder
    let base: Message[];
    switch (selectedFolder) {
      case 'inbox':
        base = store.inbox;
        break;
      case 'sent':
        base = store.sent;
        break;
      case 'drafts':
        base = store.drafts;
        break;
      case 'archive':
        base = store.archive;
        break;
      case 'starred':
        base = store.starred;
        break;
      default:
        base = store.inbox;
    }

    // Show empty state for empty folders when not searching
    if (!q && base.length === 0) {
      return [];
    }

    // Tabs (Focused/Other) only for Inbox and when not searching
    if (!q && selectedFolder === 'inbox') {
      base = base.filter(m => (selectedTab === 'focused' ? meta[m.id]?.focused !== false : meta[m.id]?.focused === false));
    }

    // Search across all messages regardless of folder
    if (q) {
      base = allMessages.filter(m => (
        (m.subject || '').toLowerCase().includes(q) ||
        m.from.toLowerCase().includes(q) ||
        m.body.toLowerCase().includes(q)
      ));
    }

    // Sorting
    base = base.slice().sort((a, b) => b.createdAt - a.createdAt);

    return base;
  }, [store, allMessages, search, selectedFolder, selectedTab, meta]);

  // Ensure selected is visible in current filtered set
  useEffect(() => {
    if (selected && !filtered.find(m => m.id === selected.id)) {
      setSelected(filtered[0]);
    }
  }, [search, selectedFolder, filtered.length]);

  // Star/unstar duplicates in starred folder
  function isStarred(id: string) {
    return store.starred.some((m) => m.id === id);
  }
  function toggleStar(msg: Message) {
    setStore((prev) => {
      const starred = isStarred(msg.id)
        ? prev.starred.filter((m) => m.id !== msg.id)
        : [msg, ...prev.starred];
      return { ...prev, starred };
    });
  }

  // Archive/unarchive moves between inbox/sent and archive
  function archiveMessage(msg: Message) {
    setStore((prev) => {
      const removeFrom = (arr: Message[]) => arr.filter((m) => m.id !== msg.id);
      return {
        ...prev,
        inbox: removeFrom(prev.inbox),
        sent: removeFrom(prev.sent),
        drafts: prev.drafts, // do not archive drafts
        archive: [msg, ...removeFrom(prev.archive)],
      };
    });
    if (selected?.id === msg.id) setSelected(undefined);
  }
  function unarchiveMessage(msg: Message) {
    setStore((prev) => {
      const removeFrom = (arr: Message[]) => arr.filter((m) => m.id !== msg.id);
      return {
        ...prev,
        archive: removeFrom(prev.archive),
        inbox: [msg, ...prev.inbox],
      };
    });
    if (selected?.id === msg.id) setSelected(undefined);
  }

  if (booting) {
    return (
      <main className="h-screen grid place-items-center bg-gradient-theme">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-border border-t-transparent animate-spin" />
          <div className="text-sm text-muted-foreground">Loading BitMail…</div>
        </div>
      </main>
    )
  }

  return (
    <TooltipProvider>
      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Actions">
            <CommandItem onSelect={() => { setComposeInitial(undefined); setComposeDraftId(String(Date.now())); setComposeOpen(true); setCommandOpen(false); }}>
              New message
              <CommandShortcut>⌘K N</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => { setSettingsOpen(true); setCommandOpen(false); }}>
              Open settings
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Navigate">
            <CommandItem onSelect={() => { setSelectedFolder('inbox'); setCommandOpen(false); }}>Inbox</CommandItem>
            <CommandItem onSelect={() => { setSelectedFolder('starred'); setCommandOpen(false); }}>Starred</CommandItem>
            <CommandItem onSelect={() => { setSelectedFolder('sent'); setCommandOpen(false); }}>Sent</CommandItem>
            <CommandItem onSelect={() => { setSelectedFolder('drafts'); setCommandOpen(false); }}>Drafts</CommandItem>
            <CommandItem onSelect={() => { setSelectedFolder('archive'); setCommandOpen(false); }}>Archive</CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Theme">
            <CommandItem onSelect={() => { setTheme('light'); setCommandOpen(false); }}>Light</CommandItem>
            <CommandItem onSelect={() => { setTheme('dark'); setCommandOpen(false); }}>Dark</CommandItem>
            <CommandItem onSelect={() => { setTheme('system'); setCommandOpen(false); }}>System</CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      <main className="flex h-screen bg-gradient-theme">
      <Sidebar
        pubkey={siwe?.address || walletAddr || identity?.publicKeyHex}
        onCompose={() => {
          setComposeInitial(undefined);
          setComposeDraftId(String(Date.now()));
          setComposeOpen(true);
        }}
        onOpenSettings={() => setSettingsOpen(true)}
        selected={selectedFolder}
        onSelect={setSelectedFolder}
        inboxCount={store.inbox.length}
      />

      <div className="flex-1 flex flex-col">
        <Header
          search={search}
          onSearch={setSearch}
          wallet={{ btc: '0.000', eth: '0.00' }}
          siwe={siwe}
          walletAddr={walletAddr}
          isCheckingWallet={checkingWallet}
          onConnectWallet={() => { setLoginOpen(true) }}
          onDisconnectWallet={async () => {
            await disconnectWallet();
            setSiwe(null)
            setWalletAddr(null)
          }}
          evmBalance={evmBalance}
          identity={identity}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenLogin={() => setLoginOpen(true)}
          onLogout={() => {
            clearStoredIdentity();
            setIdentity(null);
          }}
        />

        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as 'focused' | 'other')}>
            <TabsList>
              <TabsTrigger value="focused">Focused</TabsTrigger>
              <TabsTrigger value="other">Other</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Sort</label>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'date' | 'block')}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Sort" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="block">Block Height (soon)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-1 min-h-0">
          <MailList items={filtered} selectedId={selected?.id} onSelect={setSelected} q={search} meta={meta} drafts={store.drafts} selectedFolder={selectedFolder} />
          {filtered.length === 0 && search && (
            <div className="flex-1 bg-card/30 backdrop-blur-sm p-2 md:p-4 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <div className="text-4xl mb-2">🔍</div>
                <div className="font-medium">No results found</div>
                <div className="text-sm">Try adjusting your search terms</div>
              </div>
            </div>
          )}
          {filtered.length > 0 && (
            <div className="flex-1 bg-card/30 backdrop-blur-sm p-2 md:p-4">
            <MailView
              msg={selected}
              isDraft={isDraft(selected)}
              onEditDraft={() => {
                if (!selected) return;
                setComposeInitial({ to: selected.to, subject: selected.subject || '', body: selected.body });
                setComposeDraftId(selected.id);
                setComposeOpen(true);
              }}
              onReply={() => {
                if (!selected) return;
                setComposeInitial({
                  to: [selected.from],
                  subject: ensurePrefix(selected.subject, 'Re:'),
                  body: quoteBody(selected.from, selected.createdAt, selected.body),
                });
                setComposeOpen(true);
              }}
              onForward={() => {
                if (!selected) return;
                setComposeInitial({
                  to: [],
                  subject: ensurePrefix(selected.subject, 'Fwd:'),
                  body: forwardedBody(selected),
                });
                setComposeOpen(true);
              }}
              onArchive={() => {
                if (!selected) return;
                const inArchive = store.archive.some((m) => m.id === selected.id);
                if (inArchive) unarchiveMessage(selected);
                else archiveMessage(selected);
              }}
            />
            </div>
          )}
        </div>
      </div>

      <ComposePanel
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        onSend={(d) => {
          handleSendFromCompose(d);
        }}
        onAutoSave={(key, data) => {
          if (!key) return;
          setStore((prev) => {
            const existing = prev.drafts.find((d) => d.id === key);
            const draft: Message = existing || {
              id: key,
              from: 'mimos.eth',
              to: [],
              subject: '',
              body: '',
              createdAt: Date.now(),
            };
            const updated: Message = { ...draft, to: data.to, subject: data.subject, body: data.body, createdAt: draft.createdAt || Date.now() };
            const drafts = existing
              ? prev.drafts.map((d) => (d.id === key ? updated : d))
              : [updated, ...prev.drafts];
            return { ...prev, drafts };
          });
        }}
        initial={composeInitial}
        draftKey={composeDraftId}
      />

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        pubkey={siwe?.address || walletAddr || identity?.publicKeyHex}
        walletAddress={siwe?.address || walletAddr || null}
        remember={remember}
        onRememberChange={persistIdentity}
        onRegenerate={regenerateIdentity}
        onClearStorage={clearStoredIdentity}
      />

      <LoginDialog
        open={loginOpen}
        onOpenChange={setLoginOpen}
        siweSession={siwe}
        walletAddress={walletAddr}
        onStartCheck={() => setCheckingWallet(true)}
        onEndCheck={() => setCheckingWallet(false)}
        onLogin={(privateKeyHex, rememberChoice) => {
          try {
            const pub = publicKeyFromPrivate(privateKeyHex);
            const id: Identity = { privateKeyHex, publicKeyHex: pub };
            setIdentity(id);
            setRemember(rememberChoice);
            if (rememberChoice) {
              localStorage.setItem('bitmail.identity.v1', JSON.stringify({ privateKeyHex }));
            } else {
              localStorage.removeItem('bitmail.identity.v1');
            }
            setLoginOpen(false);
          } catch {}
        }}
        onGenerate={(rememberChoice) => {
          const id = createIdentity();
          setIdentity(id);
          setRemember(rememberChoice);
          if (rememberChoice) {
            localStorage.setItem('bitmail.identity.v1', JSON.stringify({ privateKeyHex: id.privateKeyHex }));
          } else {
            localStorage.removeItem('bitmail.identity.v1');
          }
          setLoginOpen(false);
        }}
        onSiweComplete={(sess) => {
          setSiwe(sess);
          setWalletAddr(sess.address);
          setLoginOpen(false);
          setCheckingWallet(false);
        }}
      />
      </main>
    </TooltipProvider>
  );
}
