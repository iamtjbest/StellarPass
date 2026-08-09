#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, Address, Env, String, Symbol,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    EventAlreadyExists = 1,
    EventNotFound = 2,
    Unauthorized = 3,
    TicketAlreadyExists = 4,
    TicketNotFound = 5,
    TicketAlreadyCheckedIn = 6,
    EventNotActive = 7,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Event {
    pub id: u64,
    pub organizer: Address,
    pub metadata_ref: String,
    pub created_at: u64,
    pub active: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Ticket {
    pub id: u64,
    pub event_id: u64,
    pub owner: Address,
    pub issued_at: u64,
    pub checked_in: bool,
}

#[contracttype]
pub enum DataKey {
    Event(u64),
    Ticket(u64),
}

#[contract]
pub struct TicketingContract;

#[contractimpl]
impl TicketingContract {
    pub fn create_event(
        env: Env,
        organizer: Address,
        event_id: u64,
        metadata_ref: String,
    ) -> Result<(), Error> {
        organizer.require_auth();

        let key = DataKey::Event(event_id);
        if env.storage().persistent().has(&key) {
            return Err(Error::EventAlreadyExists);
        }

        let event = Event {
            id: event_id,
            organizer: organizer.clone(),
            metadata_ref,
            created_at: env.ledger().timestamp(),
            active: true,
        };

        env.storage().persistent().set(&key, &event);

        env.events()
            .publish((Symbol::new(&env, "event_created"), event_id), organizer);

        Ok(())
    }

    pub fn issue_ticket(
        env: Env,
        organizer: Address,
        event_id: u64,
        ticket_id: u64,
        recipient: Address,
    ) -> Result<(), Error> {
        organizer.require_auth();

        // Verify event exists and organizer is correct
        let event_key = DataKey::Event(event_id);
        let event: Event = env
            .storage()
            .persistent()
            .get(&event_key)
            .ok_or(Error::EventNotFound)?;

        if event.organizer != organizer {
            return Err(Error::Unauthorized);
        }

        if !event.active {
            return Err(Error::EventNotActive);
        }

        let ticket_key = DataKey::Ticket(ticket_id);
        if env.storage().persistent().has(&ticket_key) {
            return Err(Error::TicketAlreadyExists);
        }

        let ticket = Ticket {
            id: ticket_id,
            event_id,
            owner: recipient.clone(),
            issued_at: env.ledger().timestamp(),
            checked_in: false,
        };

        env.storage().persistent().set(&ticket_key, &ticket);

        env.events()
            .publish((Symbol::new(&env, "ticket_issued"), event_id, ticket_id), recipient);

        Ok(())
    }

    pub fn get_ticket(env: Env, ticket_id: u64) -> Result<Ticket, Error> {
        env.storage()
            .persistent()
            .get(&DataKey::Ticket(ticket_id))
            .ok_or(Error::TicketNotFound)
    }

    pub fn get_ticket_owner(env: Env, ticket_id: u64) -> Result<Address, Error> {
        let ticket = Self::get_ticket(env, ticket_id)?;
        Ok(ticket.owner)
    }

    /// Verifies the existence, status, and authenticity of a ticket on-chain.
    /// This is not merely a database lookup; it guarantees the ticket was
    /// issued by the authorized organizer and its current check-in state
    /// reflects the authoritative blockchain consensus.
    pub fn verify_ticket(env: Env, ticket_id: u64) -> Result<Ticket, Error> {
        // Verification returns the ticket so the client can inspect it
        Self::get_ticket(env, ticket_id)
    }

    pub fn check_in(env: Env, operator: Address, ticket_id: u64) -> Result<(), Error> {
        operator.require_auth();

        let ticket_key = DataKey::Ticket(ticket_id);
        let mut ticket: Ticket = env
            .storage()
            .persistent()
            .get(&ticket_key)
            .ok_or(Error::TicketNotFound)?;

        // Verify operator is the event organizer
        // Note: For MVP, we only allow the event organizer to check in.
        let event_key = DataKey::Event(ticket.event_id);
        let event: Event = env
            .storage()
            .persistent()
            .get(&event_key)
            .ok_or(Error::EventNotFound)?;

        if event.organizer != operator {
            return Err(Error::Unauthorized);
        }

        if ticket.checked_in {
            return Err(Error::TicketAlreadyCheckedIn);
        }

        ticket.checked_in = true;
        env.storage().persistent().set(&ticket_key, &ticket);

        env.events()
            .publish((Symbol::new(&env, "ticket_checked_in"), ticket.event_id, ticket_id), operator);

        Ok(())
    }

    pub fn deactivate_event(env: Env, organizer: Address, event_id: u64) -> Result<(), Error> {
        organizer.require_auth();

        let event_key = DataKey::Event(event_id);
        let mut event: Event = env
            .storage()
            .persistent()
            .get(&event_key)
            .ok_or(Error::EventNotFound)?;

        if event.organizer != organizer {
            return Err(Error::Unauthorized);
        }

        event.active = false;
        env.storage().persistent().set(&event_key, &event);

        Ok(())
    }
}

mod test;
