'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaTimes, FaUserFriends } from 'react-icons/fa';
import { User } from '@/types';

interface ContactsListProps {
  users: User[];
  currentUserId: string;
  onSelect: (user: User) => void;
  onClose: () => void;
  mode: 'pay' | 'request';
}

export default function ContactsList({
  users,
  currentUserId,
  onSelect,
  onClose,
  mode,
}: ContactsListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = users.filter(
    (user) =>
      user.id !== currentUserId &&
      (user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phone.includes(searchQuery))
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="bg-white rounded-t-2xl w-full max-w-md mx-auto flex flex-col"
        style={{ 
          maxHeight: 'calc(80vh - env(safe-area-inset-bottom))',
          maxWidth: 'calc(100vw - 2rem)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FaUserFriends className="text-venmo-primary" />
            <h2 className="text-lg font-bold text-gray-900">
              {mode === 'pay' ? 'Pay to' : 'Request from'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FaTimes className="text-gray-600" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contacts..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-venmo-primary focus:border-transparent"
              autoFocus
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No contacts found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    onSelect(user);
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="relative w-12 h-12 rounded-full overflow-hidden bg-venmo-light flex-shrink-0">
                    <Image
                      src={
                        user.profilePhoto ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
                      }
                      alt={user.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{user.name}</p>
                    <p className="text-sm text-gray-500 truncate">@{user.username}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}