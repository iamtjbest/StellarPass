# Security Policy

## Supported Versions
Only the latest version of StellarPass is supported with security updates. 

## Reporting a Vulnerability
If you discover a security vulnerability within StellarPass, please send an e-mail to security@stellarpass.dev. All security vulnerabilities will be promptly addressed.

## Architecture Trust Model
StellarPass is designed with a specific trust model separating on-chain authority from off-chain indexing.

### On-Chain (Authoritative)
The Soroban Smart Contract (`contracts/ticketing`) is the strict source of truth for:
- Event creation and Organizer identity (validated via `require_auth()`)
- Ticket issuance and initial ownership
- Ticket validity and status
- Check-in state preventing double-entry

### Off-Chain (Metadata)
The backend service (Rust/Axum) stores non-authoritative metadata:
- Event Titles, Dates, Venues, Descriptions
- Caching and Indexing 

*Warning: The backend is NOT trusted with user private keys, nor does it have the ability to override Soroban check-in state. Clients must always read authoritative ticket ownership directly from the Stellar RPC node.*

### Limitations of the MVP
As this is an Approval-Stage MVP, the following security limitations exist and are left as open issues for future contributors:
- The backend does not currently authenticate organizers when saving metadata, meaning any user can submit off-chain metadata (though they cannot spoof the on-chain event).
- Soroban contracts have not undergone a formal third-party security audit. Do not use this codebase for high-value mainnet tickets without an audit.
- QR codes currently contain a plaintext JSON payload for MVP verification simplicity. Future iterations should sign the payload.
