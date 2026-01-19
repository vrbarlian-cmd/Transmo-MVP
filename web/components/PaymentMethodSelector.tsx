'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaQrcode, FaUniversity, FaCheck } from 'react-icons/fa';
import { Transaction } from '@/types';

interface PaymentMethodSelectorProps {
  transaction: Transaction;
  onSelectMethod: (method: 'bca' | 'mandiri' | 'bni' | 'bri' | 'qris') => void;
  onClose: () => void;
}

const bankMethods = [
  { id: 'bca' as const, name: 'BCA', icon: '🏦' },
  { id: 'mandiri' as const, name: 'Bank Mandiri', icon: '🏦' },
  { id: 'bni' as const, name: 'BNI', icon: '🏦' },
  { id: 'bri' as const, name: 'BRI', icon: '🏦' },
];

export default function PaymentMethodSelector({
  transaction,
  onSelectMethod,
  onClose,
}: PaymentMethodSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<'bca' | 'mandiri' | 'bni' | 'bri' | 'qris' | null>(null);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleMethodSelect = (method: 'bca' | 'mandiri' | 'bni' | 'bri' | 'qris') => {
    setSelectedMethod(method);
    // Small delay for visual feedback
    setTimeout(() => {
      onSelectMethod(method);
    }, 200);
  };

  return (
    <AnimatePresence>
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
          className="bg-white rounded-t-2xl w-full max-w-md mx-auto max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-xl font-bold text-gray-900">Select Payment Method</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FaTimes className="text-gray-600" />
            </button>
          </div>

          {/* Transaction Info */}
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex-shrink-0">
            <div className="text-center">
              <p className="text-sm text-gray-600">Pay to</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {transaction.type === 'request' ? transaction.sender.name : transaction.recipient.name}
              </p>
              <p className="text-2xl font-bold text-venmo-primary mt-2">
                {formatAmount(transaction.amount)}
              </p>
              {transaction.note && (
                <p className="text-sm text-gray-600 mt-2">"{transaction.note}"</p>
              )}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              {/* Bank Transfer Section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 px-2">
                  Bank Transfer
                </h3>
                <div className="space-y-2">
                  {bankMethods.map((bank) => (
                    <button
                      key={bank.id}
                      onClick={() => handleMethodSelect(bank.id)}
                      disabled={selectedMethod !== null}
                      className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                        selectedMethod === bank.id
                          ? 'border-venmo-primary bg-venmo-light'
                          : selectedMethod !== null
                          ? 'border-gray-200 opacity-50 cursor-not-allowed'
                          : 'border-gray-200 hover:border-venmo-primary hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-2xl">{bank.icon}</div>
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-gray-900">{bank.name}</p>
                        <p className="text-sm text-gray-500">Bank Transfer</p>
                      </div>
                      {selectedMethod === bank.id && (
                        <FaCheck className="text-venmo-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* QRIS Section */}
              <div className="pt-2">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 px-2">
                  Other Payment Methods
                </h3>
                <button
                  onClick={() => handleMethodSelect('qris')}
                  disabled={selectedMethod !== null}
                  className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                    selectedMethod === 'qris'
                      ? 'border-venmo-primary bg-venmo-light'
                      : selectedMethod !== null
                      ? 'border-gray-200 opacity-50 cursor-not-allowed'
                      : 'border-gray-200 hover:border-venmo-primary hover:bg-gray-50'
                  }`}
                >
                  <FaQrcode className="text-2xl text-venmo-primary" />
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-gray-900">QRIS</p>
                    <p className="text-sm text-gray-500">Scan QR Code</p>
                  </div>
                  {selectedMethod === 'qris' && (
                    <FaCheck className="text-venmo-primary" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <p className="text-xs text-gray-500 text-center">
              You will be redirected to complete the payment
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
