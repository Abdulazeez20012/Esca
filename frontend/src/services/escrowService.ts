import { Escrow, Transaction, Asset, TransactionStatus } from '../types';
import { contractService } from './contractService';
import { COIN_TYPES } from '../config/contracts';

// Convert contract vault data to frontend Escrow type
function contractVaultToEscrow(vaultData: any, userAddress: string): Escrow {
  const isInitiator = vaultData.creator === userAddress;
  
  return {
    id: vaultData.id,
    initiator: {
      address: vaultData.creator,
      asset: {
        id: 'sui',
        name: 'Sui',
        symbol: 'SUI',
        balance: parseFloat(contractService.mistToSui(vaultData.amount)),
        iconUrl: '/sui.png'
      },
      amount: parseFloat(contractService.mistToSui(vaultData.amount)),
      status: vaultData.state === 0 ? 'WAITING' : 'LOCKED'
    },
    counterparty: {
      address: vaultData.counterparty,
      asset: {
        id: 'sui',
        name: 'Sui', 
        symbol: 'SUI',
        balance: 0,
        iconUrl: '/sui.png'
      },
      amount: 0,
      status: vaultData.state === 1 ? 'LOCKED' : 'WAITING'
    },
    createdAt: new Date(parseInt(vaultData.createdAt)).toISOString()
  };
}

// Convert contract vault to transaction history
function contractVaultToTransaction(vaultData: any): Transaction {
  let status: TransactionStatus;
  let type: 'SWAP' | 'LOCK' | 'RECLAIM';
  
  switch (vaultData.state) {
    case 2: // COMPLETED
      status = TransactionStatus.COMPLETED;
      type = 'SWAP';
      break;
    case 4: // CANCELLED  
      status = TransactionStatus.RECLAIMED;
      type = 'RECLAIM';
      break;
    case 0: // PENDING
    case 1: // CONFIRMED
      status = TransactionStatus.PENDING;
      type = 'LOCK';
      break;
    default:
      status = TransactionStatus.CANCELED;
      type = 'LOCK';
  }
  
  return {
    id: vaultData.transactionDigest || vaultData.id,
    type,
    status,
    date: new Date(parseInt(vaultData.timestamp || vaultData.createdAt)).toISOString(),
    details: `Escrow vault: ${contractService.mistToSui(vaultData.amount)} SUI`,
    escrowId: vaultData.id
  };
}

// Get user's assets from blockchain
export const getMyAssets = async (address: string): Promise<Asset[]> => {
  try {
    const coinInfo = await contractService.getUserCoins(address, COIN_TYPES.SUI);
    return [
      {
        id: 'sui',
        name: 'Sui',
        symbol: 'SUI',
        balance: parseFloat(coinInfo.formattedBalance),
        iconUrl: '/sui.png'
      }
    ];
  } catch (error) {
    console.error('Error fetching user assets:', error);
    return [];
  }
};

// Get user's escrows from blockchain
export const getMyEscrows = async (userAddress: string): Promise<Escrow[]> => {
  try {
    const vaults = await contractService.getUserVaults(userAddress);
    return vaults.map(vault => contractVaultToEscrow(vault, userAddress));
  } catch (error) {
    console.error('Error fetching user escrows:', error);
    return [];
  }
};

// Get specific escrow by ID
export const getEscrowById = async (id: string): Promise<Escrow | null> => {
  try {
    const vaultInfo = await contractService.getVaultInfo(id);
    if (!vaultInfo) return null;
    
    // We need userAddress to determine perspective, for now use creator
    return contractVaultToEscrow(vaultInfo, vaultInfo.creator);
  } catch (error) {
    console.error('Error fetching escrow by ID:', error);
    return null;
  }
};

// Get transaction history from blockchain
export const getTransactionHistory = async (address: string): Promise<Transaction[]> => {
  try {
    const vaults = await contractService.getUserVaults(address);
    return vaults.map(vault => contractVaultToTransaction(vault));
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    return [];
  }
};

// Get trending tokens (mock data for now)
export const getTrendingTokens = async (): Promise<{ symbol: string; iconUrl: string }[]> => {
  // This would typically come from an API or indexer
  return [
    { symbol: 'SUI', iconUrl: '/sui.png' },
    { symbol: 'USDC', iconUrl: '/usdc.png' },
    { symbol: 'ETH', iconUrl: '/eth.png' },
  ];
};

// These functions are handled by contractService directly
export const lockAssetInEscrow = contractService.createVault.bind(contractService);
export const confirmSwap = contractService.confirmVault.bind(contractService);
export const reclaimAsset = contractService.cancelVault.bind(contractService);
export const releaseAsset = contractService.releaseFunds.bind(contractService);