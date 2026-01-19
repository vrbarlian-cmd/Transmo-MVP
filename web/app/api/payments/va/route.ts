import { NextRequest, NextResponse } from 'next/server';

const BANKS = ['BCA', 'Mandiri', 'BRI', 'BNI', 'CIMB'];

export async function POST(request: NextRequest) {
  try {
    const { bank, amount } = await request.json();
    
    if (!BANKS.includes(bank)) {
      return NextResponse.json({ error: 'Invalid bank' }, { status: 400 });
    }

    // In production: Integrate with payment gateway (Midtrans, Xendit, etc.)
    // For MVP, return mock VA data
    const vaNumber = `${bank === 'BCA' ? '68888' : bank === 'Mandiri' ? '89208' : '80888'}${Date.now().toString().slice(-10)}`;
    
    const vaData = {
      vaNumber,
      bankName: bank,
      amount,
      expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      paymentId: `VA_${Date.now()}`,
    };

    return NextResponse.json(vaData);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create virtual account' }, { status: 500 });
  }
}