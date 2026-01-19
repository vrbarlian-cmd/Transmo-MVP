'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaTimes, FaUserCheck, FaUserPlus } from 'react-icons/fa';
import { User } from '@/types';
import { mockData } from '@/lib/api';
import { useFriendStore } from '@/lib/store';

interface PeopleSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
}

export default function PeopleSearchModal({
  isOpen,
  onClose,
  currentUserId,
}: PeopleSearchModalProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const { friends } = useFriendStore();

  // Get friend list for current user
  const currentUserFriends = useMemo(() => {
    return friends
      .filter((f) => (f.userId === currentUserId || f.friendId === currentUserId) && f.status === 'accepted')
      .map((f) => (f.userId === currentUserId ? f.friendId : f.userId));
  }, [friends, currentUserId]);

  // Search logic: case-insensitive, partial match, prioritize exact username matches
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      // If no search query, show all users except current user
      return mockData.users
        .filter((u) => u.id !== currentUserId)
        .map((user) => ({
          user,
          matchType: 'none' as const,
          isFriend: currentUserFriends.includes(user.id),
        }));
    }

    const query = searchQuery.toLowerCase().trim();
    const results = mockData.users
      .filter((u) => u.id !== currentUserId)
      .map((user) => {
        const usernameMatch = user.username.toLowerCase();
        const nameMatch = user.name.toLowerCase();
        const usernameExact = usernameMatch === query;
        const usernamePartial = usernameMatch.includes(query);
        const namePartial = nameMatch.includes(query);

        // Prioritize exact username matches
        let matchType: 'exact-username' | 'username' | 'name' | 'none' = 'none';
        if (usernameExact) {
          matchType = 'exact-username';
        } else if (usernamePartial) {
          matchType = 'username';
        } else if (namePartial) {
          matchType = 'name';
        }

        return {
          user,
          matchType,
          isFriend: currentUserFriends.includes(user.id),
        };
      })
      .filter((result) => result.matchType !== 'none')
      .sort((a, b) => {
        // Sort: exact username matches first, then username matches, then name matches
        if (a.matchType === 'exact-username' && b.matchType !== 'exact-username') return -1;
        if (b.matchType === 'exact-username' && a.matchType !== 'exact-username') return 1;
        if (a.matchType === 'username' && b.matchType === 'name') return -1;
        if (b.matchType === 'username' && a.matchType === 'name') return 1;
        // Alphabetical by name for same match type
        return a.user.name.localeCompare(b.user.name);
      });

    return results;
  }, [searchQuery, currentUserId, currentUserFriends]);

  const handleUserClick = (userId: string) => {
    router.push(`/profile/${userId}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl w-full max-w-md flex flex-col shadow-xl"
          style={{ 
            maxHeight: 'calc(80vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
            maxWidth: 'calc(100vw - 2rem)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Find a person</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FaTimes className="text-gray-600" />
            </button>
          </div>

          {/* Search Input */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or username (e.g. @vitobarlian)"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-venmo-primary focus:border-transparent"
                autoFocus
              />
            </div>
          </div>

          {/* Search Results */}
          <div className="flex-1 overflow-y-auto">
            {searchResults.length === 0 ? (
              <div className="p-8 text-center">
                <FaSearch className="mx-auto text-gray-300 mb-3" size={48} />
                <p className="text-gray-500 mb-1">No results found</p>
                <p className="text-sm text-gray-400">Try searching by name or username</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {searchResults.map((result) => (
                  <button
                    key={result.user.id}
                    onClick={() => handleUserClick(result.user.id)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    {/* Avatar */}
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-venmo-light flex-shrink-0">
                      <Image
                        src={result.user.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${result.user.username}`}
                        alt={result.user.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 truncate">
                          {result.user.name}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        @{result.user.username}
                      </p>
                    </div>

                    {/* Relationship Status */}
                    <div className="flex-shrink-0">
                      {result.isFriend ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <FaUserCheck />
                          <span className="text-sm font-medium">Friend</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-gray-400">
                          <FaUserPlus />
                          <span className="text-sm">Not friends</span>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
