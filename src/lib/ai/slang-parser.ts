// Indonesian Financial Slang Parser
// Handles amounts like "15rb", "1.5jt", "500k", "25 ribu", "1,2jt", wallet detection, and category matching.

import { TransactionType, AIParsedTransactionResult } from '../types';

export interface SlangParseResult {
  amount: number | null;
  rawAmountText: string | null;
  type: TransactionType;
  walletName: string | null;
  destinationWalletName: string | null;
  categoryName: string;
  description: string;
  confidence: number;
}

export function parseIndonesianSlang(text: string): SlangParseResult {
  const cleanInput = text.trim();
  const lower = cleanInput.toLowerCase();

  // 1. Detect Nominal Amount
  // Patterns like: 1.5jt, 1,5jt, 2jt, 500k, 15rb, 25 ribu, 100.000, 100000, Rp 50.000
  let amount: number | null = null;
  let rawAmountText: string | null = null;

  // Pattern A: Millions (jt / juta / m / milyar)
  const jutaRegex = /(\d+(?:[.,]\d+)?)\s*(?:jt|juta)\b/i;
  const jtMatch = lower.match(jutaRegex);
  if (jtMatch) {
    const numPart = parseFloat(jtMatch[1].replace(',', '.'));
    amount = Math.round(numPart * 1000000);
    rawAmountText = jtMatch[0];
  }

  // Pattern B: Billions (milyar / miliar / milyard)
  if (!amount) {
    const miliarRegex = /(\d+(?:[.,]\d+)?)\s*(?:milyar|miliar)\b/i;
    const mMatch = lower.match(miliarRegex);
    if (mMatch) {
      const numPart = parseFloat(mMatch[1].replace(',', '.'));
      amount = Math.round(numPart * 1000000000);
      rawAmountText = mMatch[0];
    }
  }

  // Pattern C: Thousands (rb / ribu / k)
  if (!amount) {
    const ribuRegex = /(\d+(?:[.,]\d+)?)\s*(?:rb|ribu|k)\b/i;
    const rbMatch = lower.match(ribuRegex);
    if (rbMatch) {
      const numPart = parseFloat(rbMatch[1].replace(',', '.'));
      amount = Math.round(numPart * 1000);
      rawAmountText = rbMatch[0];
    }
  }

  // Pattern D: Standard numbers with optional Rp (e.g. "Rp 25.000", "Rp. 50000", "25000", "150.000")
  if (!amount) {
    const standardRegex = /(?:rp\.?\s*)?(\d{1,3}(?:\.\d{3})+|\d{4,12})/i;
    const stdMatch = lower.match(standardRegex);
    if (stdMatch) {
      const rawNumber = stdMatch[1].replace(/\./g, '');
      const numPart = parseInt(rawNumber, 10);
      if (!isNaN(numPart) && numPart > 0) {
        amount = numPart;
        rawAmountText = stdMatch[0];
      }
    }
  }

  // 2. Detect Transaction Type
  let type: TransactionType = 'expense';
  const incomeKeywords = [
    'gaji', 'bonus', 'dapat', 'terima', 'masuk', 'tf masuk', 'transfer masuk',
    'cair', 'omset', 'omzet', 'penjualan', 'laku', 'untung', 'dividen', 'cashback', 'hadiah'
  ];
  const transferKeywords = [
    'transfer ke', 'tf ke', 'pindah ke', 'kirim ke', 'topup', 'top up', 'isi saldo', 'transfer', 'pindah saldo'
  ];

  if (incomeKeywords.some((kw) => lower.includes(kw))) {
    type = 'income';
  } else if (transferKeywords.some((kw) => lower.includes(kw))) {
    type = 'transfer';
  }

  // Helper to match known wallet names
  const matchWallet = (str: string): string | null => {
    const s = str.toLowerCase();
    if (s.includes('bca')) return 'BCA Tabungan';
    if (s.includes('mandiri')) return 'Bank Mandiri';
    if (s.includes('bri')) return 'Bank BRI';
    if (s.includes('bni')) return 'Bank BNI';
    if (s.includes('jago')) return 'Bank Jago';
    if (s.includes('jenius')) return 'Jenius BTPN';
    if (s.includes('seabank')) return 'SeaBank';
    if (s.includes('gopay') || s.includes('go pay')) return 'GoPay';
    if (s.includes('ovo')) return 'OVO';
    if (s.includes('dana')) return 'DANA';
    if (s.includes('shopeepay') || s.includes('spay')) return 'ShopeePay';
    if (s.includes('cash') || s.includes('tunai') || s.includes('dompet')) return 'Cash Dompet';
    return null;
  };

  // 3. Detect Wallet & Destination Wallet
  let walletName: string | null = null;
  let destinationWalletName: string | null = null;

  if (type === 'transfer') {
    // Look for destination preceded by "ke" or "tujuan"
    const keMatch = lower.match(/(?:ke|tujuan)\s+([a-z0-9\s]+)/i);
    if (keMatch) {
      destinationWalletName = matchWallet(keMatch[1]);
    }
    // Look for source preceded by "dari", "via", "pakai", or "pake"
    const dariMatch = lower.match(/(?:dari|sumber|via|pakai|pake)\s+([a-z0-9\s]+)/i);
    if (dariMatch) {
      walletName = matchWallet(dariMatch[1]);
    }

    // Handle "topup <wallet>" where <wallet> is destination
    if (!destinationWalletName && (lower.includes('topup') || lower.includes('top up') || lower.includes('isi saldo'))) {
      const topupTarget = matchWallet(lower);
      if (topupTarget) {
        destinationWalletName = topupTarget;
        if (!walletName) walletName = 'BCA Tabungan';
      }
    }
  }

  // Fallback wallet detection if not set
  if (!walletName) {
    walletName = matchWallet(lower);
  }
  if (type === 'transfer' && !destinationWalletName) {
    // If destination still not detected, pick a different wallet than source
    destinationWalletName = walletName === 'GoPay' ? 'BCA Tabungan' : 'GoPay';
  }

  // 4. Detect Category
  let categoryName = type === 'income' ? 'Lain-lain' : 'Makanan & Minuman';

  if (type === 'income') {
    if (lower.includes('gaji') || lower.includes('salary') || lower.includes('upah')) {
      categoryName = 'Gaji Bulanan';
    } else if (lower.includes('bonus') || lower.includes('thr') || lower.includes('insentif')) {
      categoryName = 'Bonus & Tunjangan';
    } else if (lower.includes('penjualan') || lower.includes('omset') || lower.includes('jual')) {
      categoryName = 'Penjualan Bisnis';
    } else if (lower.includes('investasi') || lower.includes('dividen') || lower.includes('reksadana')) {
      categoryName = 'Investasi & Dividen';
    } else if (lower.includes('cashback') || lower.includes('hadiah') || lower.includes('giveaway')) {
      categoryName = 'Cashback & Hadiah';
    } else {
      categoryName = 'Transfer Masuk';
    }
  } else {
    // Expense Categories
    if (
      lower.includes('bensin') || lower.includes('pertalite') || lower.includes('pertamax') ||
      lower.includes('tol') || lower.includes('parkir') || lower.includes('gojek') ||
      lower.includes('grab') || lower.includes('maxim') || lower.includes('ojol') ||
      lower.includes('kereta') || lower.includes('krl') || lower.includes('mrt') ||
      lower.includes('servis') || lower.includes('service') || lower.includes('cuci mobil') || lower.includes('cuci motor')
    ) {
      categoryName = 'Transportasi & Bensin';
    } else if (
      lower.includes('alfamart') || lower.includes('indomaret') || lower.includes('superindo') ||
      lower.includes('hypermart') || lower.includes('belanja') || lower.includes('sayur') ||
      lower.includes('beras') || lower.includes('minyak') || lower.includes('sabun') ||
      lower.includes('shampoo') || lower.includes('tisu') || lower.includes('pasar')
    ) {
      categoryName = 'Belanja Harian & Minimarket';
    } else if (
      lower.includes('listrik') || lower.includes('pln') || lower.includes('air') ||
      lower.includes('pdam') || lower.includes('wifi') || lower.includes('indihome') ||
      lower.includes('biznet') || lower.includes('pulsa') || lower.includes('paket data') ||
      lower.includes('kuota') || lower.includes('sewa') || lower.includes('kontrakan') ||
      lower.includes('kost') || lower.includes('bpjs') || lower.includes('iuran')
    ) {
      categoryName = 'Tagihan & Utilitas';
    } else if (
      lower.includes('bioskop') || lower.includes('xxi') || lower.includes('netflix') ||
      lower.includes('spotify') || lower.includes('game') || lower.includes('steam') ||
      lower.includes('nongkrong') || lower.includes('liburan') || lower.includes('karaoke') ||
      lower.includes('staycation')
    ) {
      categoryName = 'Hiburan & Rekreasi';
    } else if (
      lower.includes('obat') || lower.includes('apotek') || lower.includes('dokter') ||
      lower.includes('klinik') || lower.includes('rumah sakit') || lower.includes('rs') ||
      lower.includes('vitamin') || lower.includes('gym') || lower.includes('fitness')
    ) {
      categoryName = 'Kesehatan & Obat';
    } else if (
      lower.includes('buku') || lower.includes('kursus') || lower.includes('kuliah') ||
      lower.includes('spp') || lower.includes('sekolah') || lower.includes('ujian')
    ) {
      categoryName = 'Pendidikan & Buku';
    } else if (
      lower.includes('donasi') || lower.includes('sedekah') || lower.includes('zakat') ||
      lower.includes('infaq') || lower.includes('masjid') || lower.includes('gereja')
    ) {
      categoryName = 'Donasi & Zakat';
    } else if (
      lower.includes('makan') || lower.includes('kopi') || lower.includes('lunch') ||
      lower.includes('dinner') || lower.includes('sarapan') || lower.includes('snack') ||
      lower.includes('bakso') || lower.includes('mie') || lower.includes('nasi') ||
      lower.includes('ayam') || lower.includes('cafe') || lower.includes('restoran') ||
      lower.includes('gofood') || lower.includes('grabfood') || lower.includes('shopeefood')
    ) {
      categoryName = 'Makanan & Minuman';
    } else {
      categoryName = 'Lain-lain';
    }
  }

  // 5. Clean Description
  // Remove nominal, wallet tokens, and words like 'pakai', 'lewat', 'via', 'pake'
  let cleanDesc = cleanInput;
  if (rawAmountText) {
    cleanDesc = cleanDesc.replace(new RegExp(rawAmountText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '');
  }
  cleanDesc = cleanDesc
    .replace(/\b(pakai|pake|lewat|via|menggunakan|dari|ke)\b/gi, ' ')
    .replace(/\b(bca|mandiri|bri|bni|gopay|ovo|dana|spay|shopeepay|cash|tunai|dompet|jago|jenius|seabank)\b/gi, ' ')
    .replace(/\b(rp\.?|rupiah)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // If description is empty, fallback to category name
  if (!cleanDesc || cleanDesc.length < 2) {
    cleanDesc = categoryName;
  } else {
    // Capitalize first letter
    cleanDesc = cleanDesc.charAt(0).toUpperCase() + cleanDesc.slice(1);
  }

  const confidence = amount ? (walletName ? 0.95 : 0.85) : 0.4;

  return {
    amount,
    rawAmountText,
    type,
    walletName,
    destinationWalletName,
    categoryName,
    description: cleanDesc,
    confidence,
  };
}

/**
 * High-level parser that returns AIParsedTransactionResult
 */
export function parseFinancialInput(
  rawText: string,
  preferredProvider = 'slang-rules'
): AIParsedTransactionResult {
  const parsed = parseIndonesianSlang(rawText);

  return {
    success: parsed.amount !== null && parsed.amount > 0,
    type: parsed.type,
    amount: parsed.amount || 0,
    category: parsed.categoryName,
    wallet: parsed.walletName || 'Cash Dompet',
    destination_wallet: parsed.destinationWalletName || undefined,
    description: parsed.description,
    confidence: parsed.confidence,
    provider_used: preferredProvider,
    raw_text: rawText,
  };
}
