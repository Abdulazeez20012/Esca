
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { EscrowPartyStatus } from '../types';
import { getMyEscrows } from '../services/escrowService';
// FIX: The `useWallet` hook from `@mysten/dapp-kit` is deprecated. Updated to use `useCurrentWallet` and `useCurrentAccount`.
import { useCurrentWallet, useCurrentAccount } from '@mysten/dapp-kit';
import GlassCard from '../components/GlassCard';
import { ArrowRight, Lock, Hourglass } from 'lucide-react';

const MyEscrows: React.FC = () => {
    const navigate = useNavigate();
    // FIX: The `useWallet` hook is deprecated. Replaced with `useCurrentWallet` and `useCurrentAccount`.
    const { connectionStatus: status } = useCurrentWallet();
    const currentAccount = useCurrentAccount();
    const isConnected = status === 'connected';
    const address = currentAccount?.address;
    
    const { data: escrows, isLoading, isError } = useQuery({
        queryKey: ['escrows', address],
        queryFn: () => getMyEscrows(address!),
        enabled: isConnected && !!address, // Only run the query if connected and address is available
    });

    const StatusIndicator: React.FC<{status: EscrowPartyStatus}> = ({status}) => {
        if (status === EscrowPartyStatus.LOCKED) {
            return <div className="flex items-center gap-1 text-green-400"><Lock size={14} /> Locked</div>;
        }
        return <div className="flex items-center gap-1 text-yellow-400"><Hourglass size={14} /> Waiting</div>;
    }

    if (!isConnected) {
        return (
            <GlassCard className="p-8 text-center">
                <h2 className="text-xl font-semibold text-white">Connect Your Wallet</h2>
                <p className="text-gray-400 mt-2">Please connect your Slush Wallet to view your escrows.</p>
            </GlassCard>
        );
    }
    
    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Escrows</h1>
             {address && (
                 <p className="text-sm text-gray-400 font-mono mb-6">
                    Showing escrows for: <span className="text-pink-400">{address}</span>
                </p>
            )}
            {isLoading ? (
                <div className="flex justify-center items-center h-60">
                    <div className="w-8 h-8 border-4 border-pink-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : isError ? (
                 <GlassCard className="p-8 text-center">
                    <h2 className="text-xl font-semibold text-red-400">Error Loading Escrows</h2>
                    <p className="text-gray-400 mt-2">Could not fetch your escrows. Please try again later.</p>
                </GlassCard>
            ) : escrows && escrows.length > 0 ? (
                <div className="space-y-4">
                    {escrows.map(escrow => {
                        const isInitiator = address?.toLowerCase() === escrow.initiator.address.toLowerCase();
                        const userParty = isInitiator ? escrow.initiator : escrow.counterparty;
                        const counterParty = isInitiator ? escrow.counterparty : escrow.initiator;
                        
                        return (
                            <GlassCard key={escrow.id} onClick={() => navigate(`/escrows/${escrow.id}`)} className="p-4 md:p-6">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-4">
                                            <div>
                                                <p className="text-sm text-gray-400">You Offer</p>
                                                <p className="font-bold text-white">{userParty.amount} {userParty.asset.symbol}</p>
                                            </div>
                                            <StatusIndicator status={userParty.status} />
                                    </div>
                                        <div className="flex items-center gap-4">
                                            <div>
                                                <p className="text-sm text-gray-400">You Receive</p>
                                                <p className="font-bold text-white">{counterParty.amount} {counterParty.asset.symbol}</p>
                                            </div>
                                            <StatusIndicator status={counterParty.status} />
                                    </div>
                                </div>
                                    <div className="flex items-center gap-2 text-pink-400">
                                        <span>View Status</span>
                                        <ArrowRight size={20} />
                                    </div>
                                </div>
                            </GlassCard>
                        );
                    })}
                </div>
            ) : (
                <GlassCard className="p-8 text-center">
                    <h2 className="text-xl font-semibold text-white">No Active Escrows</h2>
                    <p className="text-gray-400 mt-2">You don't have any pending escrows. Create one from the "Lock Asset" page.</p>
                </GlassCard>
            )}
        </div>
    );
};

export default MyEscrows;
