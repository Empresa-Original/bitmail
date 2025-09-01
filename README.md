# BitMail

A Bitcoin-native messaging client inspired by Outlook. Send and receive "emails" addressed by Bitcoin identities, with a familiar mailbox UI (inbox, folders, search, rules) and strong end-to-end encryption.

This repo currently contains design docs to converge on key decisions before scaffolding code.

## Vision
- Outlook-like UX: multi-account, inbox, sent, drafts, search, filters, rules, signatures.
- Bitcoin-native addressing: use BTC-linked identities for addressing and routing.
- Private by default: end-to-end encrypted content and metadata minimization.
- Cross-platform: desktop-first (Electron) with a web companion (optional) and mobile later.

## What “BTC address email” could mean
Several transport options can back a BTC-linked identity. We’ll select one for the MVP:
- Nostr (recommended): map a BTC address to a Nostr pubkey; messages ride Nostr relays; strong E2EE via NIP-04/17; good for near-real-time and offline sync.
- Lightning (L2): use keysend or BOLT12 offers to carry encrypted payloads; pay-to-send and anti-spam baked-in; requires node or LSP.
- SMTP bridge: interop with traditional email by routing between BitMail and SMTP using a gateway service. Optional and clearly labeled.
- On-chain L1: not suitable for message transport (cost/latency/privacy); can be used only for registry/attestations.

## Repository layout (planned)
- apps/
  - desktop/ (Electron + Next.js)
  - web/ (Next.js)
- packages/
  - core/ (crypto, identity, transport abstractions)
  - adapters/ (nostr, lightning, smtp-bridge)
  - ui/ (shared UI primitives)
- docs/

## Next steps
1) Align on transport and addressing for the MVP.
2) Scaffold the app (Electron + Next.js + TypeScript + Nx/turborepo).
3) Implement identity & key management.
4) Implement chosen transport adapter and E2EE.
5) Build mailbox UI.

See docs/ for details and open questions.

