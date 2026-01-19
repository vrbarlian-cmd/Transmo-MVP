export type User = {
  id: string;
  username: string;
  phone: string;
  profilePhoto?: string;
  name: string;
  createdAt: Date;
  kycVerified: boolean;
};

export type Transaction = {
  id: string;
  senderId: string;
  sender: User;
  recipientId: string;
  recipient: User;
  amount: number;
  note: string;
  privacy: 'public' | 'friends' | 'private';
  status: 'pending' | 'completed' | 'failed' | 'declined' | 'cancelled';
  paymentMethod: 'qris' | 'bca' | 'mandiri' | 'bni' | 'bri';
  type: 'payment' | 'request';
  createdAt: Date;
  likes: Like[];
  comments: Comment[];
  showAmountOnFeed?: boolean; // Whether to show amount on social feed (defaults to true for backward compatibility)
};

export type Notification = {
  id: string;
  userId: string;
  transactionId: string;
  transaction: Transaction;
  type: 'payment_request' | 'payment_received' | 'payment_completed';
  read: boolean;
  createdAt: Date;
};

export type Like = {
  id: string;
  userId: string;
  user: User;
  transactionId: string;
  createdAt: Date;
};

export type Comment = {
  id: string;
  userId: string;
  user: User;
  transactionId: string;
  content: string;
  createdAt: Date;
};

export type Friend = {
  id: string;
  userId: string;
  friendId: string;
  status: 'pending' | 'accepted';
  createdAt: Date;
};

export type PaymentMethod = {
  id: string;
  type: 'qris' | 'bank_va' | 'ovo' | 'dana' | 'shopeepay';
  name: string;
  logo?: string;
  accountNumber?: string;
  bankName?: string;
};

export type BankAccount = {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isActive: boolean;
};

export type Merchant = {
  id: string;
  name: string;
  category: string;
  logo?: string;
  verified: boolean;
  createdAt: Date;
};

/**
 * Check if a user ID represents a merchant
 * Merchants have IDs starting with 'merchant-'
 */
export function isMerchant(userId: string): boolean {
  return userId.startsWith('merchant-');
}