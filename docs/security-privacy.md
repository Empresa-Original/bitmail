# Security and privacy

Objective: private-by-default messaging with minimal metadata leakage.

## Threat model (MVP)
- Adversaries: passive network observer; malicious relay; opportunistic spammer; device thief.
- Out of scope: nation-state targeted exploitation; supply-chain compromise.

## Controls
- E2EE for content; signatures for authenticity.
- Minimal metadata: random-looking subjects; avoid plaintext headers; thread context in ciphertext.
- Local at-rest encryption: DB and cache encrypted with key from OS keystore + user passphrase; auto-lock on idle.
- Relay hygiene: multi-relay; rotate connections; pinning for trusted relays.
- Key backup: optional encrypted seed backup via user-chosen provider; NEVER server-side plaintext.
- Spam defenses: allowlist, optional PoW or sats-to-send.

## Compliance
- No KYC; no custody. If Lightning integration uses third-party LSP, clearly disclose.
- Export controls: crypto libraries may have restrictions; distribute accordingly.

