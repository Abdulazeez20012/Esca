import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTrendingTokens } from '../services/escrowService';

interface TrendingToken {
  symbol: string;
  iconUrl: string;
}

const TrendingTicker: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: trendingTokens } = useQuery({
    queryKey: ['trendingTokens'],
    queryFn: getTrendingTokens,
    initialData: [
      { symbol: 'SUI', iconUrl: '/sui.png' },
      { symbol: 'USDC', iconUrl: '/usdc.png' },
      { symbol: 'ETH', iconUrl: '/eth.png' },
    ]
  });

  useEffect(() => {
    if (!trendingTokens || trendingTokens.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % trendingTokens.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [trendingTokens]);

  if (!trendingTokens || trendingTokens.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-pink-500/10 to-purple-600/10 border border-pink-500/20 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-white font-medium">Trending:</span>
        </div>
        <div className="flex items-center space-x-8 overflow-hidden">
          {trendingTokens.map((token, index) => (
            <div
              key={token.symbol}
              className={`flex items-center space-x-2 transition-all duration-500 ${
                index === currentIndex 
                  ? 'opacity-100 transform translate-x-0' 
                  : 'opacity-60 transform translate-x-4'
              }`}
            >
              <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {token.symbol.charAt(0)}
                </span>
              </div>
              <span className="text-white font-medium">{token.symbol}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrendingTicker;