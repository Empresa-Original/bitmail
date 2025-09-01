# Open questions

Answering these will let us scaffold the stack and start building.

1) Platform: desktop-first with Electron, web companion, or mobile? If desktop, do we also want a browser-based PWA?
2) Transport: pick one for MVP — Nostr or Lightning? (I recommend Nostr for v0.1.)
3) Addressing scheme: how should a "BTC email" look? Options:
   - alice@bitmail.to that resolves to a nostr pubkey
   - bc1q... (BTC address) with a registry mapping to a nostr pubkey
   - npub1... (nostr pubkey) as the raw address for advanced users
4) Wallet integration: built-in simple wallet (seed in OS keystore) vs external wallet connect (e.g., Nostrum, Alby, Zeus)?
5) Anti-spam: allowlist-only at first, PoW stamps, or sats-to-send?
6) Storage: local encrypted SQLite vs cloud sync (user-controlled) or completely ipfs?
7) Licensing and branding: OK with MIT? Any trademark constraints for “BitMail”?
8) SMTP bridge: in or out for MVP?
9) Attachments: cap size to, say, 10 MB? Where to store? (NIP-96, or external store.)
10) Analytics/telemetry: none by default; optional local-only metrics debug screen?

