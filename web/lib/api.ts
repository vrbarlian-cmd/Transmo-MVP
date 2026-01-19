import axios from 'axios';
import { User, Transaction, Like, Comment } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth API
export const authAPI = {
  sendOTP: async (phone: string) => {
    const response = await api.post('/auth/send-otp', { phone });
    return response.data;
  },
  verifyOTP: async (phone: string, otp: string) => {
    const response = await api.post('/auth/verify-otp', { phone, otp });
    return response.data;
  },
  getMe: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Transactions API
export const transactionAPI = {
  getAll: async (): Promise<Transaction[]> => {
    const response = await api.get('/transactions');
    return response.data;
  },
  create: async (data: {
    recipientId: string;
    amount: number;
    note: string;
    privacy: 'public' | 'friends' | 'private';
    paymentMethod: string;
  }): Promise<Transaction> => {
    const response = await api.post('/transactions', data);
    return response.data;
  },
  getById: async (id: string): Promise<Transaction> => {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  },
  like: async (transactionId: string): Promise<Like> => {
    const response = await api.post(`/transactions/${transactionId}/like`);
    return response.data;
  },
  unlike: async (transactionId: string): Promise<void> => {
    await api.delete(`/transactions/${transactionId}/like`);
  },
  comment: async (transactionId: string, content: string): Promise<Comment> => {
    const response = await api.post(`/transactions/${transactionId}/comment`, {
      content,
    });
    return response.data;
  },
};

// Users API
export const userAPI = {
  search: async (query: string): Promise<User[]> => {
    const response = await api.get(`/users/search?q=${query}`);
    return response.data;
  },
  getFriends: async (): Promise<User[]> => {
    const response = await api.get('/users/friends');
    return response.data;
  },
  addFriend: async (userId: string): Promise<void> => {
    await api.post(`/users/friends/${userId}`);
  },
  removeFriend: async (userId: string): Promise<void> => {
    await api.delete(`/users/friends/${userId}`);
  },
};

// Payment API
export const paymentAPI = {
  initiateQRIS: async (amount: number): Promise<{ qrCode: string; paymentId: string }> => {
    const response = await api.post('/payments/qris', { amount });
    return response.data;
  },
  createVirtualAccount: async (
    bank: string,
    amount: number
  ): Promise<{ vaNumber: string; expiryDate: string }> => {
    const response = await api.post('/payments/va', { bank, amount });
    return response.data;
  },
  processEwallet: async (
    provider: string,
    amount: number
  ): Promise<{ redirectUrl: string }> => {
    const response = await api.post('/payments/ewallet', { provider, amount });
    return response.data;
  },
};

// Mock users for development
const mockUsers = [
  {
    id: '1',
    username: 'john_doe',
    phone: '+6281234567890',
    name: 'John Doe',
    profilePhoto: 'https://i.pravatar.cc/150?img=1',
    createdAt: new Date(),
    kycVerified: true,
  },
  {
    id: '2',
    username: 'jane_smith',
    phone: '+6289876543210',
      name: 'Jane Smith',
      profilePhoto: 'https://i.pravatar.cc/150?img=5',
    createdAt: new Date(),
    kycVerified: true,
  },
  {
    id: '3',
    username: 'budi_kurniawan',
    phone: '+6281122334455',
      name: 'Budi Kurniawan',
      profilePhoto: 'https://i.pravatar.cc/150?img=12',
    createdAt: new Date(),
    kycVerified: false,
  },
  {
    id: '4',
    username: 'sari_dewi',
    phone: '+6285566778899',
      name: 'Sari Dewi',
      profilePhoto: 'https://i.pravatar.cc/150?img=47',
    createdAt: new Date(),
    kycVerified: true,
  },
  {
    id: '5',
    username: 'vitobarlian',
    phone: '+6289988776655',
    name: 'Vito Barlian',
    profilePhoto: 'https://i.pravatar.cc/150?img=33',
    createdAt: new Date(),
    kycVerified: true,
  },
];

// Mock data for development
export const mockData = {
  users: mockUsers,
  transactions: [
    {
      id: '1',
      senderId: '1',
      recipientId: '2',
      amount: 50000,
      note: '🍕 Pizza night!',
      privacy: 'public' as const,
      status: 'completed' as const,
      paymentMethod: 'qris' as const,
      type: 'payment' as const,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      likes: [],
      comments: [],
      sender: mockUsers[0],
      recipient: mockUsers[1],
    },
    {
      id: '2',
      senderId: '3',
      recipientId: '1',
      amount: 100000,
      note: '🎬 Movie tickets',
      privacy: 'friends' as const,
      status: 'completed' as const,
      paymentMethod: 'gopay' as const,
      type: 'payment' as const,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      likes: [{ id: '1', userId: '1', transactionId: '2', createdAt: new Date(), user: mockUsers[0] }],
      comments: [
        {
          id: '1',
          userId: '1',
          transactionId: '2',
          content: 'Thanks! 🎉',
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
          user: mockUsers[0],
        },
      ],
      sender: mockUsers[2],
      recipient: mockUsers[0],
    },
    {
      id: '3',
      senderId: '4',
      recipientId: '2',
      amount: 250000,
      note: '💳 Rent contribution',
      privacy: 'public' as const,
      status: 'completed' as const,
      paymentMethod: 'bank_va' as const,
      type: 'payment' as const,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      likes: [],
      comments: [],
      sender: mockUsers[3],
      recipient: mockUsers[1],
    },
  ],
};