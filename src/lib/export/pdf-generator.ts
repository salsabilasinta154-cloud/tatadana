import { jsPDF } from 'jspdf';
import { Transaction, Wallet, Category } from '../types';
import { formatRupiah, formatDateIndo } from '../utils';

export interface ExportPDFParams {
  transactions: Transaction[];
  wallets: Wallet[];
  categories: Category[];
  startDate?: string;
  endDate?: string;
  userName?: string;
}

export function generatePDFReportBuffer({
  transactions,
  wallets,
  categories,
  startDate,
  endDate,
  userName = 'Pengguna TataDana',
}: ExportPDFParams): Uint8Array {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const walletMap = new Map(wallets.map((w) => [w.id, w.name]));
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  // Brand Header
  doc.setFillColor(255, 107, 0); // TataDana Orange
  doc.rect(0, 0, 210, 25, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('TATADANA', 15, 14);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Smart Personal Finance & AI Telegram Bot', 15, 20);

  doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID')}`, 155, 14);
  doc.text(`Status: Terverifikasi`, 155, 20);

  // User & Period Info
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Laporan Keuangan & Mutasi Transaksi', 15, 36);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nama Akun: ${userName}`, 15, 43);
  doc.text(`Periode: ${startDate || 'Awal'} s/d ${endDate || 'Sekarang'}`, 15, 48);

  // Summary Metrics Box
  let totalExpense = 0;
  let totalIncome = 0;
  transactions.forEach((tx) => {
    if (tx.type === 'expense') totalExpense += tx.amount;
    else if (tx.type === 'income') totalIncome += tx.amount;
  });

  doc.setFillColor(250, 250, 249);
  doc.roundedRect(15, 54, 180, 22, 3, 3, 'F');
  doc.setDrawColor(230, 230, 230);
  doc.roundedRect(15, 54, 180, 22, 3, 3, 'D');

  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('TOTAL PEMASUKAN', 22, 61);
  doc.text('TOTAL PENGELUARAN', 82, 61);
  doc.text('ARUS KAS BERSIH', 142, 61);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129); // Green
  doc.text(formatRupiah(totalIncome), 22, 70);

  doc.setTextColor(239, 68, 68); // Red
  doc.text(formatRupiah(totalExpense), 82, 70);

  const net = totalIncome - totalExpense;
  doc.setTextColor(net >= 0 ? 16 : 239, net >= 0 ? 185 : 68, net >= 0 ? 129 : 68);
  doc.text(formatRupiah(net), 142, 70);

  // Helper to print table header
  const printTableHeader = (currentY: number) => {
    doc.setFillColor(243, 244, 246);
    doc.rect(15, currentY, 180, 8, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text('TANGGAL', 18, currentY + 5.5);
    doc.text('DESKRIPSI', 45, currentY + 5.5);
    doc.text('KATEGORI', 100, currentY + 5.5);
    doc.text('WALLET', 135, currentY + 5.5);
    doc.text('NOMINAL', 168, currentY + 5.5);
    return currentY + 12;
  };

  let y = printTableHeader(86);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  transactions.forEach((tx) => {
    if (y > 268) {
      doc.addPage();
      y = printTableHeader(15);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
    }

    const catName = (tx.category_id && categoryMap.get(tx.category_id)) || (tx.type === 'transfer' ? 'Transfer' : '-');
    const walName = (tx.wallet_id && walletMap.get(tx.wallet_id)) || 'Wallet';

    doc.setTextColor(80, 80, 80);
    doc.text(tx.transaction_date, 18, y);

    const cleanDesc = tx.description.length > 25 ? `${tx.description.substring(0, 23)}...` : tx.description;
    doc.text(cleanDesc, 45, y);

    const cleanCat = catName.length > 18 ? `${catName.substring(0, 16)}...` : catName;
    doc.text(cleanCat, 100, y);

    const cleanWal = walName.length > 15 ? `${walName.substring(0, 13)}...` : walName;
    doc.text(cleanWal, 135, y);

    if (tx.type === 'expense') {
      doc.setTextColor(220, 38, 38);
      doc.text(`-${formatRupiah(tx.amount)}`, 168, y);
    } else if (tx.type === 'income') {
      doc.setTextColor(16, 185, 129);
      doc.text(`+${formatRupiah(tx.amount)}`, 168, y);
    } else {
      doc.setTextColor(59, 130, 246);
      doc.text(`${formatRupiah(tx.amount)}`, 168, y);
    }

    y += 6.5;
  });

  // Footer note
  doc.setFontSize(7);
  doc.setTextColor(160, 160, 160);
  doc.text(
    `TataDana FinTech Indonesia • Laporan otomatis dihasilkan dari sistem • Total ${transactions.length} transaksi`,
    15,
    288
  );

  const output = doc.output('arraybuffer');
  return new Uint8Array(output);
}
