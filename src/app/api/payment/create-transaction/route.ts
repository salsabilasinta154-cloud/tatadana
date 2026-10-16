import { NextRequest, NextResponse } from 'next/server';
import { createMidtransSnapToken } from '@/lib/midtrans/snap';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { planCode, amount, customerName, customerEmail, paymentMethod = 'midtrans_snap' } = body;

    const orderId = `TD-${planCode === 'pro_lifetime' ? 'PRO' : 'START'}-${Date.now()}`;
    const planName = planCode === 'pro_lifetime' ? 'TataDana Pro (Akses Seumur Hidup)' : 'TataDana Starter (Bulanan)';

    if (paymentMethod === 'manual_transfer') {
      return NextResponse.json({
        success: true,
        orderId,
        paymentMethod: 'manual_transfer',
        amount,
        bankDetails: {
          bankName: 'Bank Central Asia (BCA)',
          accountNumber: '8830-1928-33',
          accountHolder: 'PT TATA DANA DIGITAL INDONESIA',
          nominal: amount,
        },
        message: 'Silakan lakukan transfer ke rekening resmi TataDana dan upload bukti transfer.',
      });
    }

    // Midtrans Snap / QRIS
    const snapResult = await createMidtransSnapToken({
      orderId,
      grossAmount: amount,
      customerName: customerName || 'Pengguna TataDana',
      customerEmail: customerEmail || 'user@tatadana.id',
      itemDetails: [
        {
          id: planCode,
          name: planName,
          price: amount,
          quantity: 1,
        },
      ],
    });

    return NextResponse.json({
      success: true,
      orderId,
      token: snapResult.token,
      redirect_url: snapResult.redirect_url,
      planCode,
      amount,
    });
  } catch (error: any) {
    console.error('Payment creation error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
