'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FaUserFriends, FaCheck, FaClock, FaArrowLeft, FaLock, FaUsers, FaGlobe } from 'react-icons/fa';
import { useAuthStore, useFeedStore, useFriendStore } from '@/lib/store';
import { mockData } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import Logo from '@/components/Logo';
import AccountSwitcher from '@/components/AccountSwitcher';
import TransactionCard from '@/components/TransactionCard';
import { User, Transaction } from '@/types';
import { isTransactionVisible } from '@/lib/privacy';

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.userId as string;
  const { user: currentUser, isAuthenticated } = useAuthStore();
  const { transactions } = useFeedStore();
  const { addFriend, removeFriend, getFriendStatus, getFriendCount, friends, isFriend } = useFriendStore();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }

    if (!userId) {
      router.push('/home');
      return;
    }

    // Load profile user from mock data (in production, fetch from API)
    const loadProfileUser = async () => {
      try {
        const user = mockData.users.find((u) => u.id === userId);
        if (user) {
          setProfileUser(user);
        } else {
          // User not found
          router.push('/home');
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
        router.push('/home');
      } finally {
        setLoading(false);
      }
    };

    loadProfileUser();
  }, [isAuthenticated, router, userId]);

  const friendStatus = profileUser && currentUser ? getFriendStatus(currentUser.id, profileUser.id) : 'none';
  const friendCount = profileUser ? getFriendCount(profileUser.id) : 0;

  const handleAddFriend = () => {
    if (!currentUser || !profileUser) return;
    addFriend(currentUser.id, profileUser.id);
  };

  const handleRemoveFriend = () => {
    if (!currentUser || !profileUser) return;
    removeFriend(currentUser.id, profileUser.id);
  };

  // Get friend list for current user
  const currentUserFriends = friends
    .filter((f) => (f.userId === currentUser?.id || f.friendId === currentUser?.id) && f.status === 'accepted')
    .map((f) => (f.userId === currentUser?.id ? f.friendId : f.userId));

  // Filter transactions for profile feed based on privacy
  const profileFeedTransactions = transactions.filter((t) => {
    // Only show completed payments
    if (t.status !== 'completed' || t.type !== 'payment') return false;

    // User must be participant (sender or recipient) for profile visibility
    const isParticipant = t.senderId === profileUser?.id || t.recipientId === profileUser?.id;
    if (!isParticipant) return false;

    // Apply privacy rules for current viewer
    if (!currentUser) return false;
    return isTransactionVisible(t, currentUser, currentUserFriends);
  });

  // "Between You" section - transactions between current user and profile user
  const betweenYouTransactions = profileFeedTransactions.filter((t) => {
    if (!currentUser || !profileUser) return false;
    return (
      (t.senderId === currentUser.id && t.recipientId === profileUser.id) ||
      (t.senderId === profileUser.id && t.recipientId === currentUser.id)
    );
  });

  // Other transactions (not between current user and profile user)
  const otherTransactions = profileFeedTransactions.filter((t) => {
    if (!currentUser || !profileUser) return false;
    return !(
      (t.senderId === currentUser.id && t.recipientId === profileUser.id) ||
      (t.senderId === profileUser.id && t.recipientId === currentUser.id)
    );
  });

  const handleLike = (transactionId: string) => {
    if (!currentUser) return;
    const { likeTransaction } = useFeedStore.getState();
    likeTransaction(transactionId, currentUser.id, currentUser);
  };

  const handleCommentClick = (transactionId: string) => {
    setSelectedTransaction(transactionId);
  };

  if (loading || !profileUser || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-venmo-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser.id === profileUser.id;

  return (
    <div className="min-h-screen bg-gray-50 pb-20" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
          >
            <FaArrowLeft />
          </button>
          <Logo size="md" />
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm p-6 mb-6"
        >
          <div className="flex flex-col items-center mb-4">
            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-venmo-light mb-4">
              <Image
                src={profileUser.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileUser.username}`}
                alt={profileUser.name}
                fill
                className="object-cover"
              />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{profileUser.name}</h2>
            <p className="text-gray-500 mb-2">@{profileUser.username}</p>
            
            {/* Friend Count */}
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <FaUserFriends className="text-venmo-primary" />
              <span>{friendCount} {friendCount === 1 ? 'friend' : 'friends'}</span>
            </div>

            {/* Add Friend / Friends / Pending Button */}
            {!isOwnProfile && (
              <button
                onClick={friendStatus === 'none' ? handleAddFriend : friendStatus === 'pending' ? undefined : handleRemoveFriend}
                disabled={friendStatus === 'pending'}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                  friendStatus === 'friends'
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : friendStatus === 'pending'
                    ? 'bg-yellow-100 text-yellow-700 cursor-not-allowed'
                    : 'bg-venmo-primary text-white hover:bg-venmo-dark'
                }`}
              >
                {friendStatus === 'friends' ? (
                  <>
                    <FaCheck />
                    Friends
                  </>
                ) : friendStatus === 'pending' ? (
                  <>
                    <FaClock />
                    Pending
                  </>
                ) : (
                  <>
                    <FaUserFriends />
                    Add Friend
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>

        {/* Between You Section */}
        {betweenYouTransactions.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3 px-2">Between You</h3>
            <div className="space-y-3">
              {betweenYouTransactions.map((transaction) => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  currentUserId={currentUser.id}
                  onLike={handleLike}
                  onCommentClick={handleCommentClick}
                />
              ))}
            </div>
          </div>
        )}

        {/* Profile Feed Section */}
        {otherTransactions.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3 px-2">
              {betweenYouTransactions.length > 0 ? 'Other Transactions' : 'Transactions'}
            </h3>
            <div className="space-y-3">
              {otherTransactions.map((transaction) => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  currentUserId={currentUser.id}
                  onLike={handleLike}
                  onCommentClick={handleCommentClick}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {profileFeedTransactions.length === 0 && (
          <div className="bg-white rounded-lg p-8 text-center">
            <FaUserFriends className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-gray-500">No transactions yet</p>
          </div>
        )}
      </main>

      <BottomNav />
      <AccountSwitcher />
    </div>
  );
}
