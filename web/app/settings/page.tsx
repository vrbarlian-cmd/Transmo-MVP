'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FaArrowLeft, FaCamera, FaEdit, FaCreditCard, FaShieldAlt, FaLock, FaUsers, FaBell, FaGlobe, FaQuestionCircle, FaInfoCircle, FaChevronRight, FaCheck } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/lib/store';
import BottomNav from '@/components/BottomNav';
import Logo from '@/components/Logo';
import AccountSwitcher from '@/components/AccountSwitcher';

interface UserSettings {
  firstName: string;
  lastName: string;
  profilePhoto?: string;
  defaultPrivacy: 'public' | 'friends' | 'private';
  paymentRequestsFrom: 'everyone' | 'friends';
  discoverableByUsername: boolean;
  faceIdEnabled: boolean;
  passcodeEnabled: boolean;
  autoLock: 'immediate' | '30s' | '1min';
  pushNotifications: {
    paymentRequests: boolean;
    paymentsReceived: boolean;
    reminders: boolean;
  };
  inAppNotifications: boolean;
}

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  isPrimary: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [editingName, setEditingName] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }

    if (!user) return;

    // Initialize settings from user data
    const nameParts = user.name.split(' ');
    const defaultSettings: UserSettings = {
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      profilePhoto: user.profilePhoto,
      defaultPrivacy: 'public',
      paymentRequestsFrom: 'everyone',
      discoverableByUsername: true,
      faceIdEnabled: false,
      passcodeEnabled: false,
      autoLock: 'immediate',
      pushNotifications: {
        paymentRequests: true,
        paymentsReceived: true,
        reminders: true,
      },
      inAppNotifications: true,
    };

    // Load from localStorage per account
    const savedSettings = localStorage.getItem(`settings_${user.id}`);
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings({ ...defaultSettings, ...parsed });
    } else {
      setSettings(defaultSettings);
    }

    setFirstName(defaultSettings.firstName);
    setLastName(defaultSettings.lastName);

    // Load bank accounts (mock data)
    const mockBankAccounts: BankAccount[] = [
      {
        id: '1',
        bankName: 'BCA',
        accountNumber: '1234567890',
        accountHolder: user.name,
        isPrimary: true,
      },
    ];
    setBankAccounts(mockBankAccounts);
  }, [isAuthenticated, router, user]);

  const saveSettings = (updatedSettings: Partial<UserSettings>) => {
    if (!user || !settings) return;
    const newSettings = { ...settings, ...updatedSettings };
    setSettings(newSettings);
    localStorage.setItem(`settings_${user.id}`, JSON.stringify(newSettings));
  };

  const handleSaveName = () => {
    if (!settings) return;
    const fullName = `${firstName} ${lastName}`.trim();
    saveSettings({ firstName, lastName });
    // Update user in store
    useAuthStore.getState().setUser({ ...user!, name: fullName });
    setEditingName(false);
  };

  if (!isAuthenticated || !user || !settings) {
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
          <h1 className="text-xl font-bold text-gray-900 flex-1">Settings</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {/* Account Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg mb-4 overflow-hidden"
        >
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Account</h2>
          </div>
          
          <div className="divide-y divide-gray-100">
            {/* Profile Picture */}
            <div className="p-4 flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-full overflow-hidden bg-venmo-light flex-shrink-0">
                <Image
                  src={settings.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                  alt={user.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Profile Picture</p>
                <button className="text-sm text-venmo-primary mt-1 flex items-center gap-1">
                  <FaCamera className="text-xs" />
                  Change photo
                </button>
              </div>
            </div>

            {/* Name */}
            <div className="p-4">
              {editingName ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-venmo-primary focus:border-transparent"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-venmo-primary focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveName}
                      className="flex-1 bg-venmo-primary text-white py-2 rounded-lg font-semibold hover:bg-venmo-dark transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setFirstName(settings.firstName);
                        setLastName(settings.lastName);
                        setEditingName(false);
                      }}
                      className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Name</p>
                  <div className="flex items-center justify-between">
                    <p className="text-gray-900">{settings.firstName} {settings.lastName}</p>
                    <button
                      onClick={() => setEditingName(true)}
                      className="text-venmo-primary flex items-center gap-1 text-sm"
                    >
                      <FaEdit className="text-xs" />
                      Edit
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Username (Read-only) */}
            <div className="p-4">
              <p className="text-sm font-medium text-gray-700 mb-1">Username</p>
              <p className="text-gray-900">@{user.username}</p>
            </div>
          </div>
        </motion.section>

        {/* Payment Methods Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg mb-4 overflow-hidden"
        >
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Payment Methods</h2>
          </div>
          
          <div className="divide-y divide-gray-100">
            {bankAccounts.map((account) => (
              <div key={account.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FaCreditCard className="text-venmo-primary text-xl" />
                  <div>
                    <p className="font-semibold text-gray-900">{account.bankName}</p>
                    <p className="text-sm text-gray-500">****{account.accountNumber.slice(-4)}</p>
                    {account.isPrimary && (
                      <span className="text-xs text-venmo-primary font-medium">Primary</span>
                    )}
                  </div>
                </div>
                <FaChevronRight className="text-gray-400" />
              </div>
            ))}
            <button className="p-4 w-full text-left text-venmo-primary font-semibold flex items-center gap-2">
              <FaCreditCard />
              Add Bank Account
            </button>
          </div>
        </motion.section>

        {/* Security Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg mb-4 overflow-hidden"
        >
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Security</h2>
          </div>
          
          <div className="divide-y divide-gray-100">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaShieldAlt className="text-gray-600" />
                <div>
                  <p className="font-semibold text-gray-900">Face ID / Biometric Login</p>
                  <p className="text-sm text-gray-500">Use biometric authentication</p>
                </div>
              </div>
              <button
                onClick={() => saveSettings({ faceIdEnabled: !settings.faceIdEnabled })}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.faceIdEnabled ? 'bg-venmo-primary' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.faceIdEnabled ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>

            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaLock className="text-gray-600" />
                <div>
                  <p className="font-semibold text-gray-900">Passcode</p>
                  <p className="text-sm text-gray-500">Require passcode to open app</p>
                </div>
              </div>
              <button
                onClick={() => saveSettings({ passcodeEnabled: !settings.passcodeEnabled })}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.passcodeEnabled ? 'bg-venmo-primary' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.passcodeEnabled ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>

            {settings.passcodeEnabled && (
              <button className="p-4 w-full text-left text-venmo-primary font-semibold flex items-center gap-2">
                <FaLock />
                Change Passcode
              </button>
            )}

            <div className="p-4">
              <p className="font-semibold text-gray-900 mb-2">Auto-lock</p>
              <div className="space-y-2">
                {(['immediate', '30s', '1min'] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => saveSettings({ autoLock: option })}
                    className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg"
                  >
                    <span className="text-gray-900">
                      {option === 'immediate' ? 'Immediate' : option === '30s' ? '30 seconds' : '1 minute'}
                    </span>
                    {settings.autoLock === option && <FaCheck className="text-venmo-primary" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        {/* Privacy Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg mb-4 overflow-hidden"
        >
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Privacy</h2>
          </div>
          
          <div className="divide-y divide-gray-100">
            <div className="p-4">
              <p className="font-semibold text-gray-900 mb-3">Default Transaction Visibility</p>
              <div className="space-y-2">
                {(['public', 'friends', 'private'] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => saveSettings({ defaultPrivacy: option })}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="text-left">
                      <p className="font-semibold text-gray-900 capitalize">{option}</p>
                      <p className="text-xs text-gray-500">
                        {option === 'public' && 'Everyone can see your transactions'}
                        {option === 'friends' && 'Only friends can see your transactions'}
                        {option === 'private' && 'Only you and the other person can see'}
                      </p>
                    </div>
                    {settings.defaultPrivacy === option && <FaCheck className="text-venmo-primary" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        {/* Notifications Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg mb-4 overflow-hidden"
        >
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Notifications</h2>
          </div>
          
          <div className="divide-y divide-gray-100">
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">Payment Requests</p>
                <p className="text-sm text-gray-500">Get notified when someone requests money</p>
              </div>
              <button
                onClick={() => saveSettings({
                  pushNotifications: {
                    ...settings.pushNotifications,
                    paymentRequests: !settings.pushNotifications.paymentRequests,
                  },
                })}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.pushNotifications.paymentRequests ? 'bg-venmo-primary' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.pushNotifications.paymentRequests ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>

            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">Payments Received</p>
                <p className="text-sm text-gray-500">Get notified when you receive money</p>
              </div>
              <button
                onClick={() => saveSettings({
                  pushNotifications: {
                    ...settings.pushNotifications,
                    paymentsReceived: !settings.pushNotifications.paymentsReceived,
                  },
                })}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.pushNotifications.paymentsReceived ? 'bg-venmo-primary' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.pushNotifications.paymentsReceived ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>

            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">Reminders</p>
                <p className="text-sm text-gray-500">Get reminded about pending requests</p>
              </div>
              <button
                onClick={() => saveSettings({
                  pushNotifications: {
                    ...settings.pushNotifications,
                    reminders: !settings.pushNotifications.reminders,
                  },
                })}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.pushNotifications.reminders ? 'bg-venmo-primary' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.pushNotifications.reminders ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>

            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">In-app Notifications</p>
                <p className="text-sm text-gray-500">Show notifications within the app</p>
              </div>
              <button
                onClick={() => saveSettings({ inAppNotifications: !settings.inAppNotifications })}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.inAppNotifications ? 'bg-venmo-primary' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.inAppNotifications ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
          </div>
        </motion.section>

        {/* Friends & Social Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-lg mb-4 overflow-hidden"
        >
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Friends & Social</h2>
          </div>
          
          <div className="divide-y divide-gray-100">
            <div className="p-4">
              <p className="font-semibold text-gray-900 mb-3">Who can send you payment requests</p>
              <div className="space-y-2">
                {(['everyone', 'friends'] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => saveSettings({ paymentRequestsFrom: option })}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <span className="font-semibold text-gray-900 capitalize">{option === 'everyone' ? 'Everyone' : 'Friends only'}</span>
                    {settings.paymentRequestsFrom === option && <FaCheck className="text-venmo-primary" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">Discoverable by Username</p>
                <p className="text-sm text-gray-500">Allow others to find you by username</p>
              </div>
              <button
                onClick={() => saveSettings({ discoverableByUsername: !settings.discoverableByUsername })}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.discoverableByUsername ? 'bg-venmo-primary' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.discoverableByUsername ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
          </div>
        </motion.section>

        {/* Support Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-lg mb-4 overflow-hidden"
        >
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Support</h2>
          </div>
          
          <div className="divide-y divide-gray-100">
            <button className="p-4 w-full text-left flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <FaQuestionCircle className="text-gray-600" />
                <span className="font-semibold text-gray-900">Help & FAQ</span>
              </div>
              <FaChevronRight className="text-gray-400" />
            </button>
            <button className="p-4 w-full text-left flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <FaQuestionCircle className="text-gray-600" />
                <span className="font-semibold text-gray-900">Contact Support</span>
              </div>
              <FaChevronRight className="text-gray-400" />
            </button>
          </div>
        </motion.section>

        {/* Legal Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-lg mb-4 overflow-hidden"
        >
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Legal</h2>
          </div>
          
          <div className="divide-y divide-gray-100">
            <button className="p-4 w-full text-left flex items-center justify-between hover:bg-gray-50">
              <span className="font-semibold text-gray-900">Terms of Service</span>
              <FaChevronRight className="text-gray-400" />
            </button>
            <button className="p-4 w-full text-left flex items-center justify-between hover:bg-gray-50">
              <span className="font-semibold text-gray-900">Privacy Policy</span>
              <FaChevronRight className="text-gray-400" />
            </button>
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaInfoCircle className="text-gray-600" />
                <span className="font-semibold text-gray-900">App Version</span>
              </div>
              <span className="text-sm text-gray-500">1.0.0</span>
            </div>
          </div>
        </motion.section>
      </main>

      <BottomNav />
      <AccountSwitcher />
    </div>
  );
}
