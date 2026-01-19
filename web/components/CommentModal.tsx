'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaPaperPlane } from 'react-icons/fa';
import { Transaction, User } from '@/types';
import { format } from 'date-fns';

interface CommentModalProps {
  transaction: Transaction;
  currentUser: User;
  onClose: () => void;
  onAddComment: (content: string) => void;
}

export default function CommentModal({
  transaction,
  currentUser,
  onClose,
  onAddComment,
}: CommentModalProps) {
  const [commentText, setCommentText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      onAddComment(commentText.trim());
      setCommentText('');
    }
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
          className="bg-white rounded-t-2xl w-full max-w-md mx-auto max-h-[80vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-lg font-bold text-gray-900">Comments</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FaTimes className="text-gray-600" />
            </button>
          </div>

          {/* Transaction Preview */}
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">{transaction.sender.name}</span>
              <span className="text-gray-500">paid</span>
              <span className="font-semibold text-gray-900">{transaction.recipient.name}</span>
            </div>
            {transaction.note && (
              <p className="text-sm text-gray-600 mt-1">{transaction.note}</p>
            )}
          </div>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {transaction.comments && transaction.comments.length > 0 ? (
              transaction.comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-venmo-light flex-shrink-0">
                    <Image
                      src={
                        comment.user.profilePhoto ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user.username}`
                      }
                      alt={comment.user.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                      <span className="font-semibold text-sm text-gray-900">
                        {comment.user.name}
                      </span>
                      <p className="text-sm text-gray-700 mt-0.5">{comment.content}</p>
                    </div>
                    <span className="text-xs text-gray-400 mt-1 block">
                      {format(new Date(comment.createdAt), 'MMM d, h:mm a')}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No comments yet</p>
                <p className="text-sm text-gray-400 mt-1">Be the first to comment!</p>
              </div>
            )}
          </div>

          {/* Comment Input */}
          <div className="border-t border-gray-200 p-4 flex-shrink-0">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <div className="relative w-8 h-8 rounded-full overflow-hidden bg-venmo-light flex-shrink-0">
                <Image
                  src={
                    currentUser.profilePhoto ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}`
                  }
                  alt={currentUser.name}
                  fill
                  className="object-cover"
                />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-venmo-primary focus:border-transparent"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="bg-venmo-primary text-white p-2 rounded-full hover:bg-venmo-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaPaperPlane />
              </button>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
