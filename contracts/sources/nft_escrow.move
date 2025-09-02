/// Esca NFT Escrow Module
/// Manages secure NFT escrow transactions on Sui blockchain
module esca::nft_escrow {
    use sui::object::{Self, ID, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::clock::{Self, Clock};
    use sui::event;
    use std::string::String;
    use std::option::{Self, Option};

    /// Error codes
    const ERR_INVALID_VAULT_STATE: u64 = 1;
    const ERR_UNAUTHORIZED_ACCESS: u64 = 2;
    const ERR_VAULT_EXPIRED: u64 = 3;
    const ERR_VAULT_NOT_READY: u64 = 4;

    /// Vault states
    const VAULT_PENDING: u8 = 0;
    const VAULT_CONFIRMED: u8 = 1;
    const VAULT_COMPLETED: u8 = 2;
    const VAULT_DISPUTED: u8 = 3;
    const VAULT_CANCELLED: u8 = 4;

    /// Generic NFT wrapper for escrow
    public struct EscrowedNFT<T: key + store> has key, store {
        id: UID,
        nft: T,
    }

    /// NFT Escrow Vault structure
    public struct NFTEscrowVault<phantom T> has key, store {
        id: UID,
        creator: address,
        counterparty: address,
        arbitrator: Option<address>,
        nft_id: Option<ID>,
        escrowed_nft: Option<EscrowedNFT<T>>,
        state: u8,
        expiry_time: u64,
        description: String,
        created_at: u64,
        confirmed_at: Option<u64>,
    }

    /// Events
    public struct NFTVaultCreated has copy, drop {
        vault_id: ID,
        creator: address,
        counterparty: address,
        nft_id: ID,
        expiry_time: u64,
    }

    public struct NFTVaultConfirmed has copy, drop {
        vault_id: ID,
        counterparty: address,
        confirmed_at: u64,
    }

    public struct NFTVaultReleased has copy, drop {
        vault_id: ID,
        released_to: address,
        nft_id: ID,
        released_at: u64,
    }

    public struct NFTVaultDisputed has copy, drop {
        vault_id: ID,
        disputed_by: address,
        disputed_at: u64,
    }

    /// Create a new NFT escrow vault
    public fun create_nft_vault<T: key + store>(
        nft: T,
        counterparty: address,
        arbitrator: Option<address>,
        expiry_time: u64,
        description: String,
        clock: &Clock,
        ctx: &mut TxContext
    ): ID {
        let current_time = clock::timestamp_ms(clock);
        
        assert!(expiry_time > current_time, ERR_VAULT_EXPIRED);

        let vault_uid = object::new(ctx);
        let vault_id = object::uid_to_inner(&vault_uid);
        let nft_id = object::id(&nft);
        
        // Wrap the NFT for escrow
        let escrowed_nft = EscrowedNFT<T> {
            id: object::new(ctx),
            nft,
        };
        
        let vault = NFTEscrowVault<T> {
            id: vault_uid,
            creator: tx_context::sender(ctx),
            counterparty,
            arbitrator,
            nft_id: option::some(nft_id),
            escrowed_nft: option::some(escrowed_nft),
            state: VAULT_PENDING,
            expiry_time,
            description,
            created_at: current_time,
            confirmed_at: option::none(),
        };

        event::emit(NFTVaultCreated {
            vault_id,
            creator: tx_context::sender(ctx),
            counterparty,
            nft_id,
            expiry_time,
        });

        transfer::share_object(vault);
        vault_id
    }

    /// Confirm NFT vault by counterparty
    public fun confirm_nft_vault<T: key + store>(
        vault: &mut NFTEscrowVault<T>,
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

        event::emit(NFTVaultConfirmed {
            vault_id: object::uid_to_inner(&vault.id),
            counterparty: sender,
            confirmed_at: current_time,
        });
    }

    /// Release NFT to counterparty
    public fun release_nft<T: key + store>(
        vault: &mut NFTEscrowVault<T>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let current_time = clock::timestamp_ms(clock);

        assert!(sender == vault.creator, ERR_UNAUTHORIZED_ACCESS);
        assert!(vault.state == VAULT_CONFIRMED, ERR_VAULT_NOT_READY);

        vault.state = VAULT_COMPLETED;
        
        let escrowed_nft = option::extract(&mut vault.escrowed_nft);
        let EscrowedNFT { id, nft } = escrowed_nft;
        let nft_id = object::id(&nft);
        
        object::delete(id);
        transfer::public_transfer(nft, vault.counterparty);

        event::emit(NFTVaultReleased {
            vault_id: object::uid_to_inner(&vault.id),
            released_to: vault.counterparty,
            nft_id,
            released_at: current_time,
        });
    }

    /// Cancel NFT vault (only by creator before confirmation)
    public fun cancel_nft_vault<T: key + store>(
        vault: &mut NFTEscrowVault<T>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let current_time = clock::timestamp_ms(clock);

        assert!(sender == vault.creator, ERR_UNAUTHORIZED_ACCESS);
        assert!(vault.state == VAULT_PENDING || current_time >= vault.expiry_time, ERR_INVALID_VAULT_STATE);

        vault.state = VAULT_CANCELLED;
        
        let escrowed_nft = option::extract(&mut vault.escrowed_nft);
        let EscrowedNFT { id, nft } = escrowed_nft;
        
        object::delete(id);
        transfer::public_transfer(nft, vault.creator);
    }

    /// Initiate dispute for NFT vault
    public fun dispute_nft_vault<T: key + store>(
        vault: &mut NFTEscrowVault<T>,
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

        event::emit(NFTVaultDisputed {
            vault_id: object::uid_to_inner(&vault.id),
            disputed_by: sender,
            disputed_at: current_time,
        });
    }

    /// Resolve NFT dispute (arbitrator only)
    public fun resolve_nft_dispute<T: key + store>(
        vault: &mut NFTEscrowVault<T>,
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

        let escrowed_nft = option::extract(&mut vault.escrowed_nft);
        let EscrowedNFT { id, nft } = escrowed_nft;
        let nft_id = object::id(&nft);
        
        object::delete(id);
        transfer::public_transfer(nft, recipient);

        event::emit(NFTVaultReleased {
            vault_id: object::uid_to_inner(&vault.id),
            released_to: recipient,
            nft_id,
            released_at: current_time,
        });
    }

    // View functions
    public fun get_nft_vault_info<T: key + store>(
        vault: &NFTEscrowVault<T>
    ): (address, address, Option<ID>, u8, u64) {
        (vault.creator, vault.counterparty, vault.nft_id, vault.state, vault.expiry_time)
    }

    public fun get_nft_vault_state<T: key + store>(vault: &NFTEscrowVault<T>): u8 {
        vault.state
    }

    public fun is_nft_vault_expired<T: key + store>(vault: &NFTEscrowVault<T>, clock: &Clock): bool {
        clock::timestamp_ms(clock) >= vault.expiry_time
    }
}