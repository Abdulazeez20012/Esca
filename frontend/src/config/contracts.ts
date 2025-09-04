// Contract configuration and constants
export const CONTRACT_CONFIG = {
  PACKAGE_ID: process.env.NEXT_PUBLIC_ESCROW_PACKAGE_ID || "0x0",
  VAULT_CREATION_CAP_ID: process.env.NEXT_PUBLIC_VAULT_CREATION_CAP_ID || "0x0",
  NETWORK: process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet",
  RPC_URL: process.env.NEXT_PUBLIC_SUI_RPC_URL || "https://fullnode.testnet.sui.io:443",
  GAS_BUDGET: parseInt(process.env.NEXT_PUBLIC_DEFAULT_GAS_BUDGET || "20000000"),
} as const;

// Module names in the contract
export const CONTRACT_MODULES = {
  ESCROW_SWAP: "escrow_swap",
  NFT_ESCROW: "nft_escrow",
} as const;

// Function names in the contract
export const CONTRACT_FUNCTIONS = {
  // Escrow Swap functions
  CREATE: "create",
  SWAP: "swap", 
  RETURN_TO_SENDER: "return_to_sender",
  
  // NFT Escrow functions
  CREATE_NFT_VAULT: "create_nft_vault",
  CONFIRM_NFT_VAULT: "confirm_nft_vault",
  RELEASE_NFT: "release_nft",
  CANCEL_NFT_VAULT: "cancel_nft_vault",
  DISPUTE_NFT_VAULT: "dispute_nft_vault",
  RESOLVE_NFT_DISPUTE: "resolve_nft_dispute",
} as const;

// Vault states (matching the smart contract)
export const VAULT_STATES = {
  PENDING: 0,
  CONFIRMED: 1, 
  COMPLETED: 2,
  DISPUTED: 3,
  CANCELLED: 4,
} as const;

// Event types emitted by the contract
export const CONTRACT_EVENTS = {
  VAULT_CREATED: "VaultCreated",
  VAULT_CONFIRMED: "VaultConfirmed", 
  VAULT_RELEASED: "VaultReleased",
  VAULT_DISPUTED: "VaultDisputed",
  NFT_VAULT_CREATED: "NFTVaultCreated",
  NFT_VAULT_CONFIRMED: "NFTVaultConfirmed",
  NFT_VAULT_RELEASED: "NFTVaultReleased", 
  NFT_VAULT_DISPUTED: "NFTVaultDisputed",
} as const;

// Coin types
export const COIN_TYPES = {
  SUI: "0x2::sui::SUI",
  USDC: "0x..." // Update with actual USDC coin type on Sui
} as const;