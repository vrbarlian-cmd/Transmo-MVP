'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FaEdit, FaSignOutAlt, FaHistory, FaUserFriends, FaShieldAlt, FaCog } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useAuthStore, useFeedStore } from '@/lib/store';
import { userAPI, mockData } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import Logo from '@/components/Logo';
import AccountSwitcher from '@/components/AccountSwitcher';
import { User, Transaction } from '@/types';
import { format } from 'date-fns';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { transactions } = useFeedStore();
  const [friends, setFriends] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'history' | 'friends'>('history');
  const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }

    // Load friends and user transactions
    const loadData = async () => {
      try {
        // Mock data
        setFriends([]);
        // Filter transactions where user is involved, exclude pending/declined requests
        const userTrans = transactions
          .filter(
            (t) =>
              (t.senderId === user?.id || t.recipientId === user?.id) &&
              !(t.type === 'request' && (t.status === 'pending' || t.status === 'declined'))
          )
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setUserTransactions(userTrans);
      } catch (error) {
        console.error('Failed to load profile data:', error);
      }
    };

    loadData();
  }, [isAuthenticated, router, transactions, user]);

  const handleLogout = () => {
    logout();
    router.push('/auth');
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  const formatAmount = (amount: number, isSender: boolean) => {
    const formatted = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
    return (isSender ? '-' : '+') + formatted;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="md" />
          <button
            onClick={() => router.push('/settings')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Settings"
          >
            <FaCog className="text-gray-600 text-xl" />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm p-6 mb-6"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="relative w-20 h-20 rounded-full overflow-hidden bg-venmo-light flex-shrink-0">
              <Image
                src={user.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                alt={user.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
              <p className="text-gray-500">@{user.username}</p>
              <p className="text-sm text-gray-400 mt-1">{user.phone}</p>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <FaEdit className="text-gray-600" />
            </button>
          </div>

          {/* KYC Status */}
          <div className="flex items-center gap-2 text-sm">
            <FaShieldAlt className={user.kycVerified ? 'text-green-500' : 'text-gray-400'} />
            <span className={user.kycVerified ? 'text-green-600 font-semibold' : 'text-gray-500'}>
              {user.kycVerified ? 'KYC Verified' : 'KYC Not Verified'}
            </span>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="bg-white rounded-lg p-1 mb-4 flex gap-1">
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-colors ${
              activeTab === 'history'
                ? 'bg-venmo-primary text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FaHistory className="inline mr-2" />
            History
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-colors ${
              activeTab === 'friends'
                ? 'bg-venmo-primary text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FaUserFriends className="inline mr-2" />
            Friends
          </button>
        </div>

        {/* Content */}
        {activeTab === 'history' ? (
          <div className="space-y-3">
            {userTransactions.length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center">
                <FaHistory className="mx-auto text-gray-300 mb-3" size={48} />
                <p className="text-gray-500">No transaction history yet</p>
              </div>
            ) : (
              userTransactions.map((transaction) => {
                const isSender = transaction.senderId === user.id;
                const otherUser = isSender ? transaction.recipient : transaction.sender;

                return (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg p-4 border border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-full overflow-hidden bg-venmo-light flex-shrink-0">
                        <Image
                          src={otherUser.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser.username}`}
                          alt={otherUser.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {isSender ? 'Paid' : 'Received from'} {otherUser.name}
                            </p>
                            {transaction.note && (
                              <p className="text-sm text-gray-600">{transaction.note}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              {format(new Date(transaction.createdAt), 'MMM d, yyyy · h:mm a')}
                            </p>
                            {transaction.paymentMethod && (
                              <p className="text-xs text-gray-500 mt-1">
                                Paid via {transaction.paymentMethod.toUpperCase()}
                              </p>
                            )}
                          </div>
                          <span
                            className={`text-lg font-bold ${
                              isSender ? 'text-red-600' : 'text-green-600'
                            }`}
                          >
                            {formatAmount(transaction.amount, isSender)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {friends.length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center">
                <FaUserFriends className="mx-auto text-gray-300 mb-3" size={48} />
                <p className="text-gray-500 mb-4">No friends yet</p>
                <button
                  onClick={() => router.push('/pay')}
                  className="text-venmo-primary font-semibold"
                >
                  Add friends by sending payment
                </button>
              </div>
            ) : (
              friends.map((friend) => (
                <motion.div
                  key={friend.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg p-4 border border-gray-100 flex items-center gap-3"
                >
                  <div className="relative w-12 h-12 rounded-full overflow-hidden bg-venmo-light flex-shrink-0">
                    <Image
                      src={friend.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`}
                      alt={friend.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{friend.name}</p>
                    <p className="text-sm text-gray-500">@{friend.username}</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* Logout Button */}
        <motion.button
          onClick={handleLogout}
          className="w-full mt-6 bg-red-50 text-red-600 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
        >
          <FaSignOutAlt />
          Logout
        </motion.button>
      </main>

      <BottomNav />
      <AccountSwitcher />
    </div>
  );
}