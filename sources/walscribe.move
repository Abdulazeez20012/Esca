// module walscribe::WALSCRIBE;

// use sui::object::UID;
// use sui::coin::Coin;
// use sui::tx_context::TxContext;
// use sui::clock::Clock;
// use sui::transfer::public_transfer;
// use sui::event;

// const VAULT_ACTIVE: u8 = 0;
// const VAULT_PENDING: u8 = 1;
// const VAULT_REFUNDED: u8 = 2;
// const VAULT_RELEASED: u8 = 3;


// const ERR_INVALID_VAULT_STATE: u64 = 1;
// const ERR_UNAUTHORIZED_ACCESS: u64 = 2;
// const ERR_VAULT_EXPIRED: u64 = 3;
// const ERR_INSUFFICIENT_FUNDS: u64 = 4;
// const ERR_VAULT_NOT_READY: u64 = 5;
// const ERR_NO_FUNDS_TO_REFUND: u64 = 6;
// const ERR_VAULT_NOT_EXPIRED: u64 = 7;

//     public struct Vault has key, store {
//         id: UID,
//         balance: u64,
//         asset: Coin<T>,
//         vault_address: address, 
//         expiry_time: u64,
//     }

//     public struct VaultCreationCap has key {
//         id: UID,
//         owner: address,
//     }

//     public struct EscrowVault<phantom T> has key, store {
//         id: UID,
//         balance: u64,
//         asset: Coin<T>,
//         vault_address: address,
//         recipient: address,
//         verifier: address,
//         amount: u64,
//         is_funded: bool,
//         is_released: bool,
//         expiry_time: u64,
//         created_at: u64,
//     }

//     public struct VaultCreatedStore has store {
//         vault_id: UID,
//         creator: address,
//         amount: u64,
//         expiry_time: u64,
//     }
//     public struct VaultReleasedStore has store {
//         vault_id: UID,
//         released_to: address,
//         amount: u64,
//         release_time: u64,
//     }

//     fun init(ctx: &mut TxContext) {
//         let vault_cap = VaultCreationCap { 
//         id: object::new(ctx) ,
//         owner: tx_context::sender(ctx),
//     };
//         transfer(&tx_context::sender(ctx), vault_cap);
//     }

//     public fun create_vault<T>(asset: Coin<T>, recipient: address, verifier: address, duration: &Clock, ctx: &mut TxContext): Vault {
//         let current_time = clock::now_seconds();
//         let expiry_time = current_time + duration;

//         assert!(duration >= expiry_time, ERR_VAULT_EXPIRED);
//         assert!(balance <= 0, ERR_INSUFFICIENT_FUNDS);


//     public fun create_vault<T: key + store>(
//         key: Key,
//         locked: Locked<T>,
//         exchange_key: ID,
//         recipient: address,
//         verifier: address,
//         ctx: &mut TxContext,
//     ) {
//     let escrow = Escrow {
//         id: object::new(ctx),
//         sender: ctx.sender(),
//         recipient,
//         exchange_key,
//         escrowed_key: object::id(&key),
//         escrowed: locked.unlock(key),
//     };

//     transfer::transfer(escrow, custodian);
// }

//         let vault = EscrowVault<T> {
//             id: id,
//             balance: balance,
//             asset: asset,
//             recipient: recipient,
//             verifier: verifier,
//             vault_address: tx_context::sender(ctx),
//             amount: amount,
//             is_funded: is_funded,
//             is_released: is_released,
//             expiry_time: expiry_time,
//             created_at: current_time,
//         };

//         event::emit(VaultCreatedStore {
//             creator: tx_context::sender(ctx),
//             amount,
//             expiry_time,
//         });

//         transfer::share_object(vault);
//     };

// //    public fun is_expired(vault: &Vault, clock: &Clock): bool {
// //        clock::timestamp_ms(clock) >= vault.expiry_time 
// //    }

// //    public fun is_active(vault: &Vault, clock: &Clock): bool {
// //        clock::timestamp_ms(clock) < vault.expiry_time && vault.status == Active
// //    }


//     public fun release_funds<T>(vault: &mut EscrowVault<T>, clock: &Clock, ctx: &mut TxContext) {
//         let sender = tx_context::sender(ctx);
//         let current_time = clock::timestamp_ms(clock);

//         assert!(sender == vault.verifier, ERR_UNAUTHORIZED_ACCESS);
//         assert!(vault.state == VAULT_ACTIVE, ERR_VAULT_NOT_READY);

//         vault.state = VAULT_RELEASED;

//         let funds_transfer = Coin::transfer(vault.asset, vault.recipient);
//         transfer::public_transfer(vault.asset, vault.recipient);

//         event::emit(VaultReleasedStore {
//             vault_id: vault.id,
//             released_to: vault.recipient,
//             amount: vault.balance,
//             release_time: current_time,
//         });    
//     }

//     public fun refund_funds<T>(vault: &mut EscrowVault<T>, clock: &Clock, ctx: &mut TxContext) {
//         let sender = tx_context::sender(ctx);
//         let current_time = clock::timestamp_ms(clock);
        

//         assert!(sender == vault.vault_address, ERR_UNAUTHORIZED_ACCESS);
//         assert!(vault.state == VAULT_ACTIVE, ERR_VAULT_NOT_READY);
//         assert!(coin::balance(&vault.asset) > 0, ERR_NO_FUNDS_TO_REFUND);
//         assert!(current_time > vault.expiry_time, ERR_VAULT_NOT_EXPIRED);


//         vault.state = VAULT_REFUNDED;

//         let funds_transfer = Coin::transfer(vault.asset, vault.vault_address);
//         transfer::public_transfer(vault.asset, vault.vault_address);
//     }


