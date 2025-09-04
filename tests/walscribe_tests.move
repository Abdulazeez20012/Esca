module walscribe::walscribe_tests;

use sui::transfer;

#[test_only]
use sui::coin::{Self, Coin};
#[test_only]
use sui::sui::SUI;
#[test_only]
use sui::test_scenario::{Self as ts, Scenario};

#[test_only]
use 0x0::lock;


#[test_only]
const ALICE: address = @0xA;
#[test_only]
const RECIPIENT: address = @0xB;
#[test_only]
const CUSTODIAN: address = @0xC;
#[test_only]
const DIANE: address = @0xD;

#[test_only]
fun test_coin(ts: &mut Scenario): Coin<SUI> {
    coin::mint_for_testing<SUI>(42, ts::ctx(ts))
}

#[test]
fun test_successful_swap() {
    let mut ts = ts::begin(@0x0);


#[test]
#[expected_failure(abort_code = EMismatchSenderAndRecipient)]
fun test_mismatch_sender() {
    let mut ts = ts::begin(@0x0);

    let ik1 = {
        ts.next_tx(ALICE);
        let c = test_coin(&mut ts);
        let (l, k) = lock::lock(c, ts.ctx());
        let kid = object::id(&k);
        transfer::public_transfer(l, ALICE);
        transfer::public_transfer(k, ALICE);
        kid
    };

    let ik2 = {
        ts.next_tx(RECIPIENT);
        let c = test_coin(&mut ts);
        let (l, k) = lock::lock(c, ts.ctx());
        let kid = object::id(&k);
        transfer::public_transfer(l, RECIPIENT);
        transfer::public_transfer(k, RECIPIENT);
        kid
    };

    // Alice wants to trade with Bob.
    {
        ts.next_tx(ALICE);
        let k1: Key = ts.take_from_sender();
        let l1: Locked<Coin<SUI>> = ts.take_from_sender();
        create(k1, l1, ik2, RECIPIENT, CUSTODIAN, ts.ctx());
    };

    // But Bob wants to trade with Diane.
    {
        ts.next_tx(RECIPIENT);
        let k2: Key = ts.take_from_sender();
        let l2: Locked<Coin<SUI>> = ts.take_from_sender();
        create(k2, l2, ik1, DIANE, CUSTODIAN, ts.ctx());
    };

    // When the custodian tries to match up the swap, it will fail.
    {
        ts.next_tx(CUSTODIAN);
        swap<Coin<SUI>, Coin<SUI>>(
            ts.take_from_sender(),
            ts.take_from_sender(),
        );
    };
    abort 1337
}

#[test]
#[expected_failure(abort_code = EMismatchExchangeObject)]
fun test_mismatch_object() {
    let mut ts = ts::begin(@0x0);

    let ik1 = {
        ts.next_tx(ALICE);
        let c = test_coin(&mut ts);
        let (l, k) = lock::lock(c, ts.ctx());
        let kid = object::id(&k);
        transfer::public_transfer(l, ALICE);
        transfer::public_transfer(k, ALICE);
        kid
    };

    {
        ts.next_tx(RECIPIENT);
        let c = test_coin(&mut ts);
        let (l, k) = lock::lock(c, ts.ctx());
        transfer::public_transfer(l, RECIPIENT);
        transfer::public_transfer(k, RECIPIENT);
    };

    // Alice wants to trade with Bob, but Alice has asked for an
    // object (via its `exchange_key`) that Bob has not put up for
    // the swap.
    {
        ts.next_tx(ALICE);
        let k1: Key = ts.take_from_sender();
        let l1: Locked<Coin<SUI>> = ts.take_from_sender();
        create(k1, l1, ik1, RECIPIENT, CUSTODIAN, ts.ctx());
    };

    {
        ts.next_tx(RECIPIENT);
        let k2: Key = ts.take_from_sender();
        let l2: Locked<Coin<SUI>> = ts.take_from_sender();
        create(k2, l2, ik1, ALICE, CUSTODIAN, ts.ctx());
    };

    // When the custodian tries to match up the swap, it will fail.
    {
        ts.next_tx(CUSTODIAN);
        swap<Coin<SUI>, Coin<SUI>>(
            ts.take_from_sender(),
            ts.take_from_sender(),
        );
    };

    abort 1337
}


#[test]
#[expected_failure(abort_code = EMismatchExchangeObject)]
fun test_object_tamper() {
    let mut ts = ts::begin(@0x0);

    // Alice locks the object they want to trade
    let ik1 = {
        ts.next_tx(ALICE);
        let c = test_coin(&mut ts);
        let (l, k) = lock::lock(c, ts.ctx());
        let kid = object::id(&k);
        transfer::public_transfer(l, ALICE);
        transfer::public_transfer(k, ALICE);
        kid
    };

    // Bob locks their object as well.
    let ik2 = {
        ts.next_tx(RECIPIENT);
        let c = test_coin(&mut ts);
        let (l, k) = lock::lock(c, ts.ctx());
        let kid = object::id(&k);
        transfer::public_transfer(l, RECIPIENT);
        transfer::public_transfer(k, RECIPIENT);
        kid
    };

    // Alice gives the custodian their object to hold in escrow.
    {
        ts.next_tx(ALICE);
        let k1: Key = ts.take_from_sender();
        let l1: Locked<Coin<SUI>> = ts.take_from_sender();
        create(k1, l1, ik2, RECIPIENT, CUSTODIAN, ts.ctx());
    };

    // Bob has a change of heart, so they unlock the object and tamper
    // with it.
    {
        ts.next_tx(RECIPIENT);
        let k: Key = ts.take_from_sender();
        let l: Locked<Coin<SUI>> = ts.take_from_sender();
        let mut c = lock::unlock(l, k);

        let _dust = coin::split(&mut c, 1, ts.ctx());
        let (l, k) = lock::lock(c, ts.ctx());
        create(k, l, ik1, ALICE, CUSTODIAN, ts.ctx());
    };

    // When the Custodian makes the swap, it detects Bob's nefarious
    // behaviour.
    {
        ts.next_tx(CUSTODIAN);
        swap<Coin<SUI>, Coin<SUI>>(
            ts.take_from_sender(),
            ts.take_from_sender(),
        );
    };

    abort 1337
}


#[test]
fun test_return_to_sender() {
    let mut ts = ts::begin(@0x0);

    // Alice locks the object they want to trade
    let cid = {
        ts.next_tx(ALICE);
        let c = test_coin(&mut ts);
        let cid = object::id(&c);
        let (l, k) = lock::lock(c, ts.ctx());
        let i = object::id_from_address(@0x0);
        create(k, l, i, RECIPIENT, CUSTODIAN, ts.ctx());
        cid
    };

    // Custodian sends it back
    {
        ts.next_tx(CUSTODIAN);
        return_to_sender<Coin<SUI>>(ts.take_from_sender());
    };

    ts.next_tx(@0x0);

    // Alice can then access it.
    {
        let c: Coin<SUI> = ts.take_from_address_by_id(ALICE, cid);
        ts::return_to_address(ALICE, c)
    };

    ts.end();
}