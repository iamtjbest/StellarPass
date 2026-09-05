# StellarPass Testnet Demonstration

This document serves as a verifiable record of a complete, successful end-to-end ticketing lifecycle performed on the **Stellar Soroban Testnet**.

**Deployed Contract ID:** `CDA7WVAH5PSQC3G7O5KMLB63LOYTZAJZ3N5ZQPIMZ6YFY5RRRVL36UUC`

The transactions below demonstrate the core capabilities of the MVP, explicitly enforcing the authoritative on-chain state for events and tickets.

---

### 1. Event Creation

An organizer wallet successfully registered a new event identity on-chain.

- **Event ID:** `1788502794071`
- **Transaction Hash:** `cb8942215a6df4d6c8516376f5aed9d7a56b024b82354785db7640019ae775bd`

### 2. Ticket Issuance

The organizer issued a unique ticket for the event to a recipient wallet.

- **Ticket ID:** `1788502866110`
- **Transaction Hash:** `d87dc40fce208e288e409272025f36caefccfdb8bcfded65b8049e11deb5493`

### 3. Ticket Verification

The recipient presented their ticket QR code. The frontend successfully queried the Soroban contract via `verify_ticket`.

- **Result:** Valid ticket (Status: Unused)
- **Note:** This step reads the authoritative ticket state directly from Soroban; no transaction signature was required.

### 4. Check-in

The authorized event organizer successfully performed an on-chain check-in for the attendee's ticket.

- **Check-in Transaction Hash:** `b2707440ecf022a8497ef9f6e3293e283ae4c9ab00b4e46597159ee2b2a3b2c1`

### 5. Repeat Check-in (Duplicate Protection)

Subsequent verification of the same ticket correctly retrieved the updated on-chain state, displaying it as **"ALREADY CHECKED IN"**. The contract successfully prevents duplicate check-ins.

### 6. Event Deactivation

Following the conclusion of the event, the organizer successfully deactivated it.

- **Event ID:** `1788502794071`
- **Deactivation Transaction Hash:** `c7b670aac40af64c8496fac784ac785d5ce093385468c420f6c869026de3ca68`

### 7. Post-Deactivation Ticket Issuance (Inactive-Event Enforcement)

A newly created Freighter account attempted to issue a ticket for the deactivated event.

- **Outcome:** The Soroban simulation correctly rejected the operation with `Error(Contract, #7)`, which corresponds to `EventNotActive`.
- **UI Behavior:** The frontend caught the contract error and successfully surfaced: _"Event is inactive. No new tickets can be issued for this event."_

_(Note: These are genuine Testnet transactions representing the exact flow supported by the codebase.)_
