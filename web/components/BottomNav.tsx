'use client';

import { usePathname, useRouter } from 'next/navigation';
import { FaHome, FaMoneyBillWave, FaUser, FaBell, FaQrcode } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useNotificationStore, useAuthStore } from '@/lib/store';
import { useEffect, useState } from 'react';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const getPendingActionableCount = useNotificationStore((state) => state.getPendingActionableCount);
  const pendingActionableCount = user ? getPendingActionableCount(user.id) : 0;

  const navItems: Array<{
    path: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    label: string;
    badge?: number;
    prominent?: boolean;
  }> = [
    { path: '/home', icon: FaHome, label: 'Home' },
    { path: '/pay', icon: FaMoneyBillWave, label: 'Pay' },
    { path: '/qris-pay', icon: FaQrcode, label: 'QRIS', prominent: true },
    { path: '/notifications', icon: FaBell, label: 'Notifications', badge: pendingActionableCount },
    { path: '/profile', icon: FaUser, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="max-w-md mx-auto flex justify-around items-center h-16 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          const badgeCount = 'badge' in item ? item.badge : 0;
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className="flex flex-col items-center justify-center flex-1 h-full transition-colors relative"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={`p-2 rounded-full relative ${
                  isActive ? 'text-venmo-primary' : 'text-gray-400'
                } ${'prominent' in item && item.prominent ? 'bg-venmo-primary text-white' : ''}`}
              >
                <Icon size={24} />
                {badgeCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-venmo-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </span>
                )}
              </motion.div>
              <span
                className={`text-xs mt-1 ${
                  isActive ? 'text-venmo-primary font-semibold' : 'text-gray-400'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}