import { NextRequest, NextResponse } from 'next/server';

const E_WALLETS = ['ovo', 'dana', 'shopeepay'];

export async function POST(request: NextRequest) {
  try {
    const { provider, amount } = await request.json();
    
    if (!E_WALLETS.includes(provider.toLowerCase())) {
      return NextResponse.json({ error: 'Invalid e-wallet provider' }, { status: 400 });
    }

    // In production: Integrate with e-wallet providers
    // For MVP, return mock redirect URL
    const redirectUrl = `/payments/ewallet/callback?provider=${provider}&amount=${amount}&status=pending&paymentId=EW_${Date.now()}`;
    
    const ewalletData = {
      redirectUrl,
      provider: provider.toUpperCase(),
      amount,
      paymentId: `EW_${Date.now()}`,
    };

    return NextResponse.json(ewalletData);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process e-wallet payment' }, { status: 500 });
  }
}