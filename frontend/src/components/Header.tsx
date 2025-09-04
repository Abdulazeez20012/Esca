import React from 'react';
import { ConnectButton, useCurrentAccount, useCurrentWallet } from '@mysten/dapp-kit';
import { ChevronDown, Wallet, User } from 'lucide-react';

const Header: React.FC = () => {
  const currentAccount = useCurrentAccount();
  const { connectionStatus } = useCurrentWallet();
  const isConnected = connectionStatus === 'connected';

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <header className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-lg">E</span>
              </div>
              <span className="text-white font-bold text-xl">Esca</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-gray-400 text-sm">Decentralized Escrow Platform</span>
            </div>
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            {isConnected && currentAccount ? (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex items-center space-x-2 bg-gray-800/50 rounded-lg px-3 py-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300 text-sm">
                    {formatAddress(currentAccount.address)}
                  </span>
                </div>
                <ConnectButton />
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Wallet className="w-5 h-5 text-gray-400" />
                <ConnectButton />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;