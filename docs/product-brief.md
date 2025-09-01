# Product brief

BitMail is an Outlook-style client where addresses are Bitcoin-linked. Users send and receive messages using BTC-linked identities with end-to-end encryption and a familiar mailbox UI.

## Users
- Crypto-native users who want private, censorship-resistant messaging with a familiar email UX.
- Builders who need programmable transport (webhooks/bots) via Lightning or Nostr.

## MVP goals
- Identity: local wallet or generated keypair used to derive messaging identity.
- Addressing: human-friendly handle resolved to pubkey (nostr) or node id (ln), with optional BTC address proof-of-ownership.
- Transport: pick 1 for MVP (recommended: Nostr) with store-and-forward and offline sync.
- E2EE: per-message encrypted content, signed by sender; forward secrecy (XChaCha20-Poly1305 + X25519/Double Ratchet later).
- Mailbox UX: inbox, sent, compose, threads, attachments (small), search, unread, archive.
- Anti-spam: allowlist by default, optional fee-to-send (LN), or proof-of-work stamps (Hashcash-like).

## Non-goals for MVP
- Full SMTP interop; large attachments; org admin features; calendaring.

## Success metrics
- Time to first message under 2 minutes.
- Sync across two devices reliably.
- <200ms median send-to-receive latency on at least one shared relay.

