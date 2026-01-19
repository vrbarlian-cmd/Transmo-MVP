'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaLock, FaUsers, FaGlobe, FaArrowLeft, FaPaperPlane, FaHandHoldingUsd } from 'react-icons/fa';
import { useAuthStore, useFeedStore, useNotificationStore } from '@/lib/store';
import { transactionAPI, userAPI, mockData } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import Logo from '@/components/Logo';
import ContactsList from '@/components/ContactsList';
import AccountSwitcher from '@/components/AccountSwitcher';
import { User, Transaction } from '@/types';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

interface PayFormData {
  amount: string;
  recipientId: string;
  note: string;
  privacy: 'public' | 'friends' | 'private';
  paymentMethod: string;
}

export default function PayPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { addTransaction } = useFeedStore();
  const { addNotification } = useNotificationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<User | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showContactsList, setShowContactsList] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'pay' | 'request'>('pay');

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<PayFormData>({
    defaultValues: {
      amount: '',
      note: '',
      privacy: 'public',
      paymentMethod: 'qris',
    },
  });

  const privacy = watch('privacy');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length >= 2) {
        try {
          // Mock search
          const results = mockData.users.filter(
            (u) =>
              u.id !== user?.id &&
              (u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.phone.includes(searchQuery))
          );
          setSearchResults(results);
        } catch (error) {
          console.error('Search failed:', error);
        }
      } else {
        setSearchResults([]);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, user]);

  const onEmojiClick = (emojiData: EmojiClickData) => {
    const currentNote = watch('note') || '';
    setValue('note', currentNote + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const formatAmount = (value: string): string => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    // Add commas as thousands separators
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatAmount(e.target.value);
    setValue('amount', formatted, { shouldValidate: true });
  };

  const handleRecipientSelect = (user: User) => {
    setSelectedRecipient(user);
    setValue('recipientId', user.id);
    setSearchQuery('');
    setSearchResults([]);
  };

  const onSubmit = async (data: PayFormData) => {
    if (!selectedRecipient || !user) return;

    setLoading(true);
    try {
      // Parse amount (remove commas)
      const numericAmount = parseFloat(data.amount.replace(/,/g, ''));
      
      if (mode === 'pay') {
        // Payment flow - all payments use QRIS
        const newTransaction: Transaction = {
          id: Date.now().toString(),
          senderId: user.id,
          recipientId: selectedRecipient.id,
          amount: numericAmount,
          note: data.note || '',
          privacy: data.privacy,
          status: 'completed' as const,
          paymentMethod: 'qris',
          type: 'payment',
          createdAt: new Date(),
          likes: [],
          comments: [],
          sender: user,
          recipient: selectedRecipient,
        };

        // Add transaction to feed
        addTransaction(newTransaction);
        
        // Create notification for recipient
        addNotification({
          id: `notif-${Date.now()}`,
          userId: selectedRecipient.id,
          transactionId: newTransaction.id,
          transaction: newTransaction,
          type: 'payment_received',
          read: false,
          createdAt: new Date(),
        });
        
        // Navigate to home to see the new transaction
        router.push('/home');
      } else {
        // Request flow
        const newTransaction: Transaction = {
          id: Date.now().toString(),
          senderId: user.id,
          recipientId: selectedRecipient.id,
          amount: numericAmount,
          note: data.note || '',
          privacy: data.privacy,
          status: 'pending' as const,
          paymentMethod: 'qris',
          type: 'request',
          createdAt: new Date(),
          likes: [],
          comments: [],
          sender: user,
          recipient: selectedRecipient,
        };

        // Add transaction to feed with pending status
        addTransaction(newTransaction);
        
        // Create notifications for BOTH requester and payer
        const now = Date.now();
        
        // Notification for requester (sender)
        addNotification({
          id: `notif-requester-${now}`,
          userId: user.id, // Requester (sender)
          transactionId: newTransaction.id,
          transaction: newTransaction,
          type: 'payment_request',
          read: false,
          createdAt: new Date(),
        });
        
        // Notification for payer (recipient) - Budi Kurniawan
        addNotification({
          id: `notif-payer-${now}`,
          userId: selectedRecipient.id, // Payer (recipient) - Budi Kurniawan
          transactionId: newTransaction.id,
          transaction: newTransaction,
          type: 'payment_request',
          read: false,
          createdAt: new Date(),
        });
        
        // Navigate to home to see the request
        router.push('/home');
      }
    } catch (error) {
      console.error('Operation failed:', error);
      alert(`Failed to ${mode === 'pay' ? 'send payment' : 'create request'}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
          >
            <FaArrowLeft />
          </button>
          
          {/* Modern Pay/Request Toggle */}
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-gray-100 rounded-full p-1 flex gap-1 max-w-xs w-full">
              <button
                type="button"
                onClick={() => setMode('pay')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full font-semibold text-sm transition-all ${
                  mode === 'pay'
                    ? 'bg-white text-venmo-primary shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FaPaperPlane className={mode === 'pay' ? 'text-venmo-primary' : 'text-gray-500'} />
                <span>Pay</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('request')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full font-semibold text-sm transition-all ${
                  mode === 'request'
                    ? 'bg-white text-venmo-primary shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FaHandHoldingUsd className={mode === 'request' ? 'text-venmo-primary' : 'text-gray-500'} />
                <span>Request</span>
              </button>
            </div>
          </div>
          
          {/* Spacer for alignment */}
          <div className="w-10 flex-shrink-0"></div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (IDR)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">
                Rp
              </span>
              <input
                type="text"
                {...register('amount', {
                  required: 'Amount is required',
                  validate: (value) => {
                    const numValue = parseInt(value.replace(/,/g, ''), 10);
                    if (isNaN(numValue) || numValue < 1000) {
                      return 'Minimum amount is Rp 1,000';
                    }
                    return true;
                  },
                })}
                onChange={handleAmountChange}
                value={watch('amount')}
                placeholder="0"
                className="w-full pl-12 pr-4 py-4 text-3xl font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-venmo-primary focus:border-transparent"
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
            )}
          </div>

          {/* Recipient Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {mode === 'pay' ? 'Pay to' : 'Request from'}
            </label>
            {selectedRecipient ? (
              <div className="flex items-center gap-2 p-3 bg-venmo-light rounded-lg border border-venmo-primary">
                <div className="w-10 h-10 rounded-full bg-venmo-primary flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  {selectedRecipient.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">
                    {selectedRecipient.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">@{selectedRecipient.username}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRecipient(null);
                    setValue('recipientId', '');
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1 flex-shrink-0"
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowContactsList(true)}
                className="w-full flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-venmo-primary hover:bg-venmo-light transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <FaSearch className="text-gray-400" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-700">
                    {mode === 'pay' ? 'Select recipient' : 'Select from contacts'}
                  </p>
                  <p className="text-xs text-gray-500">Tap to browse contacts and friends</p>
                </div>
              </button>
            )}
            <input
              type="hidden"
              {...register('recipientId', { required: 'Recipient is required' })}
              value={selectedRecipient?.id || ''}
            />
            {errors.recipientId && (
              <p className="mt-1 text-sm text-red-600">{errors.recipientId.message}</p>
            )}
          </div>

          {/* Note with Emoji Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What's this for?
            </label>
            <div className="relative">
              <input
                type="text"
                {...register('note')}
                placeholder="Dinner, rent, pizza 🍕"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-venmo-primary focus:border-transparent pr-10"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setShowEmojiPicker(!showEmojiPicker);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-2xl hover:scale-110 transition-transform"
              >
                😊
              </button>
            </div>
            {showEmojiPicker && (
              <div className="absolute z-50 mt-2">
                <EmojiPicker 
                  onEmojiClick={onEmojiClick}
                  skinTonesDisabled
                  searchDisabled={false}
                />
              </div>
            )}
          </div>

          {/* Privacy Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Privacy
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setValue('privacy', 'public')}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-colors ${
                  privacy === 'public'
                    ? 'border-venmo-primary bg-venmo-light text-venmo-primary'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <FaGlobe />
                <span className="text-sm font-semibold">Public</span>
              </button>
              <button
                type="button"
                onClick={() => setValue('privacy', 'friends')}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-colors ${
                  privacy === 'friends'
                    ? 'border-venmo-primary bg-venmo-light text-venmo-primary'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <FaUsers />
                <span className="text-sm font-semibold">Friends</span>
              </button>
              <button
                type="button"
                onClick={() => setValue('privacy', 'private')}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-colors ${
                  privacy === 'private'
                    ? 'border-venmo-primary bg-venmo-light text-venmo-primary'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <FaLock />
                <span className="text-sm font-semibold">Private</span>
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !selectedRecipient}
            className="w-full bg-venmo-primary text-white py-4 rounded-lg font-semibold text-lg hover:bg-venmo-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : mode === 'pay' ? 'Pay' : 'Request'} Rp{' '}
            {(watch('amount')?.replace(/,/g, '') || '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          </button>
        </form>
      </main>

      <BottomNav />
      <AccountSwitcher />

      {/* Contacts List Modal */}
      <AnimatePresence>
        {showContactsList && (
          <ContactsList
            users={mockData.users}
            currentUserId={user?.id || ''}
            onSelect={handleRecipientSelect}
            onClose={() => setShowContactsList(false)}
            mode={mode}
          />
        )}
      </AnimatePresence>
    </div>
  );
}