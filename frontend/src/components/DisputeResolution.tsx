import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { contractService } from '../services/contractService';
import GlassCard from './GlassCard';
import SuccessModal from './SuccessModal';
import { AlertTriangle, Scale, CheckCircle, XCircle } from 'lucide-react';

interface DisputeResolutionProps {
  vaultId: string;
  vaultInfo: any;
  userAddress?: string;
  onDisputeResolved?: () => void;
}

const DisputeResolution: React.FC<DisputeResolutionProps> = ({
  vaultId,
  vaultInfo,
  userAddress,
  onDisputeResolved
}) => {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const queryClient = useQueryClient();
  const [modalInfo, setModalInfo] = useState({ isOpen: false, title: '', message: '' });
  
  const isArbitrator = vaultInfo?.arbitrator === userAddress;
  const canInitiateDispute = (vaultInfo?.creator === userAddress || vaultInfo?.counterparty === userAddress) 
    && vaultInfo?.state === 1; // CONFIRMED state
  const isDisputed = vaultInfo?.state === 3; // DISPUTED state

  const disputeMutation = useMutation({
    mutationFn: () => contractService.disputeVault(signAndExecute, vaultId),
    onSuccess: () => {
      setModalInfo({ 
        isOpen: true, 
        title: 'Dispute Initiated', 
        message: 'The dispute has been initiated. The arbitrator will review and resolve this case.' 
      });
      queryClient.invalidateQueries({ queryKey: ['vaultInfo', vaultId] });
      onDisputeResolved?.();
    },
    onError: (error: any) => {
      setModalInfo({ 
        isOpen: true, 
        title: 'Dispute Failed', 
        message: error.message || 'Failed to initiate dispute. Please try again.' 
      });
    }
  });

  const resolveDisputeMutation = useMutation({
    mutationFn: (releaseToCounterparty: boolean) => 
      contractService.resolveDispute(signAndExecute, vaultId, releaseToCounterparty),
    onSuccess: () => {
      setModalInfo({ 
        isOpen: true, 
        title: 'Dispute Resolved', 
        message: 'The dispute has been successfully resolved by the arbitrator.' 
      });
      queryClient.invalidateQueries({ queryKey: ['vaultInfo', vaultId] });
      onDisputeResolved?.();
    },
    onError: (error: any) => {
      setModalInfo({ 
        isOpen: true, 
        title: 'Resolution Failed', 
        message: error.message || 'Failed to resolve dispute. Please try again.' 
      });
    }
  });

  const isProcessing = disputeMutation.isPending || resolveDisputeMutation.isPending;

  if (!vaultInfo?.arbitrator) {
    return null; // No arbitrator set for this vault
  }

  return (
    <>
      <GlassCard className="p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Scale className="w-6 h-6 text-yellow-400" />
          Dispute Resolution
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-300 mb-2">
                This vault has an arbitrator assigned for dispute resolution.
              </p>
              <p className="text-xs text-gray-400 font-mono break-all">
                Arbitrator: {vaultInfo.arbitrator}
                {isArbitrator && <span className="text-pink-400 ml-2">(You)</span>}
              </p>
            </div>
          </div>

          {/* Current vault state indicator */}
          {isDisputed && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-semibold">Vault is Currently Disputed</span>
              </div>
              <p className="text-sm text-gray-300 mt-1">
                Waiting for arbitrator to resolve the dispute.
              </p>
            </div>
          )}

          {/* Actions based on user role */}
          {canInitiateDispute && !isDisputed && (
            <div className="border-t border-gray-700 pt-4">
              <p className="text-sm text-gray-300 mb-3">
                If there's an issue with this vault, you can initiate a dispute for the arbitrator to review.
              </p>
              <button
                onClick={() => disputeMutation.mutate()}
                disabled={isProcessing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-600/80 hover:bg-yellow-500/80 border border-yellow-500 text-white font-medium transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:scale-100"
              >
                {disputeMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <AlertTriangle size={16} />
                )}
                <span>Initiate Dispute</span>
              </button>
            </div>
          )}

          {isArbitrator && isDisputed && (
            <div className="border-t border-gray-700 pt-4">
              <p className="text-sm text-gray-300 mb-4">
                As the arbitrator, you can resolve this dispute by deciding whether to release funds to the counterparty or return them to the creator.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => resolveDisputeMutation.mutate(true)}
                  disabled={isProcessing}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-green-600 hover:bg-green-500 border border-green-500 text-white font-medium transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:scale-100"
                >
                  {resolveDisputeMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <CheckCircle size={16} />
                  )}
                  <span>Release to Counterparty</span>
                </button>
                
                <button
                  onClick={() => resolveDisputeMutation.mutate(false)}
                  disabled={isProcessing}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-600 hover:bg-red-500 border border-red-500 text-white font-medium transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:scale-100"
                >
                  {resolveDisputeMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <XCircle size={16} />
                  )}
                  <span>Return to Creator</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      <SuccessModal
        isOpen={modalInfo.isOpen}
        onClose={() => setModalInfo({ isOpen: false, title: '', message: '' })}
        title={modalInfo.title}
        message={modalInfo.message}
      />
    </>
  );
};

export default DisputeResolution;