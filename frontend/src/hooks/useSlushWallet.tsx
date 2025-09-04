import { useCurrentAccount, useCurrentWallet, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { contractService } from '../services/contractService';
import { useState } from 'react';

export const useEscaWallet = () => {
  const currentAccount = useCurrentAccount();
  const { connectionStatus } = useCurrentWallet();
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConnected = connectionStatus === 'connected' && !!currentAccount;
  const address = currentAccount?.address;

  const createVault = async (
    amount: string,
    counterparty: string,
    expiryTime: number,
    description: string,
    arbitrator?: string
  ) => {
    if (!isConnected) throw new Error('Wallet not connected');
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await contractService.createVault(
        signAndExecuteTransaction,
        amount,
        counterparty,
        expiryTime,
        description,
        arbitrator
      );
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const confirmVault = async (vaultId: string) => {
    if (!isConnected) throw new Error('Wallet not connected');
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await contractService.confirmVault(
        signAndExecuteTransaction,
        vaultId
      );
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const releaseFunds = async (vaultId: string) => {
    if (!isConnected) throw new Error('Wallet not connected');
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await contractService.releaseFunds(
        signAndExecuteTransaction,
        vaultId
      );
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const cancelVault = async (vaultId: string) => {
    if (!isConnected) throw new Error('Wallet not connected');
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await contractService.cancelVault(
        signAndExecuteTransaction,
        vaultId
      );
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getUserBalance = async () => {
    if (!address) return null;
    
    try {
      const coinInfo = await contractService.getUserCoins(address);
      return coinInfo;
    } catch (err) {
      console.error('Error fetching balance:', err);
      return null;
    }
  };

  return {
    // Wallet state
    isConnected,
    address,
    connectionStatus,
    
    // Transaction state
    isLoading,
    error,
    
    // Actions
    createVault,
    confirmVault,
    releaseFunds,
    cancelVault,
    getUserBalance,
    
    // Utils
    clearError: () => setError(null),
  };
};

// Legacy export for backward compatibility
export default useEscaWallet;