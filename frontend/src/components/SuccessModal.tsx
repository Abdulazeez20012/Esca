import React from 'react';
import { CheckCircle, X } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  transactionHash?: string;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  transactionHash,
}) => {
  if (!isOpen) return null;

  const openExplorer = () => {
    if (transactionHash) {
      window.open(`https://testnet.suivision.xyz/txblock/${transactionHash}`, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-md w-full p-6 animate-in slide-in-from-bottom-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-gray-300 mb-6">{message}</p>

        {transactionHash && (
          <div className="mb-6">
            <p className="text-sm text-gray-400 mb-2">Transaction Hash:</p>
            <div className="bg-gray-800 rounded-lg p-3 font-mono text-xs text-gray-300 break-all">
              {transactionHash}
            </div>
          </div>
        )}

        <div className="flex space-x-3">
          {transactionHash && (
            <button
              onClick={openExplorer}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              View on Explorer
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;