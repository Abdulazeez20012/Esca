import React from 'react';
import { cn } from '../utils/cn';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className }) => {
  return (
    <div
      className={cn(
        "bg-black/30 border border-gray-800 backdrop-blur-sm rounded-lg shadow-lg",
        "hover:bg-black/40 transition-all duration-300 ease-in-out",
        className
      )}
    >
      {children}
    </div>
  );
};

export default GlassCard;