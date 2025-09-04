// Validation utilities

export const isValidSuiAddress = (address: string): boolean => {
  // Sui addresses are 32 bytes represented as 64 hex characters with 0x prefix
  const hexPattern = /^0x[a-fA-F0-9]{64}$/;
  return hexPattern.test(address);
};

export const isValidAmount = (amount: string): boolean => {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && isFinite(num);
};

export const isValidEmail = (email: string): boolean => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
};

export const validateVaultDescription = (description: string): { valid: boolean; error?: string } => {
  if (!description.trim()) {
    return { valid: false, error: 'Description is required' };
  }
  if (description.length < 10) {
    return { valid: false, error: 'Description must be at least 10 characters' };
  }
  if (description.length > 500) {
    return { valid: false, error: 'Description must be less than 500 characters' };
  }
  return { valid: true };
};

export const validateAmount = (amount: string, maxBalance?: number): { valid: boolean; error?: string } => {
  if (!amount.trim()) {
    return { valid: false, error: 'Amount is required' };
  }
  
  const num = parseFloat(amount);
  if (isNaN(num)) {
    return { valid: false, error: 'Invalid amount format' };
  }
  
  if (num <= 0) {
    return { valid: false, error: 'Amount must be greater than 0' };
  }
  
  if (maxBalance !== undefined && num > maxBalance) {
    return { valid: false, error: 'Insufficient balance' };
  }
  
  return { valid: true };
};

export const validateCounterparty = (address: string): { valid: boolean; error?: string } => {
  if (!address.trim()) {
    return { valid: false, error: 'Counterparty address is required' };
  }
  
  if (!isValidSuiAddress(address)) {
    return { valid: false, error: 'Invalid Sui address format' };
  }
  
  return { valid: true };
};