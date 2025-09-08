#[allow(duplicate_alias)]
module walscribe::lock;

    use sui::object::UID;
    use sui::event;
    //use sui::table::{Self, Table};

    const EMismatchExchangeObject: u64 = 1;
    const ELockKeyMismatch: u64 = 2;
    const EAlreadyExchangedOrReturned: u64 = 3;
    const EMismatchedSenderRecipient: u64 = 4;

    public struct Locked<T: store> has key, store {
        id: UID,
        key: ID,
        obj: T
    }

    public struct Key has key, store {
        id: UID
    }

    public struct EscrowCreated has copy, drop, store {
        id: ID,
        sender: address,
        recipient: address,
    }

    public struct Escrow<T: key + store> has key, store {
        id: UID,
        sender: address,
        recipient: address,
        exchange_key: ID,
        escrowed_obj: option::Option<T>,
    }

    public fun create_escrow<T: key+store>(escrowed_obj: T, exchange_key: ID, recipient: address, ctx: &mut TxContext){
        let escrow = Escrow{
            id: object::new(ctx),
            sender: ctx.sender(),
            recipient,
            exchange_key,
            escrowed_obj: option::some(escrowed_obj)
        };

        let id = object::id(&escrow);
        event::emit(EscrowCreated{
            id,
            sender:ctx.sender(),
            recipient,
        });

        transfer::public_share_object(escrow);
    }


    public fun lock<T: store>(obj: T, ctx: &mut TxContext):(Locked<T>, Key){
        let key = Key{id: object::new(ctx)};

        let lock = Locked {
            id: object::new(ctx),
            key: object::id(&key),
            obj,
        };
        (lock,key)
    }


    public fun unlock<T: store>(locked: Locked<T>, key: Key): T {
        assert!(locked.key == object::id(&key), ELockKeyMismatch);
        let Key {id} = key;
        object::delete(id);

        let Locked {id, key:_, obj} = locked;
        object::delete(id);
        obj
    }

    public fun swap<T:key+store, U:key+store>(escrow : &mut Escrow<T>, key: Key, locked: Locked<U>, ctx: &TxContext): T{

        assert!(option::is_some(&escrow.escrowed_obj), EAlreadyExchangedOrReturned);
        assert!(escrow.recipient == tx_context::sender(ctx), EMismatchedSenderRecipient);
        assert!(escrow.exchange_key == object::id(&key), EMismatchExchangeObject);

        let escrowed1 = option::extract<T>(&mut escrow.escrowed_obj);
        let escrowed2 = unlock(locked, key);

        transfer::public_transfer(escrowed2, escrow.sender);
        escrowed1
    }


//     public struct Escrow<T: key + store> has key, store {
//         id: UID,
//         sender: address,
//         recipient: address,
//         recipient_exchange_key: ID,
//         /// The ID of the key that locked the escrowed object, before it was escrowed.
//         escrowed_key: ID,
//         table: Table<LockedObjectKey, T>,
//     }

    
    // public fun return_to_sender<T: key + store>(obj: Escrow<T>) {
    //     let Escrow {
    //         id,
    //         sender,
    //         recipient: _,
    //         recipient_exchange_key: _,
    //         escrowed_key: _escrowed_key,
    //         object_escrowed: object_escrowed,
    //     } = obj;
    //     id.delete();
    //     transfer::public_transfer(object_escrowed, sender);
    // }

