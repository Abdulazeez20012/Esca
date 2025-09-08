#[allow(unused_const)]
module walscribe::walscribe_tests;

// use walscribe::escrow_swap::{Self, create, swap, return_to_sender};
use walscribe::lock::{Self, create, return_to_sender, unlock, lock, swap, Locked, Key, Escrow, LockedObjectKey};
use sui::transfer;

#[test_only]
use sui::coin::{Self, Coin};
use sui::sui::SUI;
use sui::test_scenario::{Self as ts, Scenario};
use sui::table::{Self as table, Table};


#[test_only]
const ALICE: address = @0xA;
#[test_only]
const RECIPIENT: address = @0xB;
const CUSTODIAN: address = @0xC;
const DIANE: address = @0xD;
const EMismatchExchangeObject: u64 = 1;
const EMismatchSenderAndRecipient: u64 = 0;


#[test_only]
fun test_coin(ts: &mut Scenario): Coin<SUI> {
    coin::mint_for_testing<SUI>(42, ts::ctx(ts))
}

#[test]
fun test_successful_swap() {
    let mut ts = ts::begin(@0x0);
    let ctx = test_scenario::ctx(&mut ts);

    // Initialize tables
    let mut locked_table_alice = table::new<u64, bool>(ctx);
    let mut locked_table_bob = table::new<u64, bool>(ctx);
    let mut escrow_table = table::new<u64, Escrow<Coin<SUI>>>(ctx);

    //let (bob_locked, bob_key) = lock(&mut escrow_table, obj, ctx);

    // Alice locks her coin
    ts.next_tx(ALICE);
    let alice_coin = test_coin(&mut ts);
    let alice_locked = lock(&mut escrow_table, ts.ctx());

    //let (alice_key, alice_locked) = lock(&mut escrow_table, obj, ctx);

    let alice_locked_key = object::id<Key<Coin<SUI>>>(&alice_key);

    // Bob locks his coin
    ts.next_tx(RECIPIENT);
    let bob_coin = test_coin(&mut ts);
    let (bob_key, bob_locked) = lock(&mut escrow_table, obj, ts.ctx());

    let bob_locked_key = object::id<Key<Coin<SUI>>>(&bob_key);

    // Alice creates escrow for Bob's coin
    ts.next_tx(ALICE);
    create(
        &mut escrow_table, // mutable reference to the table
        key,
        alice_locked,
        bob_locked_key,
        RECIPIENT,
        CUSTODIAN,
        0, 
        ts.ctx()
    );

    // Bob creates escrow for Alice's coin
    ts.next_tx(RECIPIENT);
    create(
        &mut escrow_table, // mutable reference to the table
        key,
        bob_locked,
        alice_locked_key,
        ALICE,
        CUSTODIAN,
        1,
        ts.ctx()
    );

    // Custodian swaps
    ts.next_tx(CUSTODIAN);
    // Fetch escrows from table (simulate as needed)
    let escrow1 = table::remove(&mut escrow_table, 0);
    let escrow2 = table::remove(&mut escrow_table, 1);
    swap(escrow1, escrow2);

    ts.end();
}