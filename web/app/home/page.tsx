'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useFeedStore, useFriendStore, useNotificationStore } from '@/lib/store';
import { transactionAPI, mockData } from '@/lib/api';
import TransactionCard from '@/components/TransactionCard';
import CommentModal from '@/components/CommentModal';
import PeopleSearchModal from '@/components/PeopleSearchModal';
import BottomNav from '@/components/BottomNav';
import LoadingSpinner from '@/components/LoadingSpinner';
import AccountSwitcher from '@/components/AccountSwitcher';
import { motion } from 'framer-motion';
import Logo from '@/components/Logo';
import { FaSearch, FaBell } from 'react-icons/fa';

export default function HomePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { transactions, setTransactions, likeTransaction, addComment } = useFeedStore();
  const { friends } = useFriendStore();
  const getPendingActionableCount = useNotificationStore((state) => state.getPendingActionableCount);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  
  // Get pending actionable count for badge
  const pendingActionableCount = user ? getPendingActionableCount(user.id) : 0;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }

    // Load transactions (initial load from mock data, then from store)
    const loadTransactions = async () => {
      try {
        // Initial load with mock data if store is empty
        if (transactions.length === 0) {
          setTransactions(mockData.transactions);
        }
      } catch (error) {
        console.error('Failed to load transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, [isAuthenticated, router, setTransactions, transactions.length]);

  // Get friend list for current user
  const currentUserFriends = friends
    .filter((f) => (f.userId === user?.id || f.friendId === user?.id) && f.status === 'accepted')
    .map((f) => (f.userId === user?.id ? f.friendId : f.userId));

  // Filter transactions based on privacy settings and status
  // Privacy rules:
  // - Public: visible to everyone
  // - Friends: visible only to friends of payer and payee
  // - Private: visible only to participants (sender and recipient)
  const feedTransactions = transactions
    .filter((t) => {
      // Only show completed payments (exclude requests, pending, declined, cancelled)
      if (t.status !== 'completed' || t.type !== 'payment') return false;

      // Check privacy visibility
      // User is always allowed to see their own transactions
      const isParticipant = t.senderId === user?.id || t.recipientId === user?.id;
      if (isParticipant) return true;

      // Apply privacy rules for non-participants
      switch (t.privacy) {
        case 'public':
          // Public: visible to everyone
          return true;
        case 'friends':
          // Friends: visible only to friends of payer and payee
          const senderIsFriend = currentUserFriends.includes(t.senderId);
          const recipientIsFriend = currentUserFriends.includes(t.recipientId);
          return senderIsFriend || recipientIsFriend;
        case 'private':
          // Private: visible only to participants (already checked above)
          return false;
        default:
          return false;
      }
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleLike = (transactionId: string) => {
    if (!user) return;
    likeTransaction(transactionId, user.id, user);
  };

  const handleCommentClick = (transactionId: string) => {
    setSelectedTransaction(transactionId);
  };

  const handleAddComment = (content: string) => {
    if (!selectedTransaction || !user) return;
    addComment(selectedTransaction, user.id, user, content);
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="md" />
          <button
            onClick={() => router.push('/notifications')}
            className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Notifications"
          >
            <FaBell className="text-venmo-primary text-xl" />
            {pendingActionableCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-venmo-primary text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                {pendingActionableCount > 9 ? '9+' : pendingActionableCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Find a Person Search CTA */}
      <div className="max-w-md mx-auto px-4 pt-4 pb-2">
        <button
          onClick={() => setIsSearchModalOpen(true)}
          className="w-full bg-white border-2 border-gray-200 rounded-lg px-4 py-3 flex items-center gap-3 hover:border-venmo-primary hover:bg-venmo-light transition-colors text-left"
        >
          <FaSearch className="text-gray-400 flex-shrink-0" />
          <span className="text-gray-500 flex-1">Find a person</span>
        </button>
      </div>

      {/* Feed */}
      <main className="max-w-md mx-auto px-4 py-4">
        {loading ? (
          <LoadingSpinner />
        ) : feedTransactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No transactions yet</p>
            <button
              onClick={() => router.push('/pay')}
              className="bg-venmo-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-venmo-dark transition-colors"
            >
              Send Your First Payment
            </button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {feedTransactions.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                currentUserId={user.id}
                onLike={handleLike}
                onCommentClick={handleCommentClick}
              />
            ))}
          </motion.div>
        )}
      </main>

      {/* Comment Modal */}
      {selectedTransaction && (
        <CommentModal
          transaction={feedTransactions.find((t) => t.id === selectedTransaction)!}
          currentUser={user}
          onClose={() => setSelectedTransaction(null)}
          onAddComment={handleAddComment}
        />
      )}

      {/* People Search Modal */}
      <PeopleSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        currentUserId={user.id}
      />

      <BottomNav />
      <AccountSwitcher />
    </div>
  );
}