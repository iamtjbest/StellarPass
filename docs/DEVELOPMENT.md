# Development Setup Guide

This guide will help you set up the StellarPass MVP on your local machine for development and testing.

## Prerequisites

Ensure you have the following installed:
- **Node.js**: >= 18.0.0
- **Rust / Cargo**: >= 1.88.0
- **Stellar CLI**: For deploying and interacting with Soroban contracts.
- **Freighter Wallet**: A browser extension wallet for the Stellar network.

## 1. Local Repository Setup

Clone the repository and install frontend dependencies:

```bash
git clone https://github.com/stellarpass-org/stellarpass.git
cd stellarpass/apps/frontend
npm install
```

## 2. Environment Configuration

### Frontend
In `apps/frontend/`, copy the example environment file:
```bash
cp .env.example .env
```
Ensure `NEXT_PUBLIC_STELLAR_CONTRACT_ID` is set to the deployed Soroban contract ID. (If you deploy your own contract in Step 5, update this value).

## 3. Starting the Backend

The backend is a lightweight Rust/Axum service that stores metadata in memory.

```bash
cd apps/backend
cargo run
```
The backend will start on `http://localhost:3001`.

## 4. Starting the Frontend

With the backend running, start the Next.js frontend:

```bash
cd apps/frontend
npm run dev
```
The frontend will start on `http://localhost:3000`.

## 5. Soroban Smart Contract Development

If you want to modify or deploy your own version of the smart contract to the Stellar Testnet:

### Build the Contract
```bash
cd contracts/ticketing
cargo build --target wasm32-unknown-unknown --release
```

### Run Contract Tests
```bash
cargo test
```

### Deploy to Stellar Testnet
First, generate a keypair and fund it on the Testnet:
```bash
stellar keys generate organizer
stellar keys fund organizer --network testnet
```

Then, deploy the compiled Wasm:
```bash
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/stellarpass_ticketing.wasm \
  --source organizer \
  --network testnet
```

Copy the output Contract ID and update `NEXT_PUBLIC_STELLAR_CONTRACT_ID` in your frontend `.env` file. Restart the frontend server.

## 6. Wallet Setup (Freighter)

1. Install the [Freighter browser extension](https://www.freighter.app/).
2. Create a wallet and save your seed phrase.
3. In the Freighter settings (Gear icon $\rightarrow$ Preferences), switch the network to **Testnet**.
4. You will need Testnet XLM to pay for transaction fees. You can fund your Freighter wallet using the [Stellar Laboratory Friendbot](https://laboratory.stellar.org/#account-creator?network=test).

## Common Issues

- **Transaction Simulation Failed**: This usually happens if you try to check-in a ticket using a different wallet than the one that created the event. Ensure you are using the correct `organizer` wallet.
- **Backend Connection Refused**: Ensure the Axum backend is running on port 3001. The frontend relies on it for fetching event metadata.
