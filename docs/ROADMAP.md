# StellarPass Roadmap

StellarPass is currently an MVP running on the Stellar Soroban Testnet. As an open-source project, we rely on community contributions to mature the system.

This roadmap outlines our planned future improvements. **Note that these features are currently planned, not yet implemented.**

## Phase 1: Core Reliability & Security (Current Focus)

- [x] Initial Soroban smart contract implementation
- [x] Rust Axum backend (in-memory MVP)
- [x] Next.js frontend with Freighter wallet integration
- [ ] Comprehensive End-to-End Testing
- [ ] Contract Security Audit

## Phase 2: Production Readiness (Upcoming)

- **PostgreSQL Migration**: Transition the Rust Axum backend from an in-memory `RwLock<HashMap>` to persistent storage using PostgreSQL (via SQLx or Diesel).
- **Background Indexer**: Add a backend worker that indexes relevant Stellar/Soroban events and synchronizes on-chain event information with the backend metadata layer.
- **Improved Error Handling**: More granular transaction error parsing in the frontend.

## Phase 3: Advanced Ticketing Features (Future)

- **Ticket Transfers**: Allow users to transfer ticket ownership on-chain securely.
- **Batch Issuance**: Allow organizers to issue multiple tickets in a single Soroban transaction to save fees.
- **Role-Based Access Control (RBAC)**: Expand the Soroban contract to allow organizers to delegate check-in authority ("Scanner" role) to other wallets.
- **Dynamic Metadata**: Support IPFS-hosted metadata for individual tickets.

## How to Contribute

If you are interested in picking up any of these roadmap items, please check our [Issue Tracker](https://github.com/iamtjbest/StellarPass/issues) or read our [CONTRIBUTING.md](../CONTRIBUTING.md) guide to get started.
