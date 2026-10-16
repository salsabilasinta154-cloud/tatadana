// DeepSeek V3 AI Engine for TataDana

import { AIParsedTransactionResult } from '../types';
import { parseIndonesianSlang } from './slang-parser';

export async function parseWithDeepSeek(
  input: {
    text?: string;
  },
  apiKey?: string
): Promise<AIParsedTransactionResult> {
  const key = apiKey || process.env.DEEPSEEK_API_KEY;

  if (!key || key.includes('dummy') || key.includes('Dummy')) {
    const parsed = parseIndonesianSlang(input.text || '');
    return {
      success: (parsed.amount || 0) > 0,
      type: parsed.type,
      amount: parsed.amount || 0,
      category: parsed.categoryName,
      wallet: parsed.walletName || 'GoPay',
      destination_wallet: parsed.destinationWalletName || undefined,
      description: parsed.description,
      confidence: 0.90,
      provider_used: 'deepseek-chat (V3 Failover)',
      raw_text: input.text,
    };
  }

  const endpoint = 'https://api.deepseek.com/chat/completions';
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content:
            'Kembalikan HANYA format JSON valid tanpa markdown backticks: {"type": "expense"|"income"|"transfer", "amount": number, "category": string, "wallet": string, "description": string}',
        },
        {
          role: 'user',
          content: input.text || '',
        },
      ],
      temperature: 0.1,
    }),
  });

  if (!res.ok) {
    throw new Error(`DeepSeek API HTTP Error: ${res.status}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  const parsedJson = JSON.parse(content);

  return {
    success: true,
    type: parsedJson.type || 'expense',
    amount: parsedJson.amount || 0,
    category: parsedJson.category || 'Makanan & Minuman',
    wallet: parsedJson.wallet || 'GoPay',
    description: parsedJson.description || 'Transaksi',
    confidence: 0.93,
    provider_used: 'deepseek-chat (V3)',
    raw_text: input.text,
  };
}
