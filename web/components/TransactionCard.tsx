'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FaHeart, FaComment } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { Transaction, User, isMerchant } from '@/types';
import { format } from 'date-fns';

interface TransactionCardProps {
  transaction: Transaction;
  currentUserId: string;
  onLike: (transactionId: string) => void;
  onCommentClick: (transactionId: string) => void;
}

export default function TransactionCard({
  transaction,
  currentUserId,
  onLike,
  onCommentClick,
}: TransactionCardProps) {
  const router = useRouter();
  const isLiked = transaction.likes?.some((like) => like.userId === currentUserId);
  const isSender = transaction.senderId === currentUserId;

  const handleUserClick = (userId: string) => {
    // Check if it's a merchant or regular user
    if (isMerchant(userId)) {
      router.push(`/merchant/${userId}`);
    } else {
      router.push(`/profile/${userId}`);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-3"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={() => handleUserClick(transaction.sender.id)}
          className="relative w-10 h-10 rounded-full overflow-hidden bg-venmo-light hover:ring-2 ring-venmo-primary transition-all"
        >
          <Image
            src={transaction.sender.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${transaction.sender.username}`}
            alt={transaction.sender.name}
            fill
            className="object-cover"
          />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleUserClick(transaction.sender.id)}
              className="font-semibold text-gray-900 truncate hover:text-venmo-primary transition-colors"
            >
              {transaction.sender.name}
            </button>
            <span className="text-gray-500">paid</span>
            <button
              onClick={() => handleUserClick(transaction.recipient.id)}
              className="font-semibold text-gray-900 truncate hover:text-venmo-primary transition-colors"
            >
              {transaction.recipient.name}
            </button>
          </div>
          <p className="text-xs text-gray-500">
            {format(new Date(transaction.createdAt), 'MMM d, yyyy · h:mm a')}
          </p>
        </div>
        {transaction.privacy === 'private' && (
          <span className="text-xs text-gray-400">🔒</span>
        )}
      </div>

      {/* Note */}
      {transaction.note && (
        <p className="text-gray-800 mb-3 text-lg">{transaction.note}</p>
      )}

      {/* Amount - Conditionally shown based on showAmountOnFeed flag and privacy */}
      {(() => {
        // Determine if amount should be shown
        // Private transactions always hide amount, regardless of showAmountOnFeed flag
        const shouldShowAmount = transaction.privacy !== 'private' && (transaction.showAmountOnFeed !== false);
        
        return (
          <div className="mb-3 flex items-center gap-2">
            {shouldShowAmount ? (
              <span className={`text-2xl font-bold ${
                isSender ? 'text-red-600' : 'text-green-600'
              }`}>
                {isSender ? '-' : '+'}
                {formatAmount(transaction.amount)}
              </span>
            ) : (
              <span className="text-lg text-gray-400 italic">
                Amount hidden
              </span>
            )}
            {transaction.status === 'pending' && (
              <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-1 rounded-full">
                Pending
              </span>
            )}
            {transaction.status === 'declined' && (
              <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-1 rounded-full">
                Declined
              </span>
            )}
          </div>
        );
      })()}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
        <button
          onClick={() => onLike(transaction.id)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${
            isLiked
              ? 'bg-red-50 text-red-600'
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          }`}
        >
          <FaHeart className={isLiked ? 'fill-current' : ''} />
          <span className="text-sm font-medium">
            {transaction.likes?.length || 0}
          </span>
        </button>
        <button
          onClick={() => onCommentClick(transaction.id)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <FaComment />
          <span className="text-sm font-medium">
            {transaction.comments?.length || 0}
          </span>
        </button>
      </div>
    </motion.div>
  );
}