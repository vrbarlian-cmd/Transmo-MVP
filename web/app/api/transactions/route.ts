import { NextRequest, NextResponse } from 'next/server';

// Mock data for MVP - replace with actual database calls
const mockTransactions = [
  {
    id: '1',
    senderId: '1',
    recipientId: '2',
    amount: 50000,
    note: '🍕 Pizza night!',
    privacy: 'public',
    status: 'completed',
    paymentMethod: 'qris',
    createdAt: new Date().toISOString(),
    likes: [],
    comments: [],
    sender: {
      id: '1',
      username: 'john_doe',
      phone: '+6281234567890',
      name: 'John Doe',
      profilePhoto: 'https://i.pravatar.cc/150?img=1',
      createdAt: new Date().toISOString(),
      kycVerified: true,
    },
    recipient: {
      id: '2',
      username: 'jane_smith',
      phone: '+6289876543210',
      name: 'Jane Smith',
      walletBalance: 750000,
      profilePhoto: 'https://i.pravatar.cc/150?img=5',
      createdAt: new Date().toISOString(),
      kycVerified: true,
    },
  },
];

export async function GET(request: NextRequest) {
  try {
    // In production: Fetch from database with auth
    return NextResponse.json(mockTransactions);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // In production: Create transaction in database
    const newTransaction = {
      id: Date.now().toString(),
      ...body,
      status: 'completed',
      createdAt: new Date().toISOString(),
      likes: [],
      comments: [],
    };
    return NextResponse.json(newTransaction, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}