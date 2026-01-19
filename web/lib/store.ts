import { create } from 'zustand';
import { User, Transaction, Notification, Friend } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

interface FeedState {
  transactions: Transaction[];
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  likeTransaction: (transactionId: string, userId: string, user: User) => void;
  addComment: (transactionId: string, userId: string, user: User, content: string) => void;
}

interface NotificationState {
  notifications: Notification[];
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  getUnreadCount: () => number;
  getPendingActionableCount: (userId: string) => number; // Count pending actionable items
  removeNotification: (notificationId: string) => void; // Remove notification by ID
}

interface FriendState {
  friends: Friend[];
  setFriends: (friends: Friend[]) => void;
  addFriend: (userId: string, friendId: string) => void;
  removeFriend: (userId: string, friendId: string) => void;
  getFriendStatus: (userId: string, friendId: string) => 'none' | 'pending' | 'friends';
  isFriend: (userId: string, friendId: string) => boolean;
  getFriendCount: (userId: string) => number;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));

export const useFeedStore = create<FeedState>((set) => ({
  transactions: [],
  setTransactions: (transactions) => set({ transactions }),
  addTransaction: (transaction) =>
    set((state) => ({
      transactions: [transaction, ...state.transactions],
    })),
  updateTransaction: (id, updates) =>
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    })),
  likeTransaction: (transactionId, userId, user) =>
    set((state) => ({
      transactions: state.transactions.map((t) => {
        if (t.id !== transactionId) return t;
        const existingLike = t.likes?.find((l) => l.userId === userId);
        if (existingLike) {
          // Unlike
          return {
            ...t,
            likes: t.likes?.filter((l) => l.userId !== userId) || [],
          };
        } else {
          // Like
          return {
            ...t,
            likes: [
              ...(t.likes || []),
              {
                id: `like-${Date.now()}`,
                userId,
                user,
                transactionId,
                createdAt: new Date(),
              },
            ],
          };
        }
      }),
    })),
  addComment: (transactionId, userId, user, content) =>
    set((state) => ({
      transactions: state.transactions.map((t) => {
        if (t.id !== transactionId) return t;
        return {
          ...t,
          comments: [
            ...(t.comments || []),
            {
              id: `comment-${Date.now()}`,
              userId,
              user,
              transactionId,
              content,
              createdAt: new Date(),
            },
          ],
        };
      }),
    })),
}));

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  setNotifications: (notifications) => set({ notifications }),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
    })),
  markAsRead: (notificationId) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      ),
    })),
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),
  getUnreadCount: () => {
    return get().notifications.filter((n) => !n.read).length;
  },
  getPendingActionableCount: (userId: string) => {
    // Count pending actionable items (payment requests with status='pending')
    // This is action-based, not read-based
    return get().notifications.filter((n) => {
      // Must belong to the user
      if (n.userId !== userId) return false;
      
      // Must be a payment request notification
      if (n.type !== 'payment_request') return false;
      
      // Must have pending status (actionable)
      if (n.transaction.status !== 'pending') return false;
      
      // If user is payer (recipient), only show if status is pending
      if (n.transaction.recipientId === userId) {
        return n.transaction.status === 'pending';
      }
      
      // If user is requester (sender), only show if status is pending
      if (n.transaction.senderId === userId) {
        return n.transaction.status === 'pending';
      }
      
      return false;
    }).length;
  },
  removeNotification: (notificationId: string) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== notificationId),
    })),
}));

export const useFriendStore = create<FriendState>((set, get) => ({
  friends: [],
  setFriends: (friends) => set({ friends }),
  addFriend: (userId, friendId) => {
    const existingFriend = get().friends.find(
      (f) => (f.userId === userId && f.friendId === friendId) || (f.userId === friendId && f.friendId === userId)
    );
    if (!existingFriend) {
      // Check if there's a reverse request (friendId -> userId)
      const reverseRequest = get().friends.find(
        (f) => f.userId === friendId && f.friendId === userId && f.status === 'pending'
      );
      
      if (reverseRequest) {
        // Both users requested - auto-accept both
        set((state) => ({
          friends: state.friends.map((f) =>
            f.id === reverseRequest.id ? { ...f, status: 'accepted' as const } : f
          ).concat([{
            id: `friend-${Date.now()}`,
            userId,
            friendId,
            status: 'accepted' as const,
            createdAt: new Date(),
          }]),
        }));
      } else {
        // Create new pending request
        set((state) => ({
          friends: [
            ...state.friends,
            {
              id: `friend-${Date.now()}`,
              userId,
              friendId,
              status: 'pending' as const,
              createdAt: new Date(),
            },
          ],
        }));
      }
    }
  },
  removeFriend: (userId, friendId) => {
    set((state) => ({
      friends: state.friends.filter(
        (f) => !((f.userId === userId && f.friendId === friendId) || (f.userId === friendId && f.friendId === userId))
      ),
    }));
  },
  getFriendStatus: (userId, friendId) => {
    const friend = get().friends.find(
      (f) => (f.userId === userId && f.friendId === friendId) || (f.userId === friendId && f.friendId === userId)
    );
    if (!friend) return 'none';
    if (friend.status === 'accepted') return 'friends';
    return 'pending';
  },
  isFriend: (userId, friendId) => {
    return get().getFriendStatus(userId, friendId) === 'friends';
  },
  getFriendCount: (userId) => {
    return get().friends.filter(
      (f) => (f.userId === userId || f.friendId === userId) && f.status === 'accepted'
    ).length;
  },
}));