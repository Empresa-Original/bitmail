
# BitMail

BitMail is a Bitcoin-native messaging client inspired by Outlook, with strong privacy and modern UX.

## Current Features
- Monorepo: Electron + Next.js desktop app, core logic, UI, adapters.
- Ethereum wallet login (SIWE), EIP-55 checksummed addresses, robust error handling.
- User profile: Select Jazzicon or Blockies avatar, instantly reflected in header and settings.
- Settings panel: Edit identity, ENS, chain ID, address, avatar type, and Save button for explicit persistence.
- Mailbox UI: Inbox, sent, drafts, archive, search, compose, thread view.
- Nostr adapter scaffolded for future messaging transport.
- Security-first: E2EE planned, local storage, privacy-first design.
- .gitignore excludes all node_modules and build artifacts.

## Roadmap
- Implement Nostr messaging transport and E2EE.
- Add Lightning adapter for paid messaging/anti-spam.
- Polish mailbox UI and add notifications.
- Extend settings/profile for more identity options.
- Improve docs for onboarding and architecture.

## Repository layout
- apps/
  - desktop/ (Electron + Next.js)
- packages/
  - core/ (crypto, identity, transport abstractions)
  - adapters/ (nostr, lightning, smtp-bridge)
  - ui/ (shared UI primitives)
- docs/

See docs/ for architecture, product brief, and open questions.

