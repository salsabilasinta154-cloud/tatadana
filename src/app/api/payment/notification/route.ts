import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const notification = await req.json();

    const orderId = notification.order_id;
    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;

    let paymentStatus = 'pending';

    if (transactionStatus === 'capture') {
      if (fraudStatus === 'challenge') {
        paymentStatus = 'challenge';
      } else if (fraudStatus === 'accept') {
        paymentStatus = 'settlement';
      }
    } else if (transactionStatus === 'settlement') {
      paymentStatus = 'settlement';
    } else if (
      transactionStatus === 'cancel' ||
      transactionStatus === 'deny' ||
      transactionStatus === 'expire'
    ) {
      paymentStatus = transactionStatus;
    } else if (transactionStatus === 'pending') {
      paymentStatus = 'pending';
    }

    console.log(`[Midtrans Webhook] Order ${orderId} status: ${paymentStatus}`);

    return NextResponse.json({
      status: 'ok',
      order_id: orderId,
      resolved_status: paymentStatus,
    });
  } catch (error: any) {
    console.error('Midtrans notification error:', error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
