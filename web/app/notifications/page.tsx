'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FaBell, FaCheck, FaTimes, FaMoneyBillWave, FaEnvelope, FaBan } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useAuthStore, useNotificationStore, useFeedStore } from '@/lib/store';
import BottomNav from '@/components/BottomNav';
import Logo from '@/components/Logo';
import AccountSwitcher from '@/components/AccountSwitcher';
import PaymentMethodSelector from '@/components/PaymentMethodSelector';
import { Notification, Transaction } from '@/types';
import { format } from 'date-fns';

export default function NotificationsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const notifications = useNotificationStore((state) => state.notifications);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);
  const getUnreadCount = useNotificationStore((state) => state.getUnreadCount);
  const removeNotification = useNotificationStore((state) => state.removeNotification);
  const { updateTransaction, transactions } = useFeedStore();
  const [loading, setLoading] = useState(false);
  const [selectedRequestTransaction, setSelectedRequestTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth');
    }
    // Don't auto-mark all as read - keep unread badges for pending requests
  }, [isAuthenticated, router]);

  const handlePayRequest = (notification: Notification) => {
    // DON'T remove notification yet - only remove after payment is confirmed successful
    // Show payment method selector (payer action)
    setSelectedRequestTransaction(notification.transaction);
  };

  const handleRemindRequest = (notification: Notification) => {
    // Remind action for requester
    // Send a system/push-style reminder notification to the payer
    // Do NOT create a new in-app notification entry
    // The existing payment request remains pending
    const transaction = notification.transaction;
    
    // In a real app, this would send a push notification via Firebase/OneSignal/etc.
    // For now, we'll show an alert indicating the reminder was sent
    alert(`Reminder sent to ${transaction.recipient.name} about the payment request of ${formatAmount(transaction.amount)}${transaction.note ? ` for ${transaction.note}` : ''}\n\n(In production, this would send a push notification)`);
    
    // Don't mark as read - keep the notification visible
    // Don't create new notification - request stays pending
  };

  const handleCancelRequest = async (notification: Notification) => {
    if (!user) return;
    try {
      const requestTransaction = notification.transaction;

      // Update transaction status to cancelled
      updateTransaction(requestTransaction.id, {
        status: 'cancelled',
      });

      // Delete payment request notifications from BOTH requester and payer
      // No duplicate or historical notifications should remain
      const { notifications: allNotifications, setNotifications } = useNotificationStore.getState();
      
      // Remove requester's notification
      let updatedNotifications = allNotifications.filter((n) => n.id !== notification.id);
      
      // Remove payer's notification if it exists
      const payerNotification = updatedNotifications.find(
        (n) => n.transactionId === requestTransaction.id && n.type === 'payment_request' && n.userId === requestTransaction.recipientId
      );
      
      if (payerNotification) {
        updatedNotifications = updatedNotifications.filter((n) => n.id !== payerNotification.id);
      }
      
      // Apply all updates - both notifications deleted
      setNotifications(updatedNotifications);
    } catch (error) {
      console.error('Failed to cancel request:', error);
      alert('Failed to cancel request. Please try again.');
    }
  };

  const handlePaymentMethodSelected = async (method: 'bca' | 'mandiri' | 'bni' | 'bri' | 'qris') => {
    if (!selectedRequestTransaction || !user) return;
    setLoading(true);
    try {
      const requestTransaction = selectedRequestTransaction;
      const requester = requestTransaction.sender; // John Doe (the original requester)
      const payer = user; // Budi Kurniawan (the one paying)

      // Update the original request transaction to show as completed payment
      // Swap sender/recipient so it shows payment direction correctly
      // When User B pays User A's request:
      // - Original: senderId = User A, recipientId = User B
      // - Updated: senderId = User B (payer), recipientId = User A (receiver)
      // This way User A sees "Received from User B" and User B sees "Paid User A"
      const updatedTransaction = {
        ...requestTransaction,
        senderId: payer.id,
        recipientId: requester.id,
        sender: payer,
        recipient: requester,
        status: 'completed' as const,
        type: 'payment' as const,
        paymentMethod: method,
      };

      // Update the transaction status from pending to completed
      // This is the single source of truth - the same transaction object updates in place
      updateTransaction(requestTransaction.id, updatedTransaction);

      // Update the requester's notification in place (same notification object)
      // The notification's transaction reference needs to be updated to reflect the new "paid" status
      // Get the updated transaction from the store to ensure we have the latest version
      const { transactions: updatedTransactions } = useFeedStore.getState();
      const latestTransaction = updatedTransactions.find((t) => t.id === requestTransaction.id);
      
      if (latestTransaction) {
        // Update the requester's notification to reference the updated transaction
        // This ensures the notification reflects the new "paid" status instead of creating a new notification
        const { notifications: allNotifications, setNotifications } = useNotificationStore.getState();
        
        // Find both requester and payer notifications
        const requesterNotification = allNotifications.find(
          (n) => n.transactionId === requestTransaction.id && n.type === 'payment_request' && n.userId === requester.id
        );
        const payerNotification = allNotifications.find(
          (n) => n.transactionId === requestTransaction.id && n.type === 'payment_request' && n.userId === payer.id
        );
        
      // Update notifications array
      let updatedNotifications = allNotifications;
      
      // Update requester's notification transaction reference in place (pending → paid)
      // Same notification entry, just status updated - single source of truth
      if (requesterNotification) {
        updatedNotifications = updatedNotifications.map((n) =>
          n.id === requesterNotification.id
            ? { ...n, transaction: latestTransaction } // Update transaction reference in place
            : n
        );
      }
      
      // Delete payer's notification after payment is confirmed successful
      // Payer should no longer see the request notification once payment is successful
      // Badge will automatically update because we're removing the notification
      if (payerNotification) {
        updatedNotifications = updatedNotifications.filter((n) => n.id !== payerNotification.id);
      }
      
      // Apply all updates at once
      if (requesterNotification || payerNotification) {
        setNotifications(updatedNotifications);
      }
      }

      // For bank transfers: treat as internal confirmation flow (no external redirect)
      // Bank accounts are assumed to be already linked internally
      if (method !== 'qris') {
        // Payment is complete - no new notification needed
        // The requester's existing request notification will now show "Paid" status

        // Close the payment method selector
        setSelectedRequestTransaction(null);
        setLoading(false);

        // Show success message
        alert(`Payment of ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(requestTransaction.amount)} completed successfully via ${method.toUpperCase()}!`);
      } else {
        // For QRIS: redirect to QRIS payment page
        setSelectedRequestTransaction(null);
        router.push('/qris');
      }
    } catch (error) {
      console.error('Failed to process payment:', error);
      alert('Failed to process payment. Please try again.');
      setSelectedRequestTransaction(null);
      setLoading(false);
    }
  };

  const handleDeclineRequest = async (notification: Notification) => {
    if (!user) return;
    try {
      const requestTransaction = notification.transaction;

      // Update transaction status to declined
      updateTransaction(requestTransaction.id, {
        status: 'declined',
      });

      // Delete payment request notification from payer's view
      // Payer should no longer see the request notification once declined
      const { notifications: allNotifications, setNotifications } = useNotificationStore.getState();
      
      // Remove payer's notification
      let updatedNotifications = allNotifications.filter((n) => n.id !== notification.id);

      // Get the updated transaction from the store
      const { transactions: updatedTransactions } = useFeedStore.getState();
      const updatedTransaction = updatedTransactions.find((t) => t.id === requestTransaction.id);

      if (updatedTransaction) {
        // Update requester's notification in place (pending → declined)
        // Same notification entry, just status updated - no new notification created
        const requesterNotification = updatedNotifications.find(
          (n) => n.transactionId === requestTransaction.id && n.type === 'payment_request' && n.userId === requestTransaction.senderId
        );
        
        if (requesterNotification) {
          // Update the same notification entry to show declined status
          updatedNotifications = updatedNotifications.map((n) =>
            n.id === requesterNotification.id
              ? { ...n, transaction: updatedTransaction } // Update transaction reference in place
              : n
          );
        }
        
        // Apply all updates
        setNotifications(updatedNotifications);
      }
    } catch (error) {
      console.error('Failed to decline request:', error);
      alert('Failed to decline request. Please try again.');
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  // Filter notifications for current user
  // Key rules for payment request notifications on payer side:
  // 1. Payment request notifications are visible to payer (recipient) ONLY when status is pending
  // 2. Payer's notification is immediately deleted when they press "Pay" or "Decline"
  // 3. Any terminal action (paid or declined) removes the notification entirely from payer's view
  // 4. Payer should only see actionable, pending requests
  // 
  // Rules for requester side:
  // 1. Requester sees pending requests
  // 2. Requester's notification transitions from "pending" to "paid" status when payment is completed
  // 3. Requester sees decline notification when payer declines
  const sortedNotifications = notifications
    .filter((n) => {
      if (n.userId !== user?.id) return false;
      
      // Payment request notifications filtering
      if (n.type === 'payment_request') {
        // For payer (recipient) - only show pending requests
        // Completed, declined, and cancelled requests are completely removed (not just hidden)
        if (n.transaction.recipientId === user.id) {
          // Payer side: only show if status is pending
          // If status is completed, declined, or cancelled, the notification should already be deleted
          // This is a defensive check in case notification wasn't deleted for some reason
          return n.transaction.status === 'pending';
        }
        
        // For requester (sender) - show pending, completed (paid), and declined requests
        // Cancelled requests should be completely removed (deleted when cancelled)
        if (n.transaction.senderId === user.id) {
          // Show pending, completed, and declined requests
          // Don't show cancelled requests (they should be deleted)
          return n.transaction.status !== 'cancelled';
        }
      }
      
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="min-h-screen bg-gray-50 pb-20" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="md" />
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4">
        {sortedNotifications.length === 0 ? (
          <div className="text-center py-12">
            <FaBell className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-500">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedNotifications.map((notification) => {
              const transaction = notification.transaction;
              const isPaymentRequest = notification.type === 'payment_request';
              const isPending = transaction.status === 'pending';
              const isDeclined = transaction.status === 'declined';
              const isCompleted = transaction.status === 'completed';
              const isCancelled = transaction.status === 'cancelled';
              
              // Determine the other user
              // For payment requests: sender is the requester, recipient is the one being requested
              // For declined requests shown to requester: the other user is the one who declined
              const otherUser = 
                isPaymentRequest && transaction.recipientId === user.id
                  ? transaction.sender  // For receiver: show requester's name
                  : transaction.senderId === user.id
                  ? transaction.recipient
                  : transaction.sender;

              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white rounded-lg p-4 border-2 ${
                    !notification.read ? 'border-venmo-primary bg-venmo-light' : 'border-gray-100'
                  }`}
                >
                  {/* Notification Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-venmo-light flex-shrink-0">
                      <Image
                        src={
                          otherUser.profilePhoto ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser.username}`
                        }
                        alt={otherUser.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <FaMoneyBillWave className="text-venmo-primary text-sm" />
                        <p className="font-semibold text-gray-900 text-sm">
                          {isPaymentRequest
                            ? isDeclined && transaction.senderId === user.id
                              ? `${otherUser.name} declined your payment request`
                              : isCompleted && transaction.senderId === user.id
                              ? `${otherUser.name} has paid ${formatAmount(transaction.amount)}`
                              : transaction.senderId === user.id
                              ? `Request sent to ${otherUser.name}`
                              : `${transaction.sender.name} requested ${formatAmount(transaction.amount)}${transaction.note ? ` for ${transaction.note}` : ''}`
                            : isCompleted && notification.type === 'payment_received'
                            ? `${transaction.sender.name} has paid ${formatAmount(transaction.amount)}`
                            : `Payment received from ${otherUser.name}`}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500">
                        {format(new Date(notification.createdAt), 'MMM d, yyyy · h:mm a')}
                      </p>
                    </div>
                  </div>

                  {/* Amount and Note */}
                  <div className="mb-3">
                    <p className="text-xl font-bold text-venmo-primary mb-1">
                      {formatAmount(transaction.amount)}
                    </p>
                    {transaction.note && (
                      <p className="text-sm text-gray-600">{transaction.note}</p>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        isPending
                          ? 'bg-yellow-100 text-yellow-700'
                          : isCompleted
                          ? 'bg-green-100 text-green-700'
                          : isDeclined
                          ? 'bg-red-100 text-red-700'
                          : isCancelled
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {isPending ? 'Pending' : isCompleted ? 'Paid' : isDeclined ? 'Declined' : isCancelled ? 'Cancelled' : 'Completed'}
                    </span>
                  </div>

                  {/* Action Buttons for Payment Requests */}
                  {isPaymentRequest && isPending && (
                    <>
                      {/* Payer (recipient) Actions: Pay and Decline */}
                      {transaction.recipientId === user.id && (
                        <div className="flex gap-2 pt-3 border-t border-gray-100">
                          <button
                            onClick={() => handlePayRequest(notification)}
                            disabled={loading}
                            className="flex-1 bg-venmo-primary text-white py-2.5 px-4 rounded-lg font-semibold text-sm hover:bg-venmo-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            <FaCheck />
                            Pay
                          </button>
                          <button
                            onClick={() => handleDeclineRequest(notification)}
                            disabled={loading}
                            className="flex-1 bg-gray-100 text-gray-700 py-2.5 px-4 rounded-lg font-semibold text-sm hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            <FaTimes />
                            Decline
                          </button>
                        </div>
                      )}
                      {/* Requester (sender) Actions: Remind and Cancel - Only show when pending */}
                      {transaction.senderId === user.id && transaction.status === 'pending' && (
                        <div className="flex gap-2 pt-3 border-t border-gray-100">
                          <button
                            onClick={() => handleRemindRequest(notification)}
                            disabled={loading}
                            className="flex-1 bg-blue-100 text-blue-700 py-2.5 px-4 rounded-lg font-semibold text-sm hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            <FaEnvelope />
                            Remind
                          </button>
                          <button
                            onClick={() => handleCancelRequest(notification)}
                            disabled={loading}
                            className="flex-1 bg-gray-100 text-gray-700 py-2.5 px-4 rounded-lg font-semibold text-sm hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            <FaBan />
                            Cancel
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {/* View Transaction Button */}
                  {(isCompleted || isDeclined) && (
                    <button
                      onClick={() => router.push('/home')}
                      className="w-full mt-3 pt-3 border-t border-gray-100 text-venmo-primary text-sm font-semibold hover:text-venmo-dark"
                    >
                      View Transaction
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
      <AccountSwitcher />

      {/* Payment Method Selector Modal */}
      {selectedRequestTransaction && (
        <PaymentMethodSelector
          transaction={selectedRequestTransaction}
          onSelectMethod={handlePaymentMethodSelected}
          onClose={() => setSelectedRequestTransaction(null)}
        />
      )}
    </div>
  );
}
