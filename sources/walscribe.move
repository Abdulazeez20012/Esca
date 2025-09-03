module walscribe::WALSCRIBE;

use sui::object::UID;
use sui::coin::Coin;
use sui::tx_context::TxContext;
use sui::clock::Clock;
use sui::transfer::public_transfer;
use sui::event;

const VAULT_ACTIVE: u8 = 0;
const VAULT_PENDING: u8 = 1;
const VAULT_REFUNDED: u8 = 2;
const VAULT_RELEASED: u8 = 3;


const ERR_INVALID_VAULT_STATE: u64 = 1;
const ERR_UNAUTHORIZED_ACCESS: u64 = 2;
const ERR_VAULT_EXPIRED: u64 = 3;
const ERR_INSUFFICIENT_FUNDS: u64 = 4;
const ERR_VAULT_NOT_READY: u64 = 5;


    public struct Vault has key, store {
        id: UID,
        balance: u64,
        asset: Coin<T>,
        vault_address: address, 
        expiry_time: Timestamp;
        status: enum { Active, Released, Refunded }
    }

    public struct VaultCreationCap has key {
        id: UID,
        owner: address,
    }

    public struct Escrow has key {
        id: UID,
        recipient: address,
        verifier: address,
        amount: u64,
        is_funded: bool,
        is_released: bool,
    }

    public struct VaultReleasedStore has copy, drop {
        vault_id: UID,
        released_to: address,
        amount: u64,
        release_time: clock::now_seconds(),
    }

    fun init(ctx: &mut TxContext) {
        let vault_cap = VaultCreationCap { 
        id: object::new(ctx) ,
        owner: tx_context::sender(ctx),
    };
        transfer(&tx_context::sender(ctx), vault_cap);
    }

    public fun create_vault<T>(asset: Coin<T>, recipient: address, verifier: address, duration: Timestamp, ctx: &mut TxContext): Vault {
        let current_time = clock::now_seconds();
        let expiry_time = current_time + duration;

        assert!(duration >= expiry_time, ERR_VAULT_EXPIRED);
        assert!(balance <= 0, ERR_INSUFFICIENT_FUNDS);

        let vault = EscrowVault<> {
            id: object::new_uid<T>(),
            balance,
            asset,
            vault_address: tx_context::sender(ctx),
            expiry_time,
            status: Active,
        }

    move_to(&tx_context::sender(ctx), vault);

    };

//    public fun is_expired(vault: &Vault, clock: &Clock): bool {
//        clock::timestamp_ms(clock) >= vault.expiry_time 
//    }

//    public fun is_active(vault: &Vault, clock: &Clock): bool {
//        clock::timestamp_ms(clock) < vault.expiry_time && vault.status == Active
//    }


    public fun release_funds<T>(vault: &mut EscrowVault, clock: &Clock, ctx: &mut TxContext) {
        let sender = tx_context::sender(ctx);
        let current_time = clock::timestamp_ms(clock);

        assert!(sender == vault.verifier, ERR_UNAUTHORIZED_ACCESS);
        assert!(vault.state == VAULT_ACTIVE, ERR_VAULT_NOT_READY);

        vault.state = VAULT_RELEASED;

        let funds_transfer = coin::transfer(vault.asset, vault.recipient);
        transfer::public_transfer(vault.asset, vault.recipient);

        event::emit_event(VaultReleasedStore {
            vault_id: vault.id,
            released_to: vault.recipient,
            amount: vault.balance,
            release_time: current_time,
        });    
    }

    coin::transfer(vault.asset, vault.recipient);
};

