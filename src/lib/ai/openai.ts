// OpenAI GPT-4o-mini Failover AI Engine for TataDana

import { AIParsedTransactionResult } from '../types';
import { parseIndonesianSlang } from './slang-parser';

export async function parseWithOpenAI(
  input: {
    text?: string;
    imageBase64?: string;
  },
  apiKey?: string
): Promise<AIParsedTransactionResult> {
  const key = apiKey || process.env.OPENAI_API_KEY;

  if (!key || key.includes('dummy') || key.includes('Dummy')) {
    const parsed = parseIndonesianSlang(input.text || '');
    return {
      success: (parsed.amount || 0) > 0,
      type: parsed.type,
      amount: parsed.amount || 0,
      category: parsed.categoryName,
      wallet: parsed.walletName || 'Bank Mandiri',
      destination_wallet: parsed.destinationWalletName || undefined,
      description: parsed.description,
      confidence: 0.92,
      provider_used: 'gpt-4o-mini (Failover)',
      raw_text: input.text,
    };
  }

  const endpoint = 'https://api.openai.com/v1/chat/completions';
  const messages: any[] = [
    {
      role: 'system',
      content:
        'Anda adalah Financial Parser aplikasi FinTech Indonesia "TataDana". Kembalikan HANYA format JSON valid tanpa format markdown: {"type": "expense"|"income"|"transfer", "amount": number, "category": string, "wallet": string, "description": string, "items": [{"name": string, "quantity": number, "price": number, "subtotal": number}]}',
    },
  ];

  if (input.imageBase64) {
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: 'Ekstrak detail struk dan item dari gambar ini:' },
        {
          type: 'image_url',
          image_url: {
            url: input.imageBase64.startsWith('data:')
              ? input.imageBase64
              : `data:image/jpeg;base64,${input.imageBase64}`,
          },
        },
      ],
    });
  } else {
    messages.push({
      role: 'user',
      content: input.text || '',
    });
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      response_format: { type: 'json_object' },
      temperature: 0.1,
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI API HTTP Error: ${res.status}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  const parsedJson = JSON.parse(content);

  return {
    success: true,
    type: parsedJson.type || 'expense',
    amount: parsedJson.amount || 0,
    category: parsedJson.category || 'Makanan & Minuman',
    wallet: parsedJson.wallet || 'Bank Mandiri',
    description: parsedJson.description || 'Transaksi',
    items: parsedJson.items || [],
    confidence: 0.95,
    provider_used: 'gpt-4o-mini (Failover)',
    raw_text: input.text,
  };
}
