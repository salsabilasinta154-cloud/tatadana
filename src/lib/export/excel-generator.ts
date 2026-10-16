import * as XLSX from 'xlsx';
import { Transaction, Wallet, Category } from '../types';
import { formatRupiah, formatDateIndo } from '../utils';

export interface ExportReportParams {
  transactions: Transaction[];
  wallets: Wallet[];
  categories: Category[];
  startDate?: string;
  endDate?: string;
  userName?: string;
}

export function generateExcelReportBuffer({
  transactions,
  wallets,
  categories,
  startDate,
  endDate,
  userName = 'Pengguna TataDana',
}: ExportReportParams): Uint8Array {
  const wb = XLSX.utils.book_new();

  // Helper map for names
  const walletMap = new Map(wallets.map((w) => [w.id, w.name]));
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  // 1. Calculate Summary
  let totalExpense = 0;
  let totalIncome = 0;
  const categorySummary: Record<string, number> = {};

  transactions.forEach((tx) => {
    if (tx.type === 'expense') {
      totalExpense += tx.amount;
      const catName = (tx.category_id && categoryMap.get(tx.category_id)) || 'Lain-lain';
      categorySummary[catName] = (categorySummary[catName] || 0) + tx.amount;
    } else if (tx.type === 'income') {
      totalIncome += tx.amount;
    }
  });

  // Sheet 1: Ringkasan Eksekutif
  const summaryData = [
    ['LAPORAN KEUANGAN TATADANA'],
    ['Platform FinTech Personal & AI Telegram Bot'],
    [''],
    ['Nama Pengguna:', userName],
    ['Periode:', `${startDate || 'Semua'} s/d ${endDate || 'Semua'}`],
    ['Tanggal Cetak:', new Date().toLocaleDateString('id-ID')],
    [''],
    ['RINGKASAN CASHFLOW', 'NOMINAL (IDR)'],
    ['Total Pemasukan', totalIncome],
    ['Total Pengeluaran', totalExpense],
    ['Arus Kas Bersih (Net Cashflow)', totalIncome - totalExpense],
    ['Total Transaksi', transactions.length],
    [''],
    ['PENGELUARAN PER KATEGORI', 'TOTAL (IDR)'],
    ...Object.entries(categorySummary).map(([cat, amt]) => [cat, amt]),
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Eksekutif');

  // Sheet 2: Detail Transaksi
  const txHeader = [
    'Tanggal',
    'Tipe',
    'Deskripsi',
    'Kategori',
    'Wallet / Akun',
    'Nominal (IDR)',
    'Fee (IDR)',
    'Sumber Input',
    'Catatan / Slang Input',
  ];
  const txRows = transactions.map((t) => [
    t.transaction_date,
    t.type.toUpperCase(),
    t.description,
    (t.category_id && categoryMap.get(t.category_id)) || (t.type === 'transfer' ? 'Transfer Antar Wallet' : '-'),
    (t.wallet_id && walletMap.get(t.wallet_id)) || 'Wallet',
    t.amount,
    t.fee || 0,
    t.source,
    t.notes || t.raw_input || '',
  ]);
  const wsTx = XLSX.utils.aoa_to_sheet([txHeader, ...txRows]);
  XLSX.utils.book_append_sheet(wb, wsTx, 'Daftar Transaksi');

  // Sheet 3: Detail Struk Kasir OCR
  const receiptHeader = ['ID Transaksi', 'Deskripsi Transaksi', 'Nama Item Barang', 'Jumlah (Qty)', 'Harga Satuan (IDR)', 'Subtotal (IDR)'];
  const receiptRows: any[] = [];
  transactions.forEach((tx) => {
    if (tx.receipt_items && tx.receipt_items.length > 0) {
      tx.receipt_items.forEach((item) => {
        receiptRows.push([
          tx.id,
          tx.description,
          item.item_name,
          item.quantity,
          item.unit_price,
          item.subtotal,
        ]);
      });
    }
  });

  if (receiptRows.length > 0) {
    const wsReceipt = XLSX.utils.aoa_to_sheet([receiptHeader, ...receiptRows]);
    XLSX.utils.book_append_sheet(wb, wsReceipt, 'Detail Item Struk (OCR)');
  }

  // Generate buffer
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
  return new Uint8Array(excelBuffer);
}
