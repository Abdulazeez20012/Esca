module walscribe::escrow_swap;

use escrow::lock::{Locked, Key};
use sui::object::{self, UID};
use sui::transfer;

public struct Locked<T: store> has key, store {
    id: UID,
    key: ID,
    obj: T,
}

public struct Escrow<T: key + store> has key {
    id: UID,
    sender: address,
    recipient: address,
    recipient_exchange_key: ID,
    /// The ID of the key that locked the escrowed object, before it was escrowed.
    escrowed_key: ID,
    object_escrowed: T,
}

const EMismatchSenderAndRecipient: u64 = 0;
const EMismatchExchangeObject: u64 = 1;


public fun create<T: key + store>(
    key: Key,
    locked: Locked<T>,
    exchange_key: ID,
    recipient: address,
    verifier: address,
    ctx: &mut TxContext,
) {
    let escrow = Escrow {
        id: object::new(ctx),
        sender: ctx.sender(),
        recipient,
        recipient_exchange_key,
        escrowed_key: object::id(&key),
        object_escrowed: locked.unlock(key),
    };

    transfer::transfer(escrow, verifier);
}

/// Function for custodian (trusted third-party) to perform a swap between
/// two parties.  Fails if their senders and recipients do not match, or if
/// their respective desired objects do not match.
    public fun swap<T: key + store, U: key + store>(owner: Escrow<T>, recipient: Escrow<U>) {
        let Escrow {
            id: id1,
            sender: sender1,
            recipient: recipient1,
            exchange_key: exchange_key1,
            escrowed_key: escrowed_key1,
            escrowed: object_escrowed,
        } = owner;

        let Escrow {
            id: id2,
            sender: sender2,
            recipient: recipient2,
            exchange_key: exchange_key2,
            escrowed_key: escrowed_key2,
            escrowed: escrowed2,
        } = recipient;
        id1.delete();
        id2.delete();

        // Make sure the sender and recipient match each other
        assert!(sender1 == recipient2, EMismatchSenderAndRecipient);
        assert!(sender2 == recipient1, EMismatchSenderAndRecipient);

        // Make sure the objects match each other and haven't been modified (they remain locked).
        assert!(escrowed_key1 == exchange_key2, EMismatchExchangeObject);
        assert!(escrowed_key2 == exchange_key1, EMismatchExchangeObject);

        // Do the actual swap
        transfer::public_transfer(escrowed1, recipient1);
        transfer::public_transfer(escrowed2, recipient2);
    }

/// The custodian can always return an escrowed object to its original
/// owner.
    public fun return_to_sender<T: key + store>(obj: Escrow<T>) {
        let Escrow {
            id,
            sender,
            recipient: _,
            exchange_key: _,
            escrowed_key: _,
            escrowed,
        } = obj;
        id.delete();
        transfer::public_transfer(escrowed, sender);
    }


    // Alice locks the object they want to trade
    let (i1, ik1) = {
        ts.next_tx(ALICE);
        let c = test_coin(&mut ts);
        let cid = object::id(&c);
        let (l, k) = lock::lock(c, ts.ctx());
        let kid = object::id(&k);
        transfer::public_transfer(l, ALICE);
        transfer::public_transfer(k, ALICE);
        (cid, kid)
    };

    // Bob locks their object as well.
    let (i2, ik2) = {
        ts.next_tx(BOB);
        let c = test_coin(&mut ts);
        let cid = object::id(&c);
        let (l, k) = lock::lock(c, ts.ctx());
        let kid = object::id(&k);
        transfer::public_transfer(l, BOB);
        transfer::public_transfer(k, BOB);
        (cid, kid)
    };

    // Alice gives the custodian their object to hold in escrow.
    {
        ts.next_tx(ALICE);
        let k1: Key = ts.take_from_sender();
        let l1: Locked<Coin<SUI>> = ts.take_from_sender();
        create(k1, l1, ik2, BOB, CUSTODIAN, ts.ctx());
    };

    // Bob does the same.
    {
        ts.next_tx(BOB);
        let k2: Key = ts.take_from_sender();
        let l2: Locked<Coin<SUI>> = ts.take_from_sender();
        create(k2, l2, ik1, ALICE, CUSTODIAN, ts.ctx());
    };

    // The custodian makes the swap
    {
        ts.next_tx(CUSTODIAN);
        swap<Coin<SUI>, Coin<SUI>>(
            ts.take_from_sender(),
            ts.take_from_sender(),
        );
    };

    // Commit effects from the swap
    ts.next_tx(@0x0);

    // Alice gets the object from Bob
    {
        let c: Coin<SUI> = ts.take_from_address_by_id(ALICE, i2);
        ts::return_to_address(ALICE, c);
    };

    // Bob gets the object from Alice
    {
        let c: Coin<SUI> = ts.take_from_address_by_id(BOB, i1);
        ts::return_to_address(BOB, c);
    };

    ts.end();
}
