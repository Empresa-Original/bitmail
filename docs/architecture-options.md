# Architecture options

BitMail = familiar mailbox UI + Bitcoin-linked identity + private transport.

## Identity and addressing
Options:
1) Nostr-native: each account is a Nostr keypair (secp256k1). Map BTC address by proving ownership: sign a challenge with the BTC key and publish a mapping event (attestation) to relays.
2) Lightning-native: identity = node pubkey or BOLT12 offer. Map to a display handle. Wallet/LSP integration for custody.
3) Hybrid: Nostr for messaging, Lightning for anti-spam (optional sats-to-send), BTC address for discovery.

Recommended: Hybrid — Nostr for transport; BTC address mapping for discovery; optional Lightning for fee-to-send.

## Transport
- Nostr: relays provide store-and-forward; clients subscribe to kinds for DMs; E2EE via NIP-04/17; push notifications via relay/websocket.
- Lightning: keysend to carry encrypted payloads; or BOLT12 offers; requires node connectivity; good for paid messaging.
- SMTP bridge (optional): a service that maps nostr pubkeys to SMTP addresses like name@bitmail.to; bridge handles encryption and relay.

## Encryption
- MVP: X25519 (Curve25519) key agreement + XChaCha20-Poly1305 AEAD for message body; per-message nonce; sender authentication via signature.
- Future: Double Ratchet (e.g., libolm/Noise-based) for forward secrecy and session-based chats.
- Attachments: small files encrypted, chunked; uploaded to relay-friendly store (Nostr NIP-96 or external storage) with pointers in message.

## Client architecture
- Desktop app: Electron shell + Next.js/React UI; shared core package for crypto/transport.
- Local storage: IndexedDB/SQLite (via better-sqlite3) per account; encrypted at rest with a key derived from OS keystore + passphrase.
- Background sync: relay subscriptions managed in a worker; queue for outgoing; retry/backoff.

## Anti-spam
- Allowlist-only by default; show requests for new senders.
- Optional proof-of-work stamp (client computes small PoW) or sats-to-send via Lightning.

## Dev ergonomics
- Monorepo with turbo or Nx. TypeScript. ESLint + Prettier + Vitest/Playwright.
- Secure key handling: never write plaintext keys to disk; use OS keystore APIs.

