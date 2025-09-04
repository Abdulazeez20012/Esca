export interface Asset {
  id: string;
  name: string;
  symbol: string;
  balance: number;
  iconUrl: string;
}

export enum EscrowPartyStatus {
  WAITING = 'WAITING',
  LOCKED = 'LOCKED',
}

export interface EscrowParty {
  address: string;
  asset: Asset;
  amount: number;
  status: EscrowPartyStatus;
}

export interface Escrow {
  id: string;
  initiator: EscrowParty;
  counterparty: EscrowParty;
  createdAt: string;
}

export enum TransactionStatus {
  COMPLETED = 'COMPLETED',
  PENDING = 'PENDING',
  CANCELED = 'CANCELED',
  RECLAIMED = 'RECLAIMED',
}

export interface Transaction {
  id: string;
  type: 'SWAP' | 'LOCK' | 'RECLAIM';
  status: TransactionStatus;
  date: string;
  details: string;
  escrowId?: string;
}

export interface TrendingToken {
  symbol: string;
  iconUrl: string;
}

export interface FeatureSpotlightItem {
  title: string;
  description: string;
  icon: React.ElementType;
}