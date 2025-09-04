import React from 'react';
import { Shield, Zap, Users } from 'lucide-react';
import GlassCard from './GlassCard';

interface FeatureItem {
  title: string;
  description: string;
  icon: React.ElementType;
}

const FeatureSpotlight: React.FC = () => {
  const features: FeatureItem[] = [
    {
      title: 'Secure Escrow',
      description: 'Your assets are protected by smart contracts on Sui blockchain.',
      icon: Shield,
    },
    {
      title: 'Fast Transactions',
      description: 'Experience lightning-fast settlement with minimal fees.',
      icon: Zap,
    },
    {
      title: 'Peer-to-Peer',
      description: 'Trade directly with others without intermediaries.',
      icon: Users,
    },
  ];

  return (
    <GlassCard className="p-6">
      <h2 className="text-xl font-bold text-white mb-4">Why Choose Esca?</h2>
      <div className="space-y-4">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
              <feature.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">{feature.title}</h3>
              <p className="text-sm text-gray-400 mt-1">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

export default FeatureSpotlight;