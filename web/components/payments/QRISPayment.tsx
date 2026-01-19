'use client';

import { useState, useEffect } from 'react';
import { FaQrcode, FaCheckCircle } from 'react-icons/fa';
import { motion } from 'framer-motion';

interface QRISPaymentProps {
  amount: number;
  onComplete: () => void;
}

export default function QRISPayment({ amount, onComplete }: QRISPaymentProps) {
  const [qrCode, setQrCode] = useState<string>('');
  const [status, setStatus] = useState<'generating' | 'ready' | 'processing' | 'completed'>('generating');

  useEffect(() => {
    // Generate QRIS code (mock)
    const generateQRIS = async () => {
      // Simulate QRIS generation
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setQrCode('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjAwIiBmaWxsPSIjMDA4Q0ZGIi8+PC9zdmc+'); // Placeholder
      setStatus('ready');
    };

    generateQRIS();
  }, []);

  const handlePayment = async () => {
    setStatus('processing');
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setStatus('completed');
    setTimeout(() => onComplete(), 1000);
  };

  return (
    <div className="bg-white rounded-lg p-6 space-y-6">
      <div className="text-center">
        <FaQrcode className="mx-auto text-venmo-primary mb-4" size={64} />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Scan QRIS Code</h3>
        <p className="text-gray-600 mb-4">
          Scan this QR code with your banking app to complete payment
        </p>
        <p className="text-2xl font-bold text-venmo-primary mb-6">
          {new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
          }).format(amount)}
        </p>
      </div>

      {status === 'generating' && (
        <div className="flex items-center justify-center py-12">
          <div className="w-16 h-16 border-4 border-venmo-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {status === 'ready' && qrCode && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center"
        >
          <div className="bg-white p-4 rounded-lg border-4 border-venmo-primary mb-4">
            <div className="w-48 h-48 bg-gray-100 flex items-center justify-center">
              <FaQrcode size={120} className="text-venmo-primary" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Supported: BCA, Mandiri, BRI, BNI, CIMB, GoPay, OVO, DANA
          </p>
          <button
            onClick={handlePayment}
            className="w-full bg-venmo-primary text-white py-3 rounded-lg font-semibold hover:bg-venmo-dark transition-colors"
          >
            I've Paid
          </button>
        </motion.div>
      )}

      {status === 'processing' && (
        <div className="text-center py-8">
          <div className="w-16 h-16 border-4 border-venmo-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Processing payment...</p>
        </div>
      )}

      {status === 'completed' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-8"
        >
          <FaCheckCircle className="mx-auto text-green-500 mb-4" size={64} />
          <p className="text-xl font-bold text-gray-900">Payment Successful!</p>
        </motion.div>
      )}
    </div>
  );
}