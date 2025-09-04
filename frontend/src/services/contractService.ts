import { SuiClient, SuiTransactionBlockResponse } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { SignAndExecuteTransactionMethod } from '@mysten/dapp-kit';
import { CONTRACT_CONFIG, CONTRACT_MODULES, CONTRACT_FUNCTIONS, COIN_TYPES } from '../config/contracts';

export class ContractService {
  private client: SuiClient;

  constructor() {
    this.client = new SuiClient({ url: CONTRACT_CONFIG.RPC_URL });
  }

  // Create a new escrow with the deployed contract
  async createVault(
    signAndExecute: SignAndExecuteTransactionMethod,
    amount: string, // Amount in MIST (1 SUI = 1e9 MIST)
    counterparty: string,
    expiryTime: number,
    description: string,
    arbitrator?: string
  ): Promise<SuiTransactionBlockResponse> {
    const tx = new Transaction();
    
    // Convert amount to proper format
    const amountInMist = parseInt(amount);
    
    // Use tx.splitCoins properly for the escrow contract
    const coinForEscrow = tx.splitCoins(tx.gas, [tx.pure.u64(amountInMist)]);
    
    // Create the escrow using the deployed contract structure
    // Let's try with simpler arguments that match common escrow patterns
    tx.moveCall({
      target: `${CONTRACT_CONFIG.PACKAGE_ID}::${CONTRACT_MODULES.ESCROW_SWAP}::${CONTRACT_FUNCTIONS.CREATE}`,
      arguments: [
        coinForEscrow,
        tx.pure.address(counterparty),
        tx.pure.string(description),
        tx.pure.u64(expiryTime),
        tx.pure.address('0x0'), // Try with a simple address instead of option
      ],
      typeArguments: [COIN_TYPES.SUI],
    });

    // Set gas budget
    tx.setGasBudget(CONTRACT_CONFIG.GAS_BUDGET);

    const result = await signAndExecute({
      transaction: tx,
    });

    return result;
  }

  // Swap/confirm escrow by counterparty
  async confirmVault(
    signAndExecute: SignAndExecuteTransactionMethod,
    vaultId: string
  ): Promise<SuiTransactionBlockResponse> {
    const tx = new Transaction();

    tx.moveCall({
      target: `${CONTRACT_CONFIG.PACKAGE_ID}::${CONTRACT_MODULES.ESCROW_SWAP}::${CONTRACT_FUNCTIONS.SWAP}`,
      arguments: [
        tx.object(vaultId),
      ],
      typeArguments: [COIN_TYPES.SUI],
    });

    tx.setGasBudget(CONTRACT_CONFIG.GAS_BUDGET);

    const result = await signAndExecute({
      transaction: tx,
    });

    return result;
  }

  // Release funds from vault to counterparty
  async releaseFunds(
    signAndExecute: SignAndExecuteTransactionMethod,
    vaultId: string
  ): Promise<SuiTransactionBlockResponse> {
    // For the escrow_swap contract, release funds is the same as swap
    return this.confirmVault(signAndExecute, vaultId);
  }

  // Cancel vault and reclaim funds
  async cancelVault(
    signAndExecute: SignAndExecuteTransactionMethod,
    vaultId: string
  ): Promise<SuiTransactionBlockResponse> {
    const tx = new Transaction();

    tx.moveCall({
      target: `${CONTRACT_CONFIG.PACKAGE_ID}::${CONTRACT_MODULES.ESCROW_SWAP}::${CONTRACT_FUNCTIONS.RETURN_TO_SENDER}`,
      arguments: [
        tx.object(vaultId),
      ],
      typeArguments: [COIN_TYPES.SUI],
    });

    tx.setGasBudget(CONTRACT_CONFIG.GAS_BUDGET);

    const result = await signAndExecute({
      transaction: tx,
    });

    return result;
  }

  // Get vault information
  async getVaultInfo(vaultId: string) {
    try {
      const object = await this.client.getObject({
        id: vaultId,
        options: {
          showContent: true,
          showType: true,
        },
      });

      if (object.data?.content && 'fields' in object.data.content) {
        const fields = object.data.content.fields as any;
        return {
          id: vaultId,
          creator: fields.creator,
          counterparty: fields.counterparty,
          amount: fields.amount,
          state: fields.state,
          expiryTime: fields.expiry_time,
          description: fields.description,
          createdAt: fields.created_at,
          confirmedAt: fields.confirmed_at,
          arbitrator: fields.arbitrator,
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching vault info:', error);
      return null;
    }
  }

  // Get user's coins
  async getUserCoins(address: string, coinType: string = COIN_TYPES.SUI) {
    try {
      const coins = await this.client.getCoins({
        owner: address,
        coinType,
      });
      
      const totalBalance = coins.data.reduce((sum, coin) => sum + parseInt(coin.balance), 0);
      
      return {
        coins: coins.data,
        totalBalance,
        formattedBalance: (totalBalance / 1e9).toFixed(4), // Convert MIST to SUI
      };
    } catch (error) {
      console.error('Error fetching user coins:', error);
      return { coins: [], totalBalance: 0, formattedBalance: '0.0000' };
    }
  }

  // Get events for a specific transaction
  async getTransactionEvents(digest: string) {
    try {
      const events = await this.client.queryEvents({
        query: { Transaction: digest },
      });
      return events.data;
    } catch (error) {
      console.error('Error fetching transaction events:', error);
      return [];
    }
  }

  // Get vaults created by or for a user
  async getUserVaults(userAddress: string) {
    try {
      // Query for VaultCreated events where user is creator or counterparty
      const createdEvents = await this.client.queryEvents({
        query: {
          MoveEventType: `${CONTRACT_CONFIG.PACKAGE_ID}::${CONTRACT_MODULES.ESCROW_VAULT}::VaultCreated`,
        },
      });

      const userVaults = [];
      
      for (const event of createdEvents.data) {
        if (event.parsedJson) {
          const eventData = event.parsedJson as any;
          if (eventData.creator === userAddress || eventData.counterparty === userAddress) {
            const vaultInfo = await this.getVaultInfo(eventData.vault_id);
            if (vaultInfo) {
              userVaults.push({
                ...vaultInfo,
                transactionDigest: event.id.txDigest,
                timestamp: event.timestampMs,
              });
            }
          }
        }
      }

      return userVaults;
    } catch (error) {
      console.error('Error fetching user vaults:', error);
      return [];
    }
  }

  // Convert MIST to SUI for display
  mistToSui(mist: string | number): string {
    const mistValue = typeof mist === 'string' ? parseInt(mist) : mist;
    return (mistValue / 1e9).toFixed(4);
  }

  // Convert SUI to MIST for transactions
  suiToMist(sui: string | number): string {
    const suiValue = typeof sui === 'string' ? parseFloat(sui) : sui;
    return Math.floor(suiValue * 1e9).toString();
  }

  // Initiate dispute for a vault
  async disputeVault(
    signAndExecute: SignAndExecuteTransactionMethod,
    vaultId: string
  ): Promise<SuiTransactionBlockResponse> {
    const tx = new Transaction();

    tx.moveCall({
      target: `${CONTRACT_CONFIG.PACKAGE_ID}::${CONTRACT_MODULES.ESCROW_VAULT}::dispute_vault`,
      arguments: [
        tx.object(vaultId),
        tx.object('0x6'), // Clock object
      ],
      typeArguments: [COIN_TYPES.SUI],
    });

    tx.setGasBudget(CONTRACT_CONFIG.GAS_BUDGET);

    const result = await signAndExecute({
      transaction: tx,
    });

    return result;
  }

  // Resolve dispute (arbitrator only)
  async resolveDispute(
    signAndExecute: SignAndExecuteTransactionMethod,
    vaultId: string,
    releaseToCounterparty: boolean
  ): Promise<SuiTransactionBlockResponse> {
    const tx = new Transaction();

    tx.moveCall({
      target: `${CONTRACT_CONFIG.PACKAGE_ID}::${CONTRACT_MODULES.ESCROW_VAULT}::resolve_dispute`,
      arguments: [
        tx.object(vaultId),
        tx.pure.bool(releaseToCounterparty),
        tx.object('0x6'), // Clock object
      ],
      typeArguments: [COIN_TYPES.SUI],
    });

    tx.setGasBudget(CONTRACT_CONFIG.GAS_BUDGET);

    const result = await signAndExecute({
      transaction: tx,
    });

    return result;
  }
}

// Export a singleton instance
export const contractService = new ContractService();