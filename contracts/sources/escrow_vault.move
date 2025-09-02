/// Esca Escrow Vault Module
/// Manages secure multi-asset escrow transactions on Sui blockchain
module esca::escrow_vault {
    use sui::object::{Self, ID, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::clock::{Self, Clock};
    use sui::event;
    use std::string::String;
    use std::vector;

    /// Error codes
    const ERR_INVALID_VAULT_STATE: u64 = 1;
    const ERR_UNAUTHORIZED_ACCESS: u64 = 2;
    const ERR_VAULT_EXPIRED: u64 = 3;
    const ERR_INSUFFICIENT_FUNDS: u64 = 4;
    const ERR_VAULT_NOT_READY: u64 = 5;

    /// Vault states
    const VAULT_PENDING: u8 = 0;
    const VAULT_CONFIRMED: u8 = 1;
    const VAULT_COMPLETED: u8 = 2;
    const VAULT_DISPUTED: u8 = 3;
    const VAULT_CANCELLED: u8 = 4;

    /// Escrow Vault structure
    public struct EscrowVault<phantom T> has key, store {
        id: UID,
        creator: address,
        counterparty: address,
        arbitrator: Option<address>,
        amount: u64,
        funds: Coin<T>,
        state: u8,
        expiry_time: u64,
        description: String,
        created_at: u64,
        confirmed_at: Option<u64>,
    }

    /// Vault creation capability
    public struct VaultCreationCap has key {
        id: UID,
        owner: address,
    }

    /// Events
    public struct VaultCreated has copy, drop {
        vault_id: ID,
        creator: address,
        counterparty: address,
        amount: u64,
        expiry_time: u64,
    }

    public struct VaultConfirmed has copy, drop {
        vault_id: ID,
        counterparty: address,
        confirmed_at: u64,
    }

    public struct VaultReleased has copy, drop {
        vault_id: ID,
        released_to: address,
        amount: u64,
        released_at: u64,
    }

    public struct VaultDisputed has copy, drop {
        vault_id: ID,
        disputed_by: address,
        disputed_at: u64,
    }

    /// Initialize the module
    fun init(ctx: &mut TxContext) {
        let cap = VaultCreationCap {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),
        };
        transfer::transfer(cap, tx_context::sender(ctx));
    }

    /// Create a new escrow vault
    public fun create_vault<T>(
        funds: Coin<T>,
        counterparty: address,
        arbitrator: Option<address>,
        expiry_time: u64,
        description: String,
        clock: &Clock,
        ctx: &mut TxContext
    ): ID {
        let amount = coin::value(&funds);
        let current_time = clock::timestamp_ms(clock);
        
        assert!(expiry_time > current_time, ERR_VAULT_EXPIRED);
        assert!(amount > 0, ERR_INSUFFICIENT_FUNDS);

        let vault_uid = object::new(ctx);
        let vault_id = object::uid_to_inner(&vault_uid);
        
        let vault = EscrowVault<T> {
            id: vault_uid,
            creator: tx_context::sender(ctx),
            counterparty,
            arbitrator,
            amount,
            funds,
            state: VAULT_PENDING,
            expiry_time,
            description,
            created_at: current_time,
            confirmed_at: option::none(),
        };

        event::emit(VaultCreated {
            vault_id,
            creator: tx_context::sender(ctx),
            counterparty,
            amount,
            expiry_time,
        });

        transfer::share_object(vault);
        vault_id
    }

    /// Confirm vault by counterparty
    public fun confirm_vault<T>(
        vault: &mut EscrowVault<T>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let current_time = clock::timestamp_ms(clock);

        assert!(sender == vault.counterparty, ERR_UNAUTHORIZED_ACCESS);
        assert!(vault.state == VAULT_PENDING, ERR_INVALID_VAULT_STATE);
        assert!(current_time < vault.expiry_time, ERR_VAULT_EXPIRED);

        vault.state = VAULT_CONFIRMED;
        vault.confirmed_at = option::some(current_time);

        event::emit(VaultConfirmed {
            vault_id: object::uid_to_inner(&vault.id),
            counterparty: sender,
            confirmed_at: current_time,
        });
    }

    /// Release funds to counterparty
    public fun release_funds<T>(
        vault: &mut EscrowVault<T>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let current_time = clock::timestamp_ms(clock);

        assert!(sender == vault.creator, ERR_UNAUTHORIZED_ACCESS);
        assert!(vault.state == VAULT_CONFIRMED, ERR_VAULT_NOT_READY);

        vault.state = VAULT_COMPLETED;
        
        let funds = coin::split(&mut vault.funds, vault.amount, ctx);
        transfer::public_transfer(funds, vault.counterparty);

        event::emit(VaultReleased {
            vault_id: object::uid_to_inner(&vault.id),
            released_to: vault.counterparty,
            amount: vault.amount,
            released_at: current_time,
        });
    }

    /// Cancel vault (only by creator before confirmation)
    public fun cancel_vault<T>(
        vault: &mut EscrowVault<T>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let current_time = clock::timestamp_ms(clock);

        assert!(sender == vault.creator, ERR_UNAUTHORIZED_ACCESS);
        assert!(vault.state == VAULT_PENDING || current_time >= vault.expiry_time, ERR_INVALID_VAULT_STATE);

        vault.state = VAULT_CANCELLED;
        
        let funds = coin::split(&mut vault.funds, vault.amount, ctx);
        transfer::public_transfer(funds, vault.creator);
    }

    /// Initiate dispute
    public fun dispute_vault<T>(
        vault: &mut EscrowVault<T>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let current_time = clock::timestamp_ms(clock);

        assert!(
            sender == vault.creator || sender == vault.counterparty,
            ERR_UNAUTHORIZED_ACCESS
        );
        assert!(vault.state == VAULT_CONFIRMED, ERR_INVALID_VAULT_STATE);

        vault.state = VAULT_DISPUTED;

        event::emit(VaultDisputed {
            vault_id: object::uid_to_inner(&vault.id),
            disputed_by: sender,
            disputed_at: current_time,
        });
    }

    /// Resolve dispute (arbitrator only)
    public fun resolve_dispute<T>(
        vault: &mut EscrowVault<T>,
        release_to_counterparty: bool,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let current_time = clock::timestamp_ms(clock);

        assert!(
            option::is_some(&vault.arbitrator) && 
            option::borrow(&vault.arbitrator) == &sender,
            ERR_UNAUTHORIZED_ACCESS
        );
        assert!(vault.state == VAULT_DISPUTED, ERR_INVALID_VAULT_STATE);

        vault.state = VAULT_COMPLETED;
        
        let recipient = if (release_to_counterparty) {
            vault.counterparty
        } else {
            vault.creator
        };

        let funds = coin::split(&mut vault.funds, vault.amount, ctx);
        transfer::public_transfer(funds, recipient);

        event::emit(VaultReleased {
            vault_id: object::uid_to_inner(&vault.id),
            released_to: recipient,
            amount: vault.amount,
            released_at: current_time,
        });
    }

    // View functions
    public fun get_vault_info<T>(vault: &EscrowVault<T>): (address, address, u64, u8, u64) {
        (vault.creator, vault.counterparty, vault.amount, vault.state, vault.expiry_time)
    }

    public fun get_vault_state<T>(vault: &EscrowVault<T>): u8 {
        vault.state
    }

    public fun is_expired<T>(vault: &EscrowVault<T>, clock: &Clock): bool {
        clock::timestamp_ms(clock) >= vault.expiry_time
    }
}