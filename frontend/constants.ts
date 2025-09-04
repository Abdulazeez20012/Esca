import { TrendingToken, FeatureSpotlightItem } from './types';
import { ShieldCheck, Repeat, Zap } from 'lucide-react';

export const TRENDING_TOKENS: TrendingToken[] = [
  { symbol: 'USDC', iconUrl: '/usdt.png' }, // Placeholder icon
  { symbol: 'WAL', iconUrl: '/slush.png' }, // Placeholder icon
  { symbol: 'DEEP', iconUrl: '/sui.png' }, // Placeholder icon
  { symbol: 'USDT', iconUrl: '/usdt.png' },
  { symbol: 'stSUI', iconUrl: '/sui.png' }, // Placeholder icon
  { symbol: 'LINK', iconUrl: '/link.png' },
  { symbol: 'SUI', iconUrl: '/sui.png' },
  { symbol: 'SLSH', iconUrl: '/slush.png' },
];

export const FEATURE_SPOTLIGHT_ITEMS: FeatureSpotlightItem[] = [
  {
    title: 'Audited & Secure',
    description: 'Your assets are protected by battle-tested smart contracts and industry-leading security.',
    icon: ShieldCheck,
  },
  {
    title: 'Seamless Swaps',
    description: 'Execute trustless P2P swaps directly from your wallet with just a few clicks.',
    icon: Repeat,
  },
  {
    title: 'Instant Reclaim',
    description: 'Instantly reclaim your assets from any escrow that has expired or been canceled.',
    icon: Zap,
  },
];