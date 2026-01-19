'use client';

import { useRouter } from 'next/navigation';
import { FaQrcode } from 'react-icons/fa';
import { motion } from 'framer-motion';

export default function FloatingQRISButton() {
  const router = useRouter();

  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => router.push('/qris')}
      className="fixed bottom-24 right-4 z-50 bg-venmo-primary text-white p-4 rounded-full shadow-lg hover:bg-venmo-dark transition-colors"
      aria-label="Open QRIS Payment"
    >
      <FaQrcode size={24} />
    </motion.button>
  );
}
