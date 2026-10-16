// Midtrans Snap Sandbox Client Helper

export interface MidtransTransactionParams {
  orderId: string;
  grossAmount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  itemDetails: {
    id: string;
    price: number;
    quantity: number;
    name: string;
  }[];
}

export async function createMidtransSnapToken(params: MidtransTransactionParams): Promise<{
  token: string;
  redirect_url: string;
}> {
  const serverKey = process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-TataDanaSandboxDemoKey';
  const isProd = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true';

  const endpoint = isProd
    ? 'https://app.midtrans.com/snap/v1/transactions'
    : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

  // If using demo/mock key, provide simulated token
  if (serverKey.includes('Demo') || serverKey.includes('SandboxKey456')) {
    const mockToken = `snap_token_tatadana_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    return {
      token: mockToken,
      redirect_url: `https://app.sandbox.midtrans.com/snap/v2/vtweb/${mockToken}`,
    };
  }

  const authHeader = Buffer.from(`${serverKey}:`).toString('base64');

  const payload = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: params.grossAmount,
    },
    item_details: params.itemDetails,
    customer_details: {
      first_name: params.customerName,
      email: params.customerEmail,
      phone: params.customerPhone || '081234567890',
    },
    enabled_payments: ['credit_card', 'gopay', 'shopeepay', 'bca_va', 'bni_va', 'bri_va', 'mandiri_clickpay', 'qris'],
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Basic ${authHeader}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Midtrans API Error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return {
    token: data.token,
    redirect_url: data.redirect_url,
  };
}
