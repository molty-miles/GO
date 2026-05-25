export interface UserBalance {
  available: number;
  deployedCapital: number;
  pendingWinnings: number;
}

export interface Deposit {
  amount: number;
  timestamp: string;
  txHash: string;
}

export interface Withdrawal {
  amount: number;
  timestamp: string;
  txHash: string;
}
