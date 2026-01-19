'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaQrcode, FaArrowLeft, FaCamera } from 'react-icons/fa';
import { useAuthStore } from '@/lib/store';
import BottomNav from '@/components/BottomNav';
import Logo from '@/components/Logo';
import AccountSwitcher from '@/components/AccountSwitcher';

export default function QRISPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [mode, setMode] = useState<'scan' | 'generate'>('scan');
  const [amount, setAmount] = useState('');
  const [qrCode, setQrCode] = useState<string>('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, router]);

  const formatAmount = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatAmount(e.target.value);
    setAmount(formatted);
  };

  const generateQRIS = async () => {
    if (!amount) {
      alert('Please enter an amount');
      return;
    }

    const numericAmount = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(numericAmount) || numericAmount < 1000) {
      alert('Minimum amount is Rp 1,000');
      return;
    }

    // Simulate QRIS generation
    setQrCode('generating');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Mock QRIS code (in production, this would come from payment gateway)
    setQrCode('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzAwOENGRiIvPjwvc3ZnPg==');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
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
        {/* Mode Toggle */}
        <div className="bg-white rounded-lg p-1 mb-6 flex gap-1">
          <button
            onClick={() => setMode('scan')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-colors ${
              mode === 'scan'
                ? 'bg-venmo-primary text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FaCamera className="inline mr-2" />
            Scan QRIS
          </button>
          <button
            onClick={() => setMode('generate')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-colors ${
              mode === 'generate'
                ? 'bg-venmo-primary text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FaQrcode className="inline mr-2" />
            Generate QRIS
          </button>
        </div>

        {mode === 'scan' ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="mb-6">
              <FaCamera className="mx-auto text-venmo-primary mb-4" size={64} />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Scan QRIS Code</h2>
              <p className="text-gray-600">
                Point your camera at a QRIS code to pay
              </p>
            </div>
            <div className="bg-gray-100 rounded-lg p-12 mb-4 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-4 border-dashed border-gray-300 rounded-lg"></div>
              </div>
              <p className="text-sm text-gray-500 mt-64">
                Camera preview would appear here
              </p>
            </div>
            <p className="text-xs text-gray-500">
              In production, this would use device camera to scan QRIS codes
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Generate QRIS Payment</h2>
            
            {/* Amount Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (IDR)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">
                  Rp
                </span>
                <input
                  type="text"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="0"
                  className="w-full pl-12 pr-4 py-4 text-2xl font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-venmo-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Generate Button */}
            {!qrCode && (
              <button
                onClick={generateQRIS}
                className="w-full bg-venmo-primary text-white py-4 rounded-lg font-semibold text-lg hover:bg-venmo-dark transition-colors"
              >
                Generate QRIS Code
              </button>
            )}

            {/* QRIS Code Display */}
            {qrCode === 'generating' && (
              <div className="flex items-center justify-center py-12">
                <div className="w-16 h-16 border-4 border-venmo-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {qrCode && qrCode !== 'generating' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <div className="bg-white p-4 rounded-lg border-4 border-venmo-primary mb-4 inline-block">
                  <div className="w-64 h-64 bg-gray-100 flex items-center justify-center">
                    <FaQrcode size={120} className="text-venmo-primary" />
                  </div>
                </div>
                <p className="text-lg font-bold text-gray-900 mb-2">
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                  }).format(parseFloat(amount.replace(/,/g, '')))}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Scan this QR code with your banking app or e-wallet to complete payment
                </p>
                <p className="text-xs text-gray-500">
                  Supported: BCA, Mandiri, BRI, BNI, CIMB, GoPay, OVO, DANA, ShopeePay
                </p>
                <button
                  onClick={() => {
                    setQrCode('');
                    setAmount('');
                  }}
                  className="mt-4 text-venmo-primary text-sm font-semibold hover:text-venmo-dark"
                >
                  Generate New Code
                </button>
              </motion.div>
            )}
          </div>
        )}
      </main>

      <BottomNav />
      <AccountSwitcher />
    </div>
  );
}
