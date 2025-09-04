import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentWallet, useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { EscrowParty, EscrowPartyStatus } from '../types';
import { getEscrowById } from '../services/escrowService';
import { contractService } from '../services/contractService';
import GlassCard from '../components/GlassCard';
import SuccessModal from '../components/SuccessModal';
import DisputeResolution from '../components/DisputeResolution';
import { Lock, Hourglass, ArrowLeftRight, RotateCcw, CheckCircle, AlertTriangle, Clock, User, FileText } from 'lucide-react';

const PartyStatusCard: React.FC<{ party: EscrowParty, title: string }> = ({ party, title }) => {
    const isLocked = party.status === EscrowPartyStatus.LOCKED;
    return (
        <GlassCard className={`p-6 border-2 ${isLocked ? 'border-green-500/50' : 'border-yellow-500/50'}`}>
            <h3 className="text-lg font-semibold text-gray-300">{title}</h3>
            <div className="flex items-center gap-4 my-3">
                <img src={party.asset.iconUrl} alt={party.asset.name} className="w-10 h-10 rounded-full bg-gray-800" />
                <div>
                    <p className="text-2xl font-bold text-white">{party.amount} {party.asset.symbol}</p>
                    <p className="text-sm text-gray-400">{party.asset.name}</p>
                </div>
            </div>
            <p className="text-sm text-gray-400 font-mono break-all mb-4">{party.address}</p>
            <div className={`flex items-center gap-2 text-sm font-medium ${isLocked ? 'text-green-400' : 'text-yellow-400'}`}>
                {isLocked ? <Lock size={16}/> : <Hourglass size={16} />}
                <span>Status: {party.status}</span>
            </div>
        </GlassCard>
    );
};

const SwapStatus: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { connectionStatus } = useCurrentWallet();
    const currentAccount = useCurrentAccount();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();
    const [modalInfo, setModalInfo] = useState({ isOpen: false, title: '', message: '' });
    
    const isConnected = connectionStatus === 'connected';
    const userAddress = currentAccount?.address;

    // Get vault information from smart contract
    const { data: vaultInfo, isLoading: isLoadingVault } = useQuery({
        queryKey: ['vaultInfo', id],
        queryFn: () => contractService.getVaultInfo(id!),
        enabled: !!id,
        refetchInterval: 5000, // Refresh every 5 seconds
    });
    
    const { data: escrow, isLoading, isError } = useQuery({
        queryKey: ['escrow', id],
        queryFn: () => getEscrowById(id!),
        enabled: !!id,
    });
    
    const confirmMutation = useMutation({
        mutationFn: () => contractService.confirmVault(signAndExecute, id!),
        onSuccess: () => {
            setModalInfo({ isOpen: true, title: 'Vault Confirmed!', message: 'You have successfully confirmed the vault. The creator can now release the funds.' });
            queryClient.invalidateQueries({ queryKey: ['vaultInfo', id] });
            queryClient.invalidateQueries({ queryKey: ['escrow', id] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
        },
        onError: (error: any) => {
            setModalInfo({ isOpen: true, title: 'Confirmation Failed', message: error.message || 'Failed to confirm vault. Please try again.' });
        }
    });

    const releaseMutation = useMutation({
        mutationFn: () => contractService.releaseFunds(signAndExecute, id!),
        onSuccess: () => {
            setModalInfo({ isOpen: true, title: 'Funds Released!', message: 'The funds have been successfully released to the counterparty.' });
            queryClient.invalidateQueries({ queryKey: ['vaultInfo', id] });
            queryClient.invalidateQueries({ queryKey: ['escrow', id] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
        },
        onError: (error: any) => {
            setModalInfo({ isOpen: true, title: 'Release Failed', message: error.message || 'Failed to release funds. Please try again.' });
        }
    });

    const cancelMutation = useMutation({
        mutationFn: () => contractService.cancelVault(signAndExecute, id!),
        onSuccess: () => {
            setModalInfo({ isOpen: true, title: 'Vault Cancelled!', message: 'The vault has been cancelled and your funds have been returned.' });
            queryClient.invalidateQueries({ queryKey: ['vaultInfo', id] });
            queryClient.invalidateQueries({ queryKey: ['escrow', id] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
        },
        onError: (error: any) => {
            setModalInfo({ isOpen: true, title: 'Cancellation Failed', message: error.message || 'Failed to cancel vault. Please try again.' });
        }
    });
    
    const isProcessing = confirmMutation.isPending || releaseMutation.isPending || cancelMutation.isPending;

    // Determine user role and vault state
    const isCreator = vaultInfo && userAddress && vaultInfo.creator === userAddress;
    const isCounterparty = vaultInfo && userAddress && vaultInfo.counterparty === userAddress;
    const canConfirm = isCounterparty && vaultInfo?.state === 0; // PENDING state
    const canRelease = isCreator && vaultInfo?.state === 1; // CONFIRMED state
    const canCancel = isCreator && (vaultInfo?.state === 0 || (vaultInfo?.expiryTime && Date.now() >= vaultInfo.expiryTime));
    
    const getVaultStateInfo = (state: number) => {
        switch (state) {
            case 0: return { label: 'Pending', color: 'text-yellow-400', icon: Clock };
            case 1: return { label: 'Confirmed', color: 'text-blue-400', icon: CheckCircle };
            case 2: return { label: 'Completed', color: 'text-green-400', icon: CheckCircle };
            case 3: return { label: 'Disputed', color: 'text-red-400', icon: AlertTriangle };
            case 4: return { label: 'Cancelled', color: 'text-gray-400', icon: RotateCcw };
            default: return { label: 'Unknown', color: 'text-gray-400', icon: AlertTriangle };
        }
    };

    const closeModal = () => {
        setModalInfo({ isOpen: false, title: '', message: '' });
        navigate('/dashboard');
    }

    if (isLoading || isLoadingVault) {
        return <div className="flex justify-center items-center h-60">
            <div className="w-8 h-8 border-4 border-pink-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
    }
    
    if (isError || !escrow || !vaultInfo) {
        return <GlassCard className="p-8 text-center"><h2 className="text-xl font-semibold text-white">Vault Not Found</h2></GlassCard>;
    }
    
    if (!isConnected) {
        return <GlassCard className="p-8 text-center">
            <h2 className="text-xl font-semibold text-white">Connect Your Wallet</h2>
            <p className="text-gray-400 mt-2">Please connect your wallet to view vault details.</p>
        </GlassCard>;
    }
    
    const stateInfo = getVaultStateInfo(vaultInfo.state);
    const StateIcon = stateInfo.icon;
    
    const formattedTimestamp = vaultInfo.createdAt 
        ? new Date(parseInt(vaultInfo.createdAt)).toLocaleDateString(undefined, {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
          })
        : '';
        
    const isExpired = vaultInfo.expiryTime && Date.now() >= vaultInfo.expiryTime;
    const timeUntilExpiry = vaultInfo.expiryTime ? Math.max(0, vaultInfo.expiryTime - Date.now()) : 0;
    const daysUntilExpiry = Math.floor(timeUntilExpiry / (1000 * 60 * 60 * 24));
    const hoursUntilExpiry = Math.floor((timeUntilExpiry % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white">Vault Details</h1>
                    <p className="text-sm text-gray-400 font-mono mt-1">ID: {id}</p>
                </div>
                <div className="flex items-center gap-2">
                    <StateIcon className={`w-6 h-6 ${stateInfo.color}`} />
                    <span className={`font-semibold ${stateInfo.color}`}>{stateInfo.label}</span>
                </div>
            </div>
            
            {/* Vault Information Panel */}
            <GlassCard className="p-6 mb-6">
                <h2 className="text-xl font-semibold text-white mb-4">Vault Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-400">Creator</p>
                        <p className="font-mono text-white break-all">{vaultInfo.creator}</p>
                        {isCreator && <span className="text-pink-400 text-xs">(You)</span>}
                    </div>
                    <div>
                        <p className="text-sm text-gray-400">Counterparty</p>
                        <p className="font-mono text-white break-all">{vaultInfo.counterparty}</p>
                        {isCounterparty && <span className="text-pink-400 text-xs">(You)</span>}
                    </div>
                    <div>
                        <p className="text-sm text-gray-400">Amount</p>
                        <p className="text-white font-semibold">{contractService.mistToSui(vaultInfo.amount)} SUI</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-400">Created</p>
                        <p className="text-white">{formattedTimestamp}</p>
                    </div>
                    {vaultInfo.description && (
                        <div className="md:col-span-2">
                            <p className="text-sm text-gray-400 flex items-center">
                                <FileText className="w-4 h-4 mr-1" />
                                Description
                            </p>
                            <p className="text-white">{vaultInfo.description}</p>
                        </div>
                    )}
                    {vaultInfo.arbitrator && (
                        <div className="md:col-span-2">
                            <p className="text-sm text-gray-400 flex items-center">
                                <User className="w-4 h-4 mr-1" />
                                Arbitrator
                            </p>
                            <p className="font-mono text-white break-all">{vaultInfo.arbitrator}</p>
                        </div>
                    )}
                    <div className="md:col-span-2">
                        <p className="text-sm text-gray-400">Expiry</p>
                        <div className="flex items-center gap-2">
                            <p className="text-white">
                                {new Date(vaultInfo.expiryTime).toLocaleDateString(undefined, {
                                    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                })}
                            </p>
                            {isExpired ? (
                                <span className="text-red-400 text-xs bg-red-500/20 px-2 py-1 rounded">Expired</span>
                            ) : (
                                <span className="text-yellow-400 text-xs bg-yellow-500/20 px-2 py-1 rounded">
                                    {daysUntilExpiry > 0 ? `${daysUntilExpiry}d ` : ''}{hoursUntilExpiry}h remaining
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </GlassCard>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center mb-8">
                <PartyStatusCard party={escrow.initiator} title="Creator Offering" />
                <PartyStatusCard party={escrow.counterparty} title="Counterparty Will Receive" />
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row gap-4">
                {canConfirm && (
                    <button
                        onClick={() => confirmMutation.mutate()}
                        disabled={isProcessing}
                        className="flex-1 flex justify-center items-center gap-2 px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 border border-blue-500 text-white font-bold transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(59,130,246,0.4)]"
                    >
                        {confirmMutation.isPending ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <CheckCircle size={20} />
                                <span>Confirm Vault</span>
                            </>
                        )}
                    </button>
                )}
                
                {canRelease && (
                    <button
                        onClick={() => releaseMutation.mutate()}
                        disabled={isProcessing}
                        className="flex-1 flex justify-center items-center gap-2 px-4 py-3 rounded-lg bg-green-600 hover:bg-green-500 border border-green-500 text-white font-bold transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(34,197,94,0.4)]"
                    >
                        {releaseMutation.isPending ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <ArrowLeftRight size={20} />
                                <span>Release Funds</span>
                            </>
                        )}
                    </button>
                )}
                
                {canCancel && (
                    <button
                        onClick={() => cancelMutation.mutate()}
                        disabled={isProcessing}
                        className="flex-1 flex justify-center items-center gap-2 px-4 py-3 rounded-lg bg-red-600/80 hover:bg-red-500/80 border border-red-500 text-white font-bold transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:scale-100"
                    >
                        {cancelMutation.isPending ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <RotateCcw size={20} />
                                <span>Cancel Vault</span>
                            </>
                        )}
                    </button>
                )}
            </div>
            
            {(!canConfirm && !canRelease && !canCancel) && (
                <GlassCard className="p-6 text-center">
                    <p className="text-gray-400">
                        {!isCreator && !isCounterparty 
                            ? "You are not a participant in this vault."
                            : "No actions available for the current vault state."
                        }
                    </p>
                </GlassCard>
            )}
            
            {/* Dispute Resolution Section */}
            {vaultInfo.arbitrator && (
                <div className="mt-6">
                    <DisputeResolution 
                        vaultId={id!} 
                        vaultInfo={vaultInfo} 
                        userAddress={userAddress}
                        onDisputeResolved={() => {
                            queryClient.invalidateQueries({ queryKey: ['vaultInfo', id] });
                            queryClient.invalidateQueries({ queryKey: ['escrow', id] });
                        }}
                    />
                </div>
            )}
             <SuccessModal
                isOpen={modalInfo.isOpen}
                onClose={closeModal}
                title={modalInfo.title}
                message={modalInfo.message}
            />
        </>
    );
};

export default SwapStatus;