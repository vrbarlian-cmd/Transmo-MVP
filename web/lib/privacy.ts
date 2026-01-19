import { Transaction, User } from '@/types';

/**
 * Check if a transaction should be visible to the current user based on privacy settings
 * @param transaction - The transaction to check
 * @param currentUser - The current user viewing the transaction
 * @param friends - List of user IDs that are friends with the current user
 * @returns true if the transaction should be visible to the current user
 */
export function isTransactionVisible(
  transaction: Transaction,
  currentUser: User | null,
  friends: string[] = []
): boolean {
  if (!currentUser) return false;

  // User is always allowed to see their own transactions
  const isParticipant = transaction.senderId === currentUser.id || transaction.recipientId === currentUser.id;
  if (isParticipant) return true;

  // Check privacy level
  switch (transaction.privacy) {
    case 'public':
      // Public: visible to everyone
      return true;

    case 'friends':
      // Friends: visible only to confirmed friends of payer and payee
      const senderIsFriend = friends.includes(transaction.senderId);
      const recipientIsFriend = friends.includes(transaction.recipientId);
      return senderIsFriend || recipientIsFriend;

    case 'private':
      // Private: visible only to User A and User B (already checked above)
      return false;

    default:
      return false;
  }
}

/**
 * Get friends list for a user (simplified for MVP)
 * In production, this would come from a friends API
 */
export function getUserFriends(userId: string): string[] {
  // For MVP, return empty array - friends feature can be added later
  // In production, this would fetch from API: `/users/${userId}/friends`
  return [];
}

/**
 * Get friend list from friend store (for use with Zustand)
 */
export function getFriendListFromStore(userId: string, friends: Array<{ userId: string; friendId: string; status: string }>): string[] {
  return friends
    .filter((f) => (f.userId === userId || f.friendId === userId) && f.status === 'accepted')
    .map((f) => (f.userId === userId ? f.friendId : f.userId));
}
