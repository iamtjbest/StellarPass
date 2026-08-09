# Soroban Ticketing Contract

The StellarPass Soroban Smart Contract is the authoritative source of truth for the ticketing lifecycle. It guarantees cryptographic ownership of tickets, prevents double-issuance, and ensures that only authorized personnel can perform critical state-changing actions like check-ins.

## Data Structures

The contract persists state using custom structures stored in Soroban's durable storage.

### `Event`
- `id: u64` - The unique identifier generated when the event is registered.
- `organizer: Address` - The public key of the event creator. They have absolute administrative rights over this event.
- `metadata_ref: String` - A reference (typically a UUID) to the off-chain metadata (e.g., event name, date, venue) stored in the backend registry.
- `created_at: u64` - The timestamp of event creation.
- `active: bool` - Indicates whether the event is currently active.

### `Ticket`
- `id: u64` - The unique identifier for the ticket.
- `event_id: u64` - The event this ticket belongs to.
- `owner: Address` - The recipient/owner of the ticket.
- `issued_at: u64` - The timestamp when the ticket was issued.
- `checked_in: bool` - The current check-in state (false by default).

## Functions

### `create_event`
Registers a new event on the blockchain.
- **Parameters:**
  - `organizer: Address` - The organizer's address. (Requires authentication: `organizer.require_auth()`).
  - `event_id: u64` - The unique identifier for the event.
  - `metadata_ref: String` - Reference to off-chain metadata (e.g. backend UUID).
- **Returns:** `Result<(), Error>`
- **Errors:** `EventAlreadyExists` (1) if an event with this ID is already registered.

### `issue_ticket`
Issues a new ticket for an active event.
- **Parameters:**
  - `organizer: Address` - The organizer's address. (Requires authentication).
  - `event_id: u64` - The event ID to issue the ticket for.
  - `ticket_id: u64` - The unique identifier for the ticket.
  - `recipient: Address` - The recipient's public address.
- **Returns:** `Result<(), Error>`
- **Errors:** 
  - `EventNotFound` (2) if the event does not exist.
  - `Unauthorized` (3) if the caller is not the registered organizer of the event.
  - `EventNotActive` (7) if the event has been deactivated.
  - `TicketAlreadyExists` (4) if a ticket with this ID already exists.

### `verify_ticket` / `get_ticket`
Retrieves a ticket's information. Used by the verification flow to check validity and state.
- **Parameters:**
  - `ticket_id: u64` - The ID of the ticket to retrieve.
- **Returns:** `Result<Ticket, Error>`
- **Errors:** `TicketNotFound` (5) if the ticket does not exist.

### `get_ticket_owner`
Returns the address of the ticket owner.
- **Parameters:**
  - `ticket_id: u64`
- **Returns:** `Result<Address, Error>`
- **Errors:** `TicketNotFound` (5)

### `check_in`
Marks a ticket as "checked in", consuming its utility for event entry.
- **Parameters:**
  - `operator: Address` - The address performing the check-in. (Requires authentication).
  - `ticket_id: u64` - The ticket to check in.
- **Returns:** `Result<(), Error>`
- **Errors:**
  - `TicketNotFound` (5) if the ticket does not exist.
  - `EventNotFound` (2) if the associated event cannot be found.
  - `Unauthorized` (3) if the `operator` is not the `organizer` of the event.
  - `TicketAlreadyCheckedIn` (6) if the ticket has already been used.

### `deactivate_event`
Marks an event as inactive, preventing further ticket issuance.
- **Parameters:**
  - `organizer: Address` - (Requires authentication).
  - `event_id: u64` - The event to deactivate.
- **Returns:** `Result<(), Error>`
- **Errors:** `EventNotFound` (2), `Unauthorized` (3).

## Contract Errors Registry

| Code | Error | Description |
|---|---|---|
| 1 | `EventAlreadyExists` | Cannot overwrite an existing event ID. |
| 2 | `EventNotFound` | The specified event ID does not exist. |
| 3 | `Unauthorized` | The caller is not the organizer. |
| 4 | `TicketAlreadyExists` | Cannot overwrite an existing ticket ID. |
| 5 | `TicketNotFound` | The specified ticket ID does not exist. |
| 6 | `TicketAlreadyCheckedIn` | The ticket has already been marked as used. |
| 7 | `EventNotActive` | Operations cannot be performed on a deactivated event. |

## Current MVP Limitations
- **No Transfers:** Tickets are permanently locked to their initial recipient in this version.
- **No Secondary Scanners (RBAC):** Check-in (`check_in`) requires the explicit signature of the primary organizer. Delegation of scanner roles is planned for a future update.
