'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUser, FaUsers, FaTimes, FaCheck } from 'react-icons/fa';
import { useAuthStore } from '@/lib/store';
import { mockData } from '@/lib/api';
import { User } from '@/types';

export default function AccountSwitcher() {
  const { user, setUser } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);

  // Available demo accounts - all existing users
  const demoAccounts = mockData.users;

  const handleSwitchAccount = (account: User) => {
    setUser(account);
    setIsOpen(false);
  };

  if (!user) return null;

  return (
    <>
      {/* Account Switcher Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-50 bg-white border-2 border-venmo-primary text-venmo-primary px-3 py-2 rounded-full shadow-lg hover:bg-venmo-light transition-colors flex items-center gap-2 text-sm font-semibold touch-manipulation"
        style={{ top: 'calc(1rem + env(safe-area-inset-top))', right: 'calc(1rem + env(safe-area-inset-right))' }}
        title="Switch Account"
      >
        <FaUsers />
        <span className="hidden sm:inline">{user.name.split(' ')[0]}</span>
      </button>

      {/* Account Switcher Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-sm p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Switch Account</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FaTimes className="text-gray-600" />
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Select an account to switch to (Demo Mode)
              </p>

              <div className="space-y-2">
                {demoAccounts.map((account) => {
                  const isCurrentUser = account.id === user.id;
                  return (
                    <button
                      key={account.id}
                      onClick={() => handleSwitchAccount(account)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                        isCurrentUser
                          ? 'border-venmo-primary bg-venmo-light'
                          : 'border-gray-200 hover:border-venmo-primary hover:bg-gray-50'
                      }`}
                    >
                      <div className="relative w-10 h-10 rounded-full overflow-hidden bg-venmo-light flex-shrink-0">
                        <Image
                          src={account.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${account.username}`}
                          alt={account.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-gray-900">{account.name}</p>
                        <p className="text-sm text-gray-500">@{account.username}</p>
                      </div>
                      {isCurrentUser && (
                        <FaCheck className="text-venmo-primary" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800">
                  <strong>Demo Mode:</strong> Account switching is for testing purposes only.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
