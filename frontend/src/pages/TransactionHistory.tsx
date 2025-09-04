
import React from 'react';
import { useQuery } from '@tanstack/react-query';
// FIX: The `useWallet` hook from `@mysten/dapp-kit` is deprecated. Updated to use `useCurrentWallet` and `useCurrentAccount`.
import { useCurrentWallet, useCurrentAccount } from '@mysten/dapp-kit';
import { getTransactionHistory } from '../services/escrowService';
import { Transaction, TransactionStatus } from '../types';
import GlassCard from '../components/GlassCard';
import { CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react';

const statusMap = {
    [TransactionStatus.COMPLETED]: {
        icon: CheckCircle,
        color: 'text-green-400 bg-green-500/10',
        label: 'Completed'
    },
    [TransactionStatus.PENDING]: {
        icon: Clock,
        color: 'text-yellow-400 bg-yellow-500/10',
        label: 'Pending'
    },
    [TransactionStatus.CANCELED]: {
        icon: XCircle,
        color: 'text-red-400 bg-red-500/10',
        label: 'Canceled'
    },
    [TransactionStatus.RECLAIMED]: {
        icon: RefreshCw,
        color: 'text-blue-400 bg-blue-500/10',
        label: 'Reclaimed'
    }
};

const typeMap: { [key in Transaction['type']]: { color: string } } = {
    'SWAP':    { color: 'bg-blue-500/20 text-blue-300 border border-blue-500/30' },
    'LOCK':    { color: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' },
    'RECLAIM': { color: 'bg-purple-500/20 text-purple-300 border border-purple-500/30' },
};

const TransactionHistory: React.FC = () => {
    // FIX: The `useWallet` hook is deprecated. Replaced with `useCurrentWallet` and `useCurrentAccount`.
    const { connectionStatus: status } = useCurrentWallet();
    const currentAccount = useCurrentAccount();
    const isConnected = status === 'connected';
    const address = currentAccount?.address;
    
    const { data: transactions, isLoading, isError } = useQuery({
        queryKey: ['transactions', address, 'all'],
        queryFn: () => getTransactionHistory(address!),
        enabled: isConnected && !!address,
    });
    
    const renderContent = () => {
        if (!isConnected) {
             return (
                <GlassCard className="p-8 text-center">
                    <h2 className="text-xl font-semibold text-white">Connect Your Wallet</h2>
                    <p className="text-gray-400 mt-2">Please connect your wallet to view your transaction history.</p>
                </GlassCard>
            );
        }
        
        if (isLoading) {
             return (
                <div className="flex justify-center items-center h-60">
                    <div className="w-8 h-8 border-4 border-pink-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
            );
        }

        if (isError) {
             return (
                <GlassCard className="p-8 text-center">
                    <h2 className="text-xl font-semibold text-red-400">Error Loading Transactions</h2>
                    <p className="text-gray-400 mt-2">Could not fetch your transaction history. Please try again later.</p>
                </GlassCard>
            );
        }
        
        if (transactions && transactions.length > 0) {
            return (
                <GlassCard>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-800">
                            <thead className="bg-black/40">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Transaction</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {transactions.map(tx => {
                                    const { icon: Icon, color, label } = statusMap[tx.status];
                                    return (
                                        <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center flex-wrap gap-x-3 gap-y-1">
                                                    <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${typeMap[tx.type].color}`}>
                                                        {tx.type}
                                                    </span>
                                                    <span className="text-sm font-medium text-white">{tx.details}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{new Date(tx.date).toLocaleString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${color}`}>
                                                    <Icon className="w-4 h-4 mr-1.5" />
                                                    {label}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </GlassCard>
            );
        }
        
        return (
            <GlassCard className="p-8 text-center">
                <h2 className="text-xl font-semibold text-white">No Transactions Yet</h2>
                <p className="text-gray-400 mt-2">Your transaction history will appear here once you start using Esca.</p>
            </GlassCard>
        );
    };


    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-6">Transaction History</h1>
            {renderContent()}
        </div>
    );
};

export default TransactionHistory;
