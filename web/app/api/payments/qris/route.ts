import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { amount } = await request.json();
    
    // In production: Integrate with QRIS provider (Midtrans, Xendit, etc.)
    // For MVP, return mock QRIS data
    const qrisData = {
      qrCode: '00020101021243570016COM.ID.MIDTRANS0117202101234567890240600130318' + 
               '00000000000000000000401UMI27030001ID5802ID5913Midtrans Demo6007Jakarta61051234062330303UME6304',
      paymentId: `QRIS_${Date.now()}`,
      amount,
      expiryDate: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
    };

    return NextResponse.json(qrisData);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate QRIS' }, { status: 500 });
  }
}