// Utility functions for formatting data

export const formatAddress = (address: string, length: number = 4): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-length)}`;
};

export const formatBalance = (balance: number | string, decimals: number = 4): string => {
  const num = typeof balance === 'string' ? parseFloat(balance) : balance;
  if (isNaN(num)) return '0.0000';
  return num.toFixed(decimals);
};

export const formatTimestamp = (timestamp: string | number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatRelativeTime = (timestamp: string | number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  return formatTimestamp(timestamp);
};

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  }).format(amount);
};

export const parseAmount = (amountStr: string): number => {
  const cleaned = amountStr.replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};