#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

fn setup_test() -> (
    Env,
    TicketingContractClient<'static>,
    Address,
    Address,
    Address,
) {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, TicketingContract);
    let client = TicketingContractClient::new(&env, &contract_id);

    let organizer = Address::generate(&env);
    let malicious_user = Address::generate(&env);
    let ticket_buyer = Address::generate(&env);

    (env, client, organizer, malicious_user, ticket_buyer)
}

#[test]
fn test_create_event_and_duplicate() {
    let (env, client, organizer, _, _) = setup_test();
    let metadata_ref = String::from_str(&env, "ipfs://event123");
    let event_id = 1;

    // Create event
    client.create_event(&organizer, &event_id, &metadata_ref);

    // Verify duplicate event fails
    let res = client.try_create_event(&organizer, &event_id, &metadata_ref);
    assert_eq!(res.unwrap_err().unwrap(), Error::EventAlreadyExists);
}

#[test]
fn test_issue_ticket_and_unauthorized() {
    let (env, client, organizer, malicious_user, ticket_buyer) = setup_test();
    let metadata_ref = String::from_str(&env, "ipfs://event123");
    let event_id = 1;
    let ticket_id = 100;

    client.create_event(&organizer, &event_id, &metadata_ref);

    // Success issuance
    client.issue_ticket(&organizer, &event_id, &ticket_id, &ticket_buyer);

    let ticket = client.get_ticket(&ticket_id);
    assert_eq!(ticket.owner, ticket_buyer);
    assert_eq!(ticket.event_id, event_id);
    assert_eq!(ticket.checked_in, false);

    // Unauthorized issuance (malicious user trying to issue ticket for organizer's event)
    let ticket_id_2 = 101;
    let res = client.try_issue_ticket(&malicious_user, &event_id, &ticket_id_2, &ticket_buyer);
    assert_eq!(res.unwrap_err().unwrap(), Error::Unauthorized);
}

#[test]
fn test_duplicate_ticket_issuance() {
    let (env, client, organizer, _, ticket_buyer) = setup_test();
    let metadata_ref = String::from_str(&env, "ipfs://event123");
    let event_id = 1;
    let ticket_id = 100;

    client.create_event(&organizer, &event_id, &metadata_ref);
    client.issue_ticket(&organizer, &event_id, &ticket_id, &ticket_buyer);

    // Attempt to issue the same ticket ID again
    let res = client.try_issue_ticket(&organizer, &event_id, &ticket_id, &ticket_buyer);
    assert_eq!(res.unwrap_err().unwrap(), Error::TicketAlreadyExists);
}

#[test]
fn test_nonexistent_event_issuance() {
    let (env, client, organizer, _, ticket_buyer) = setup_test();
    let event_id = 999; // Nonexistent
    let ticket_id = 100;

    let res = client.try_issue_ticket(&organizer, &event_id, &ticket_id, &ticket_buyer);
    assert_eq!(res.unwrap_err().unwrap(), Error::EventNotFound);
}

#[test]
fn test_check_in_scenarios() {
    let (env, client, organizer, malicious_user, ticket_buyer) = setup_test();
    let metadata_ref = String::from_str(&env, "ipfs://event123");
    let event_id = 1;
    let ticket_id = 100;

    client.create_event(&organizer, &event_id, &metadata_ref);
    client.issue_ticket(&organizer, &event_id, &ticket_id, &ticket_buyer);

    // Verify ticket before check-in
    let verify_res = client.verify_ticket(&ticket_id);
    assert_eq!(verify_res.checked_in, false);

    // Unauthorized check-in (malicious user trying to check-in)
    let res = client.try_check_in(&malicious_user, &ticket_id);
    assert_eq!(res.unwrap_err().unwrap(), Error::Unauthorized);

    // Valid organizer check-in
    client.check_in(&organizer, &ticket_id);
    let ticket = client.get_ticket(&ticket_id);
    assert_eq!(ticket.checked_in, true);

    // Double check-in
    let res_double = client.try_check_in(&organizer, &ticket_id);
    assert_eq!(
        res_double.unwrap_err().unwrap(),
        Error::TicketAlreadyCheckedIn
    );
}

#[test]
fn test_nonexistent_ticket() {
    let (env, client, organizer, _, _) = setup_test();
    let ticket_id = 999; // Nonexistent

    // Try to get ticket
    let res_get = client.try_get_ticket(&ticket_id);
    assert_eq!(res_get.unwrap_err().unwrap(), Error::TicketNotFound);

    // Try to check in nonexistent ticket
    let res_check = client.try_check_in(&organizer, &ticket_id);
    assert_eq!(res_check.unwrap_err().unwrap(), Error::TicketNotFound);
}

#[test]
fn test_inactive_event() {
    let (env, client, organizer, _, ticket_buyer) = setup_test();
    let metadata_ref = String::from_str(&env, "ipfs://event123");
    let event_id = 1;
    let ticket_id = 100;

    client.create_event(&organizer, &event_id, &metadata_ref);
    client.deactivate_event(&organizer, &event_id);

    // Attempt to issue ticket for inactive event
    let res = client.try_issue_ticket(&organizer, &event_id, &ticket_id, &ticket_buyer);
    assert_eq!(res.unwrap_err().unwrap(), Error::EventNotActive);
}

#[test]
fn test_unauthorized_deactivate_event() {
    let (env, client, organizer, malicious_user, _) = setup_test();
    let metadata_ref = String::from_str(&env, "ipfs://event123");
    let event_id = 1;

    client.create_event(&organizer, &event_id, &metadata_ref);

    // Malicious user tries to deactivate
    let res = client.try_deactivate_event(&malicious_user, &event_id);
    assert_eq!(res.unwrap_err().unwrap(), Error::Unauthorized);
}

#[test]
fn test_nonexistent_event_deactivation() {
    let (env, client, organizer, _, _) = setup_test();
    let event_id = 999;

    let res = client.try_deactivate_event(&organizer, &event_id);
    assert_eq!(res.unwrap_err().unwrap(), Error::EventNotFound);
}

#[test]
fn test_repeated_deactivation() {
    let (env, client, organizer, _, _) = setup_test();
    let metadata_ref = String::from_str(&env, "ipfs://event123");
    let event_id = 1;

    client.create_event(&organizer, &event_id, &metadata_ref);

    // First deactivation succeeds
    client.deactivate_event(&organizer, &event_id);

    // Second deactivation should also succeed idempotently or fail depending on design.
    // Currently the contract allows it idempotently.
    client.deactivate_event(&organizer, &event_id);
}

#[test]
fn test_inactive_event_verification_and_check_in() {
    let (env, client, organizer, _, ticket_buyer) = setup_test();
    let metadata_ref = String::from_str(&env, "ipfs://event123");
    let event_id = 1;
    let ticket_id = 100;

    client.create_event(&organizer, &event_id, &metadata_ref);
    client.issue_ticket(&organizer, &event_id, &ticket_id, &ticket_buyer);

    // Deactivate the event
    client.deactivate_event(&organizer, &event_id);

    // verify_ticket should still return the ticket to verify ownership/authenticity
    let ticket = client.verify_ticket(&ticket_id);
    assert_eq!(ticket.id, ticket_id);
    assert_eq!(ticket.owner, ticket_buyer);

    // check_in should fail because the event is inactive
    let res = client.try_check_in(&organizer, &ticket_id);
    assert_eq!(res.unwrap_err().unwrap(), Error::EventNotActive);
}
