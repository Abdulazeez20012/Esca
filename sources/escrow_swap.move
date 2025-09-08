#[allow(unused_variable)]
module walscribe::escrow_swap;

    // use sui::object::UID;
    // use sui::transfer;
    use sui::dynamic_object_field as dof;
    use sui::event;
    //use sui::coin::Coin;
    
    public struct Locked<T: store> has key, store {
        id: UID,
        key: ID,
        obj: T,
    }

    public struct Key<phantom T: store> has key, store {
        id: UID,
        key: ID,
    }

    public struct LockDestroyed has drop, copy, store {
        lock_id: ID,
    }

    public struct LockedObjectKey has copy, drop, store {
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
    const ELockKeyMismatch: u64 = 2;

    public fun create<T: key + store + drop>(
        key: Key<T>,
        locked: Locked<T>,
        recipient_exchange_key: ID,
        recipient: address,
        verifier: address,
        //created_at: u64,
        ctx: &mut TxContext,
    ) {
        let escrow = Escrow {
            id: object::new(ctx),
            sender: ctx.sender(),
            recipient,
            recipient_exchange_key: recipient_exchange_key,
            escrowed_key: object::id(&key),
            object_escrowed: unlock(locked, key),   
        };
        transfer::transfer(escrow, verifier);
    }

    public fun unlock<T: key + store + drop>(mut locked: Locked<T>, key: Key<T>): T {
    assert!(locked.key == object::id(&key), ELockKeyMismatch);
        let Key { id, key: _ } = key;
        id.delete();

        let obj = dof::remove<LockedObjectKey, T>(&mut locked.id, LockedObjectKey {});

        event::emit(LockDestroyed { lock_id: object::id(&locked) });

        let Locked { id, key, obj } = locked;
        id.delete();
        obj
    }

    /// Function for custodian (trusted third-party) to perform a swap between
    /// two parties.  Fails if their senders and recipients do not match, or if
    /// their respective desired objects do not match.
    public fun swap<T: key + store, U: key + store>(owner: Escrow<T>, recipient: Escrow<U>) {
        let Escrow {
            id: id1,
            sender: sender1,
            recipient: recipient1,
            recipient_exchange_key: exchange_key1,
            escrowed_key: escrowed_key1,
            object_escrowed: escrowed1,
        } = owner;

        let Escrow {
            id: id2,
            sender: sender2,
            recipient: recipient2,
            recipient_exchange_key: exchange_key2,
            escrowed_key: escrowed_key2,
            object_escrowed: escrowed2,
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

    /// The custodian can always return an escrowed object to its original owner.
    public fun return_to_sender<T: key + store>(obj: Escrow<T>) {
        let Escrow {
            id,
            sender,
            recipient: _,
            recipient_exchange_key: _,
            escrowed_key: _escrowed_key,
            object_escrowed: object_escrowed,
        } = obj;
        id.delete();
        transfer::public_transfer(object_escrowed, sender);
    }

    // Alice locks the object they want to trade
