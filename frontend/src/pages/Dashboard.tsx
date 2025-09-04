
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
// FIX: The `useWallet` hook from `@mysten/dapp-kit` is deprecated. Updated to use `useCurrentWallet` and `useCurrentAccount`.
import { useCurrentWallet, useCurrentAccount } from '@mysten/dapp-kit';
import GlassCard from '../components/GlassCard';
import TrendingTicker from '../components/TrendingTicker';
import FeatureSpotlight from '../components/FeatureSpotlight';
import { Lock, ArrowLeftRight, History, CheckCircle, Clock, XCircle, RefreshCw, ChevronRight } from 'lucide-react';
import { TransactionStatus } from '../types';
import { getTransactionHistory } from '../services/escrowService';

const statusIcons: { [key in TransactionStatus]: React.ElementType } = {
    [TransactionStatus.COMPLETED]: CheckCircle,
    [TransactionStatus.PENDING]: Clock,
    [TransactionStatus.CANCELED]: XCircle,
    [TransactionStatus.RECLAIMED]: RefreshCw,
};

const statusColors: { [key in TransactionStatus]: string } = {
    [TransactionStatus.COMPLETED]: 'text-green-400',
    [TransactionStatus.PENDING]: 'text-yellow-400',
    [TransactionStatus.CANCELED]: 'text-red-400',
    [TransactionStatus.RECLAIMED]: 'text-blue-400',
};

const LoadingSkeleton: React.FC<{ className?: string }> = ({ className }) => <div className={`bg-white/5 rounded-md animate-pulse ${className}`} />;

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    // FIX: The `useWallet` hook is deprecated. Replaced with `useCurrentWallet` and `useCurrentAccount`.
    const { connectionStatus: status } = useCurrentWallet();
    const currentAccount = useCurrentAccount();
    const isConnected = status === 'connected';
    const address = currentAccount?.address;

    const { data: recentTransactions, isLoading: isLoadingTx, isError: isErrorTx } = useQuery({
        queryKey: ['transactions', address, 'recent'],
        queryFn: () => getTransactionHistory(address!),
        enabled: isConnected && !!address,
        select: (data) => Array.isArray(data) ? data.slice(0, 5) : [] // Get only the first 5 for the dashboard
    });


    const quickActions = [
        { 
            title: 'Lock Asset', 
            description: 'Create a new secure escrow.', 
            icon: Lock, 
            path: '/lock' 
        },
        { 
            title: 'My Escrows', 
            description: 'View and manage your escrows.', 
            icon: ArrowLeftRight, 
            path: '/escrows' 
        },
        { 
            title: 'Transaction History', 
            description: 'See all your past activity.', 
            icon: History, 
            path: '/history' 
        },
    ];
    
    const renderTransactionList = () => {
        if (!isConnected) {
            return (
                <div className="flex items-center justify-center h-48">
                    <p className="text-gray-400 text-center text-sm">Connect your wallet to see recent activity.</p>
                </div>
            );
        }
        if (isLoadingTx) {
            return <div className="space-y-3">{Array.from({length: 5}).map((_, i) => <LoadingSkeleton key={i} className="h-16 w-full"/>)}</div>;
        }
        if (isErrorTx) {
             return (
                <div className="flex items-center justify-center h-48">
                    <p className="text-red-400 text-center text-sm">Failed to load recent activity.</p>
                </div>
            );
        }
        if (recentTransactions?.length === 0) {
             return (
                 <div className="flex items-center justify-center h-48">
                    <p className="text-gray-400 text-center text-sm">No recent transactions found.</p>
                 </div>
            );
        }
         return (
            <ul className="space-y-2">
            {recentTransactions?.map((tx) => {
                const Icon = statusIcons[tx.status];
                const color = statusColors[tx.status];
                const isClickable = !!tx.escrowId;
                return (
                    <li 
                        key={tx.id} 
                        onClick={isClickable ? () => navigate(`/escrows/${tx.escrowId}`) : undefined} 
                        className={`flex items-center justify-between p-3 rounded-lg ${ isClickable ? 'cursor-pointer transition-colors duration-200 hover:bg-white/10' : '' }`}
                    >
                        <div className="flex items-center gap-4">
                            <Icon className={`w-6 h-6 ${color} flex-shrink-0`} />
                            <div>
                                <p className="font-medium text-white text-sm">{tx.details}</p>
                                <p className="text-xs text-gray-400">{new Date(tx.date).toLocaleDateString()}</p>
                            </div>
                        </div>
                        {isClickable && <ChevronRight className="w-5 h-5 text-gray-500" />}
                    </li>
                );
            })}
        </ul>
        );
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                <p className="text-gray-400 mt-1">Manage your Esca activity and view recent transactions.</p>
            </div>

            <TrendingTicker />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Left Column */}
                <div className="space-y-8">
                    <GlassCard className="p-4 sm:p-6">
                        <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
                        <div className="space-y-3">
                            {quickActions.map(action => (
                                <button 
                                    key={action.path} 
                                    onClick={() => navigate(action.path)} 
                                    className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-white/10 transition-colors text-left"
                                >
                                    <action.icon className="w-7 h-7 text-pink-400 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold text-white">{action.title}</p>
                                        <p className="text-sm text-gray-400">{action.description}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </GlassCard>
                    <FeatureSpotlight />
                </div>

                {/* Right Column */}
                <GlassCard className="p-4 sm:p-6">
                    <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
                    {renderTransactionList()}
                </GlassCard>
            </div>
        </div>
    );
};

export default Dashboard;
