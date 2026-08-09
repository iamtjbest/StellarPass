# StellarPass

StellarPass is an open-source, blockchain-based digital ticketing MVP prototype powered by the Stellar network and Soroban smart contracts. It guarantees cryptographic ownership of tickets, prevents fraud, double-entry, and ensures unauthorized ticket issuance is mathematically impossible.

**Note:** This is currently an MVP prototype running on the **Stellar Soroban Testnet**. It is designed for demonstration and open-source contribution, not yet for production use.

## Problem Being Solved

Traditional digital ticketing systems suffer from major flaws:
- **Scalping & Counterfeiting**: Tickets can be easily duplicated as screenshots or PDFs.
- **Double Entry**: Malicious actors can sell the same ticket barcode to multiple people.
- **Lack of Ownership**: Attendees don't truly own their tickets; they just rent access from centralized platforms.

## Why Blockchain & Soroban?

By utilizing the Stellar blockchain, StellarPass treats tickets as unique, non-fungible digital assets. The Soroban smart contract is the **authoritative source of truth**. 
- It prevents duplicate ticket IDs.
- It guarantees that only the cryptographically verified event organizer can issue tickets or check attendees in.
- It allows verification to happen transparently on a public ledger.

## Current MVP Capabilities

- **Event Management**: Create events and store bulky metadata off-chain, while securing the core event identity on-chain.
- **Ticket Issuance**: Automatically issue tickets directly to a recipient's wallet address.
- **Ticket Verification**: Generate QR codes from tickets and verify them via a dedicated scanner interface.
- **On-Chain Check-In**: Authorized organizers can perform cryptographically secure on-chain check-ins, changing the ticket state to prevent double-entry.

## Architecture

StellarPass separates concerns into two domains:
- **On-Chain (Authoritative)**: A Soroban smart contract (Rust) manages Event creation, Ticket issuance, Ownership, and Check-in state.
- **Off-Chain (Metadata)**: A Rust (Axum) backend service indexes heavy metadata like event titles, dates, and descriptions.
- **Frontend**: A Next.js (React) application serves as the UI, communicating with the backend and integrating with the Freighter wallet for Soroban transactions.

See the [Architecture Document](docs/ARCHITECTURE.md) for more details.

## Local Setup & Development

See the [Development Setup Guide](docs/DEVELOPMENT.md) for instructions on setting up Node.js, Rust, the backend, the frontend, and deploying the Soroban contract.

### Environment Variables
The frontend relies on a `.env` file (copied from `.env.example`) to specify the `NEXT_PUBLIC_STELLAR_CONTRACT_ID`.

### Freighter Wallet Requirement
To use StellarPass, you must install the [Freighter browser extension](https://www.freighter.app/) and configure it for the Stellar Testnet. You will also need Testnet XLM to pay for transaction fees.

## How the Ticket Lifecycle Works

The ticketing flow is a hybrid process:
1. **Event Creation**: Metadata is saved off-chain. An ID is registered on-chain.
2. **Issuance**: A ticket is issued on-chain to a user's wallet.
3. **Verification**: A QR code is scanned, and the frontend queries the Soroban contract for validity.
4. **Check-In**: The organizer signs an on-chain transaction to permanently consume the ticket.

See the [Ticketing Flow Document](docs/TICKETING_FLOW.md) for a deep dive.

## Roadmap & Contributions

We are currently preparing for a major open-source contribution phase! We need help with UI improvements, persistent backend storage (PostgreSQL), and advanced smart contract features like ticket transfers and batch issuance.

- See [ROADMAP.md](docs/ROADMAP.md) for a list of planned features.
- See [CONTRIBUTING.md](CONTRIBUTING.md) for instructions on how to submit code.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
