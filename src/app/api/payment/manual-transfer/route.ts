import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, planCode, amount, bankName, accountSenderName, receiptImage, userEmail, userName } = body;

    if (!bankName || !accountSenderName) {
      return NextResponse.json(
        { success: false, message: 'Nama bank dan nama pemilik rekening pengirim wajib diisi.' },
        { status: 400 }
      );
    }

    const newPayment = {
      order_id: orderId || `TD-MANUAL-${Date.now()}`,
      plan_code: planCode || 'pro_lifetime',
      amount: amount || 99000,
      payment_method: 'manual_transfer',
      status: 'pending',
      bank_name: bankName,
      account_sender_name: accountSenderName,
      manual_receipt_url: receiptImage || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
      user_email: userEmail || 'user@tatadana.id',
      user_name: userName || 'Pengguna TataDana',
      created_at: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      payment: newPayment,
      message: 'Bukti transfer berhasil diunggah! Superadmin kami akan memverifikasi dalam 1x24 jam.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
