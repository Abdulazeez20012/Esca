
import React, { useState, useEffect } from 'react';
// FIX: The `useWallet` hook from `@mysten/dapp-kit` is deprecated. Updated to use `useCurrentWallet` and `useCurrentAccount`.
import { useCurrentWallet, useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Asset } from '../types';
import { getMyAssets } from '../services/escrowService';
import { contractService } from '../services/contractService';
import GlassCard from '../components/GlassCard';
import SuccessModal from '../components/SuccessModal';
import { Lock, Calendar, User, FileText, AlertCircle } from 'lucide-react';

const LockAsset: React.FC = () => {
    // FIX: The `useWallet` hook is deprecated. Replaced with `useCurrentWallet` and `useCurrentAccount`.
    const { connectionStatus: status } = useCurrentWallet();
    const currentAccount = useCurrentAccount();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();
    const isConnected = status === 'connected';
    const address = currentAccount?.address;
    const queryClient = useQueryClient();

    const [selectedAsset, setSelectedAsset] = useState<string>('');
    const [amount, setAmount] = useState<string>('');
    const [recipient, setRecipient] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [expiryDays, setExpiryDays] = useState<string>('7');
    const [arbitrator, setArbitrator] = useState<string>('');
    const [useArbitrator, setUseArbitrator] = useState<boolean>(false);
    
    const [recipientError, setRecipientError] = useState<string>('');
    const [amountError, setAmountError] = useState<string>('');
    const [arbitratorError, setArbitratorError] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [modalOpen, setModalOpen] = useState(false);
    const [createdVaultId, setCreatedVaultId] = useState<string>('');

    const { data: assets, isLoading: isLoadingAssets } = useQuery({
        queryKey: ['assets', address],
        queryFn: () => getMyAssets(address!),
        enabled: isConnected && !!address,
    });

    useEffect(() => {
        if (assets && assets.length > 0 && !selectedAsset) {
            setSelectedAsset(assets[0].id);
        }
        
        // Validate contract configuration
        const packageId = process.env.NEXT_PUBLIC_ESCROW_PACKAGE_ID;
        if (!packageId || packageId === '0x0') {
            setError('Contract not configured. Please deploy the smart contract first.');
        }
    }, [assets, selectedAsset]);

    const lockMutation = useMutation({
        mutationFn: async ({ amount, recipientAddress, description, expiryTime, arbitratorAddress }: { 
            amount: string, 
            recipientAddress: string, 
            description: string, 
            expiryTime: number, 
            arbitratorAddress?: string 
        }) => {
            const amountInMist = contractService.suiToMist(amount);
            return await contractService.createVault(
                signAndExecute,
                amountInMist,
                recipientAddress,
                expiryTime,
                description,
                arbitratorAddress
            );
        },
        onSuccess: (result) => {
            // Extract vault ID from transaction result - handle undefined cases
            let vaultId = 'unknown';
            try {
                if (result && result.objectChanges && Array.isArray(result.objectChanges)) {
                    for (const change of result.objectChanges) {
                        if (change && change.type === 'created' && (change as any).objectId) {
                            vaultId = (change as any).objectId;
                            break;
                        }
                    }
                } else if (result && result.digest) {
                    vaultId = result.digest;
                }
            } catch (error) {
                console.warn('Error extracting vault ID:', error);
                vaultId = result?.digest || 'transaction-completed';
            }
            
            setCreatedVaultId(vaultId);
            setModalOpen(true);
            setAmount('');
            setRecipient('');
            setDescription('');
            setArbitrator('');
            setUseArbitrator(false);
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['escrows'] });
        },
        onError: (err: any) => {
            console.error('Transaction failed:', err);
            let errorMessage = 'An error occurred during the transaction.';
            
            if (err.message) {
                if (err.message.includes('Package object does not exist')) {
                    errorMessage = 'Smart contract not found. Please check if the contract is deployed correctly.';
                } else if (err.message.includes('Insufficient gas') || err.message.includes('No valid gas coins')) {
                    errorMessage = 'Insufficient SUI for transaction. Please ensure you have enough SUI in your wallet (need both for escrow amount + gas fees).';
                } else if (err.message.includes('Invalid package ID')) {
                    errorMessage = 'Invalid contract address. Please check the configuration.';
                } else if (err.message.includes('No valid gas coins found')) {
                    errorMessage = 'No valid gas coins found. Please ensure your wallet has sufficient SUI balance.';
                } else {
                    errorMessage = err.message;
                }
            }
            
            setError(errorMessage);
        }
    });

    const handleArbitratorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setArbitrator(value);
        if (useArbitrator && value && (!value.startsWith('0x') || value.length < 4 || value.length > 66)) {
            setArbitratorError("A valid address should start with '0x' and have a reasonable length.");
        } else {
            setArbitratorError('');
        }
    };

    const handleRecipientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setRecipient(value);
        if (value && (!value.startsWith('0x') || value.length < 4 || value.length > 66)) {
            setRecipientError("A valid address should start with '0x' and have a reasonable length.");
        } else {
            setRecipientError('');
        }
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setAmount(value);
        setError(''); // Clear global form error on input change

        if (!value) {
            setAmountError('Amount is required.');
            return;
        }

        const numericValue = parseFloat(value);
        if (isNaN(numericValue) || numericValue <= 0) {
            setAmountError('Amount must be a positive number.');
            return;
        }

        const asset = assets?.find(a => a.id === selectedAsset);
        if (asset && numericValue > asset.balance) {
            setAmountError(`Amount exceeds your balance of ${asset.balance}.`);
            return;
        }

        setAmountError(''); // Clear error if all checks pass
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (recipientError || amountError || (useArbitrator && arbitratorError)) return;

        if (!selectedAsset || !amount || !recipient || !description) {
            setError('Asset, amount, recipient, and description are required.');
            return;
        }
        
        const asset = assets?.find(a => a.id === selectedAsset);
        if (!asset) {
            setError('Selected asset not found.');
            return;
        }

        // Calculate expiry time (current time + selected days)
        const expiryTime = Date.now() + (parseInt(expiryDays) * 24 * 60 * 60 * 1000);
        
        lockMutation.mutate({ 
            amount, 
            recipientAddress: recipient, 
            description,
            expiryTime,
            arbitratorAddress: useArbitrator && arbitrator ? arbitrator : undefined
        });
    };
    
    if (!isConnected) {
        return (
            <GlassCard className="p-8 text-center">
                <h2 className="text-xl font-semibold text-white">Connect Your Wallet</h2>
                <p className="text-gray-400 mt-2">Please connect your Slush Wallet to lock assets.</p>
            </GlassCard>
        );
    }
    
    if (isLoadingAssets) {
        return <div className="flex justify-center items-center h-40">
                    <div className="w-8 h-8 border-4 border-pink-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
    }

    return (
        <>
            <GlassCard className="p-8">
                <h1 className="text-3xl font-bold text-white mb-6">Lock Asset in Escrow</h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="asset" className="block text-sm font-medium text-gray-300">Select Asset</label>
                        <select
                            id="asset"
                            value={selectedAsset}
                            onChange={(e) => setSelectedAsset(e.target.value)}
                            className="mt-1 block w-full bg-black/30 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                        >
                            {assets?.map(asset => (
                                <option key={asset.id} value={asset.id}>
                                    {asset.name} ({asset.symbol}) - Balance: {asset.balance}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-300">Amount</label>
                        <input
                            type="number"
                            id="amount"
                            value={amount}
                            onChange={handleAmountChange}
                            className={`mt-1 block w-full bg-black/30 border ${amountError ? 'border-red-500' : 'border-gray-700'} rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-pink-500 focus:border-pink-500`}
                            placeholder="0.0"
                            aria-invalid={!!amountError}
                            aria-describedby="amount-error"
                        />
                         {amountError && <p id="amount-error" className="text-red-400 text-xs mt-1">{amountError}</p>}
                    </div>
                    <div>
                        <label htmlFor="recipient" className="block text-sm font-medium text-gray-300">Recipient Address</label>
                        <input
                            type="text"
                            id="recipient"
                            value={recipient}
                            onChange={handleRecipientChange}
                            className={`mt-1 block w-full bg-black/30 border ${recipientError ? 'border-red-500' : 'border-gray-700'} rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-pink-500 focus:border-pink-500`}
                            placeholder="0x..."
                            aria-invalid={!!recipientError}
                            aria-describedby="recipient-error"
                        />
                        {recipientError && <p id="recipient-error" className="text-red-400 text-xs mt-1">{recipientError}</p>}
                    </div>
                    
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-300">
                            <FileText className="inline w-4 h-4 mr-1" />
                            Description
                        </label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="mt-1 block w-full bg-black/30 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                            placeholder="Describe the purpose of this escrow (e.g., Payment for freelance work)"
                            rows={3}
                            required
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="expiryDays" className="block text-sm font-medium text-gray-300">
                            <Calendar className="inline w-4 h-4 mr-1" />
                            Expiry Time
                        </label>
                        <select
                            id="expiryDays"
                            value={expiryDays}
                            onChange={(e) => setExpiryDays(e.target.value)}
                            className="mt-1 block w-full bg-black/30 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                        >
                            <option value="1">1 Day</option>
                            <option value="3">3 Days</option>
                            <option value="7">7 Days (Recommended)</option>
                            <option value="14">14 Days</option>
                            <option value="30">30 Days</option>
                        </select>
                        <p className="text-gray-500 text-xs mt-1">Escrow will auto-cancel after this time if not confirmed</p>
                    </div>
                    
                    <div className="border border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                            <label className="flex items-center text-sm font-medium text-gray-300">
                                <User className="w-4 h-4 mr-1" />
                                Use Arbitrator (Optional)
                            </label>
                            <button
                                type="button"
                                onClick={() => setUseArbitrator(!useArbitrator)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 ${
                                    useArbitrator ? 'bg-pink-600' : 'bg-gray-600'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        useArbitrator ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>
                        {useArbitrator && (
                            <div>
                                <input
                                    type="text"
                                    value={arbitrator}
                                    onChange={handleArbitratorChange}
                                    className={`block w-full bg-black/30 border ${arbitratorError ? 'border-red-500' : 'border-gray-700'} rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-pink-500 focus:border-pink-500`}
                                    placeholder="0x... (Arbitrator address)"
                                    aria-invalid={!!arbitratorError}
                                />
                                {arbitratorError && <p className="text-red-400 text-xs mt-1">{arbitratorError}</p>}
                                <div className="flex items-start mt-2">
                                    <AlertCircle className="w-4 h-4 text-yellow-400 mr-2 mt-0.5 flex-shrink-0" />
                                    <p className="text-yellow-400 text-xs">
                                        An arbitrator can resolve disputes between parties. Only use trusted addresses.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    <div>
                        <button
                            type="submit"
                            disabled={lockMutation.isPending || !!recipientError || !!amountError || (useArbitrator && !!arbitratorError) || !amount || !description}
                            className="w-full flex justify-center items-center gap-2 px-4 py-3 rounded-lg bg-pink-600 hover:bg-pink-500 border border-pink-500 text-white font-bold transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(219,39,119,0.4)]"
                        >
                            {lockMutation.isPending ? (
                                <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>Creating Vault...</span></>
                            ) : (
                                <><Lock size={20} /><span>Create Escrow Vault</span></>
                            )}
                        </button>
                    </div>
                </form>
            </GlassCard>
            <SuccessModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Escrow Vault Created!"
                message={`Your escrow vault has been successfully created${createdVaultId !== 'unknown' ? ` with ID: ${createdVaultId}` : ''}. The counterparty can now view and confirm the vault.`}
            />
        </>
    );
};

export default LockAsset;
