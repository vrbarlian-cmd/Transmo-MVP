'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FaQrcode, FaLock, FaUsers, FaGlobe, FaCheck, FaArrowLeft } from 'react-icons/fa';
import { useAuthStore, useFeedStore } from '@/lib/store';
import BottomNav from '@/components/BottomNav';
import Logo from '@/components/Logo';
import AccountSwitcher from '@/components/AccountSwitcher';

export default function QRISPayPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { addTransaction } = useFeedStore();
  const [selectedPrivacy, setSelectedPrivacy] = useState<'public' | 'friends' | 'private' | null>(null);
  const [showAmountOnFeed, setShowAmountOnFeed] = useState(true); // Default: show amount
  const [showPrivacySelector, setShowPrivacySelector] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Mock merchant data - Kopi Kenangan
  const merchant = {
    name: 'Kopi Kenangan',
    amount: 10000,
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handlePayClick = () => {
    if (!user) return;
    // Show privacy selector before payment
    setShowPrivacySelector(true);
  };

  const handlePrivacySelect = (privacy: 'public' | 'friends' | 'private') => {
    setSelectedPrivacy(privacy);
    // If privacy is private, always hide amount
    if (privacy === 'private') {
      setShowAmountOnFeed(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!user || !selectedPrivacy) return;

    setProcessing(true);

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Create transaction record with privacy level
      const transaction = {
        id: `qris-${Date.now()}`,
        senderId: user.id,
        sender: user,
        recipientId: 'merchant-kopi-kenangan', // Merchant ID
        recipient: {
          id: 'merchant-kopi-kenangan',
          username: 'kopikenangan',
          name: 'Kopi Kenangan',
          phone: '',
          createdAt: new Date(),
          kycVerified: true,
        },
        amount: merchant.amount,
        note: `Payment to ${merchant.name}`,
        privacy: selectedPrivacy,
        showAmountOnFeed: selectedPrivacy === 'private' ? false : showAmountOnFeed, // Private always hides amount
        status: 'completed' as const,
        paymentMethod: 'qris' as const,
        type: 'payment' as const,
        createdAt: new Date(),
        likes: [],
        comments: [],
      };

      // Add transaction to feed
      addTransaction(transaction);

      // Show success and redirect
      alert(`Payment successful! ${formatAmount(merchant.amount)} paid to ${merchant.name}`);
      router.push('/home');
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  if (!isAuthenticated || !user) {
    router.push('/auth');
    return null;
  }

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
        {/* QR Code Display */}
        <div className="bg-white rounded-lg p-8 text-center mb-6">
          <div className="mb-6">
            <div className="bg-white p-6 rounded-lg border-4 border-venmo-primary mb-6 inline-block">
              <div className="w-64 h-64 bg-gray-100 flex items-center justify-center rounded-lg">
                <FaQrcode size={180} className="text-venmo-primary" />
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-2">Merchant</p>
            <p className="text-xl font-bold text-gray-900 mb-4">{merchant.name}</p>
            <p className="text-sm text-gray-600 mb-2">Amount</p>
            <p className="text-3xl font-bold text-venmo-primary">{formatAmount(merchant.amount)}</p>
          </div>

          {/* Pay Button */}
          <button
            onClick={handlePayClick}
            disabled={processing}
            className="w-full bg-venmo-primary text-white py-4 rounded-lg font-semibold text-lg hover:bg-venmo-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? 'Processing...' : 'Pay'}
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center">
          Scan this QR code or pay directly
        </p>
      </main>

      {/* Privacy Selector Modal */}
      <AnimatePresence>
        {showPrivacySelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end"
            onClick={() => !selectedPrivacy && setShowPrivacySelector(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white rounded-t-2xl w-full max-w-md mx-auto flex flex-col shadow-xl"
              style={{ 
                maxHeight: 'calc(65vh - env(safe-area-inset-bottom))',
                marginBottom: 'calc(80px + env(safe-area-inset-bottom))',
                maxWidth: 'calc(100vw - 2rem)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
                <h2 className="text-xl font-bold text-gray-900">Select Privacy</h2>
                {selectedPrivacy && (
                  <button
                    onClick={() => {
                      setSelectedPrivacy(null);
                      setShowPrivacySelector(false);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {/* Privacy Options */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                <p className="text-sm text-gray-600 mb-4">
                  Choose who can see this transaction
                </p>

                {/* Show Amount Toggle - Only show if not Private */}
                {selectedPrivacy !== 'private' && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">Show amount on social feed</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {showAmountOnFeed ? 'Amount will be visible' : 'Amount will be hidden'}
                        </p>
                      </div>
                      <button
                        onClick={() => setShowAmountOnFeed(!showAmountOnFeed)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          showAmountOnFeed ? 'bg-venmo-primary' : 'bg-gray-300'
                        }`}
                      >
                        <div
                          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            showAmountOnFeed ? 'translate-x-6' : ''
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                )}

                {selectedPrivacy === 'private' && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-yellow-800">
                      💡 Private transactions always hide amounts on the social feed for privacy.
                    </p>
                  </div>
                )}

                {/* Public */}
                <button
                  onClick={() => handlePrivacySelect('public')}
                  className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
                    selectedPrivacy === 'public'
                      ? 'border-venmo-primary bg-venmo-light'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FaGlobe className="text-venmo-primary text-xl" />
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">Public</p>
                      <p className="text-sm text-gray-500">Visible to everyone</p>
                    </div>
                  </div>
                  {selectedPrivacy === 'public' && <FaCheck className="text-venmo-primary" />}
                </button>

                {/* Friends */}
                <button
                  onClick={() => handlePrivacySelect('friends')}
                  className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
                    selectedPrivacy === 'friends'
                      ? 'border-venmo-primary bg-venmo-light'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FaUsers className="text-venmo-primary text-xl" />
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">Friends</p>
                      <p className="text-sm text-gray-500">Visible to friends only</p>
                    </div>
                  </div>
                  {selectedPrivacy === 'friends' && <FaCheck className="text-venmo-primary" />}
                </button>

                {/* Private */}
                <button
                  onClick={() => handlePrivacySelect('private')}
                  className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
                    selectedPrivacy === 'private'
                      ? 'border-venmo-primary bg-venmo-light'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FaLock className="text-venmo-primary text-xl" />
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">Private</p>
                      <p className="text-sm text-gray-500">Only visible to you</p>
                    </div>
                  </div>
                  {selectedPrivacy === 'private' && <FaCheck className="text-venmo-primary" />}
                </button>
              </div>

              {/* Confirm Button */}
              <div className="p-4 border-t border-gray-200 flex-shrink-0 bg-white">
                <button
                  onClick={handleConfirmPayment}
                  disabled={!selectedPrivacy || processing}
                  className="w-full bg-venmo-primary text-white py-3 rounded-lg font-semibold text-lg hover:bg-venmo-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'Processing Payment...' : 'Confirm Payment'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
      <AccountSwitcher />
    </div>
  );
}
