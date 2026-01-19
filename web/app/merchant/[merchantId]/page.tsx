'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FaQrcode, FaStar, FaArrowLeft, FaCheckCircle, FaChartBar, FaClock, FaUsers } from 'react-icons/fa';
import { useAuthStore, useFeedStore, useFriendStore } from '@/lib/store';
import BottomNav from '@/components/BottomNav';
import Logo from '@/components/Logo';
import AccountSwitcher from '@/components/AccountSwitcher';
import TransactionCard from '@/components/TransactionCard';
import { Transaction, isMerchant } from '@/types';
import { format } from 'date-fns';

// Mock merchant data
const MERCHANTS: Record<string, { id: string; name: string; category: string; logo?: string }> = {
  'merchant-kopi-kenangan': {
    id: 'merchant-kopi-kenangan',
    name: 'Kopi Kenangan',
    category: 'Coffee / F&B',
    logo: undefined,
  },
};

export default function MerchantProfilePage() {
  const router = useRouter();
  const params = useParams();
  const merchantId = params?.merchantId as string;
  const { user: currentUser, isAuthenticated } = useAuthStore();
  const { transactions } = useFeedStore();
  const { friends } = useFriendStore();
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }

    if (!merchantId || !isMerchant(merchantId)) {
      router.push('/home');
      return;
    }

    setLoading(false);
  }, [isAuthenticated, router, merchantId]);

  const merchant = MERCHANTS[merchantId];

  // Calculate merchant metrics
  const merchantTransactions = useMemo(() => {
    return transactions.filter(
      (t) =>
        (t.recipientId === merchantId || t.senderId === merchantId) &&
        t.status === 'completed' &&
        t.type === 'payment'
    );
  }, [transactions, merchantId]);

  // Performance metrics
  const metrics = useMemo(() => {
    const totalTransactions = merchantTransactions.length;
    const totalVolume = merchantTransactions.reduce((sum, t) => sum + t.amount, 0);
    const uniqueCustomers = new Set(merchantTransactions.map((t) => t.senderId)).size;
    
    // Calculate repeat customer rate
    const customerTransactionCounts = merchantTransactions.reduce((acc, t) => {
      acc[t.senderId] = (acc[t.senderId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const repeatCustomers = Object.values(customerTransactionCounts).filter((count) => count > 1).length;
    const repeatRate = uniqueCustomers > 0 ? (repeatCustomers / uniqueCustomers) * 100 : 0;

    return {
      totalTransactions,
      totalVolume,
      uniqueCustomers,
      repeatRate: Math.round(repeatRate),
    };
  }, [merchantTransactions]);

  // Activity insights
  const activityInsights = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayTransactions = merchantTransactions.filter(
      (t) => new Date(t.createdAt) >= today
    ).length;

    const yesterdayTransactions = merchantTransactions.filter(
      (t) => {
        const date = new Date(t.createdAt);
        return date >= yesterday && date < today;
      }
    ).length;

    // Calculate peak hours
    const hourCounts = merchantTransactions.reduce((acc, t) => {
      const hour = new Date(t.createdAt).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const peakHour = Object.entries(hourCounts).reduce((max, [hour, count]) =>
      count > max[1] ? [parseInt(hour), count] : max,
      [0, 0]
    );

    const peakHourStart = peakHour[0];
    const peakHourEnd = peakHourStart + 2;
    const peakHourFormatted =
      peakHourStart < 12
        ? `${peakHourStart}:00 AM - ${peakHourEnd}:00 AM`
        : peakHourStart === 12
        ? '12:00 PM - 2:00 PM'
        : peakHourEnd < 24
        ? `${peakHourStart - 12}:00 PM - ${peakHourEnd - 12}:00 PM`
        : `${peakHourStart - 12}:00 PM - ${peakHourEnd - 12}:00 AM`;

    return {
      todayCount: todayTransactions,
      yesterdayCount: yesterdayTransactions,
      peakHours: peakHourFormatted,
    };
  }, [merchantTransactions]);

  // Popular purchase amounts
  const popularAmounts = useMemo(() => {
    const amountCounts = merchantTransactions.reduce((acc, t) => {
      acc[t.amount] = (acc[t.amount] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const sortedAmounts = Object.entries(amountCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([amount]) => parseInt(amount));

    return sortedAmounts.length > 0
      ? sortedAmounts
      : [10000, 25000, 50000]; // Default popular amounts
  }, [merchantTransactions]);

  const averageTransaction = useMemo(() => {
    if (merchantTransactions.length === 0) return 0;
    const sum = merchantTransactions.reduce((acc, t) => acc + t.amount, 0);
    return Math.round(sum / merchantTransactions.length);
  }, [merchantTransactions]);

  // Social proof - friends who paid here
  const currentUserFriends = useMemo(() => {
    if (!currentUser) return [];
    return friends
      .filter((f) => (f.userId === currentUser.id || f.friendId === currentUser.id) && f.status === 'accepted')
      .map((f) => (f.userId === currentUser.id ? f.friendId : f.userId));
  }, [friends, currentUser]);

  const friendTransactions = useMemo(() => {
    if (!currentUser) return [];
    return merchantTransactions.filter(
      (t) =>
        currentUserFriends.includes(t.senderId) &&
        (t.privacy === 'public' || (t.privacy === 'friends' && currentUserFriends.includes(t.senderId)))
    );
  }, [merchantTransactions, currentUserFriends, currentUser]);

  const friendUsers = useMemo(() => {
    const friendIds = new Set(friendTransactions.map((t) => t.senderId));
    return friendTransactions
      .map((t) => t.sender)
      .filter((user, index, self) => friendIds.has(user.id) && index === self.findIndex((u) => u.id === user.id));
  }, [friendTransactions]);

  // Privacy-filtered transactions feed (only public)
  const publicTransactions = useMemo(() => {
    return merchantTransactions.filter((t) => {
      // Only show public transactions to non-participants
      if (currentUser && (t.senderId === currentUser.id || t.recipientId === currentUser.id)) {
        return true; // User can see their own transactions
      }
      return t.privacy === 'public';
    });
  }, [merchantTransactions, currentUser]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handlePayWithQRIS = () => {
    router.push('/qris-pay');
  };

  const handleLike = (transactionId: string) => {
    if (!currentUser) return;
    const { likeTransaction } = useFeedStore.getState();
    likeTransaction(transactionId, currentUser.id, currentUser);
  };

  const handleCommentClick = (transactionId: string) => {
    setSelectedTransaction(transactionId);
  };

  if (loading || !merchant || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-venmo-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading merchant profile...</p>
        </div>
      </div>
    );
  }

  const todayVsYesterday = activityInsights.todayCount >= activityInsights.yesterdayCount ? 'up' : 'down';
  const todayVsYesterdayDiff = Math.abs(activityInsights.todayCount - activityInsights.yesterdayCount);

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
        {/* Merchant Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm p-6 mb-6"
        >
          <div className="flex flex-col items-center mb-4">
            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-venmo-light mb-4 flex items-center justify-center">
              {merchant.logo ? (
                <Image src={merchant.logo} alt={merchant.name} fill className="object-cover" />
              ) : (
                <FaQrcode className="text-venmo-primary text-4xl" />
              )}
            </div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold text-gray-900">{merchant.name}</h2>
              <FaCheckCircle className="text-green-500" title="Verified Merchant" />
            </div>
            <p className="text-gray-500 mb-4">{merchant.category}</p>

            {/* Action Buttons */}
            <div className="w-full space-y-2">
              <button
                onClick={handlePayWithQRIS}
                className="w-full bg-venmo-primary text-white py-3 px-6 rounded-lg font-semibold hover:bg-venmo-dark transition-colors flex items-center justify-center gap-2"
              >
                <FaQrcode />
                Pay with QRIS
              </button>
              <button className="w-full bg-gray-100 text-gray-700 py-2 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                <FaStar />
                Favorite
              </button>
            </div>
          </div>
        </motion.div>

        {/* Performance Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm p-6 mb-6"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4">Performance Overview</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-venmo-primary">{metrics.totalTransactions}</p>
              <p className="text-sm text-gray-600 mt-1">Total Transactions</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-venmo-primary">{formatAmount(metrics.totalVolume)}</p>
              <p className="text-sm text-gray-600 mt-1">Total Volume</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-venmo-primary">{metrics.uniqueCustomers}</p>
              <p className="text-sm text-gray-600 mt-1">Unique Customers</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-venmo-primary">{metrics.repeatRate}%</p>
              <p className="text-sm text-gray-600 mt-1">Repeat Rate</p>
            </div>
          </div>
        </motion.div>

        {/* Popular Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm p-6 mb-6"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4">Popular Purchase Amounts</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {popularAmounts.map((amount) => (
              <span
                key={amount}
                className="px-4 py-2 bg-venmo-light text-venmo-primary rounded-lg font-semibold"
              >
                {formatAmount(amount)}
              </span>
            ))}
          </div>
          <div className="pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-600">Average transaction value</p>
            <p className="text-2xl font-bold text-gray-900">{formatAmount(averageTransaction)}</p>
          </div>
        </motion.div>

        {/* Activity Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm p-6 mb-6"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FaChartBar className="text-venmo-primary" />
            Activity Insights
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <FaClock className="text-gray-400" />
                <span className="text-sm text-gray-600">Transactions today</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">{activityInsights.todayCount}</span>
                {activityInsights.yesterdayCount > 0 && (
                  <span
                    className={`text-xs ${
                      todayVsYesterday === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {todayVsYesterday === 'up' ? '↑' : '↓'} {todayVsYesterdayDiff}
                  </span>
                )}
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <FaClock className="text-gray-400" />
                <span className="text-sm text-gray-600">Peak hours</span>
              </div>
              <p className="font-semibold text-gray-900">{activityInsights.peakHours}</p>
            </div>
          </div>
        </motion.div>

        {/* Social Proof */}
        {friendUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow-sm p-6 mb-6"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FaUsers className="text-venmo-primary" />
              Friends Who Paid Here
            </h3>
            <div className="flex items-center gap-2 mb-3">
              {friendUsers.slice(0, 5).map((friend) => (
                <div
                  key={friend.id}
                  className="relative w-10 h-10 rounded-full overflow-hidden bg-venmo-light"
                  title={friend.name}
                >
                  <Image
                    src={friend.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`}
                    alt={friend.name}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
              {friendUsers.length > 5 && (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-xs font-semibold text-gray-600">+{friendUsers.length - 5}</span>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600">
              {friendUsers.length} {friendUsers.length === 1 ? 'friend' : 'friends'} paid here
            </p>
          </motion.div>
        )}

        {/* Recent Transactions Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-6"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4 px-2">Recent Transactions</h3>
          {publicTransactions.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center">
              <FaQrcode className="mx-auto text-gray-300 mb-3" size={48} />
              <p className="text-gray-500">No public transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {publicTransactions.slice(0, 10).map((transaction) => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  currentUserId={currentUser.id}
                  onLike={handleLike}
                  onCommentClick={handleCommentClick}
                />
              ))}
            </div>
          )}
        </motion.div>
      </main>

      <BottomNav />
      <AccountSwitcher />
    </div>
  );
}
