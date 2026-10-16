'use client';

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Filter,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Receipt,
  TrendingDown,
  TrendingUp,
  Scale,
  Sparkles,
} from 'lucide-react';
import { useTataDana } from '@/lib/store/tatadana-store';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatRupiah, formatDateIndo } from '@/lib/utils';
import { ReceiptBreakdownModal } from '@/components/dashboard/ReceiptBreakdownModal';
import { Transaction } from '@/lib/types';

export default function ReportsPage() {
  const { transactions, wallets, categories, profile } = useTataDana();

  // Filters
  const [periodPreset, setPeriodPreset] = useState<'this_month' | 'last_month' | 'q4' | 'all'>('this_month');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterWallet, setFilterWallet] = useState<string>('all');
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Selected receipt
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<Transaction | null>(null);

  // Filter transactions
  const filtered = transactions.filter((tx) => {
    if (filterType !== 'all' && tx.type !== filterType) return false;
    if (filterWallet !== 'all' && tx.wallet_id !== filterWallet) return false;

    if (periodPreset === 'this_month') {
      const d = new Date(tx.transaction_date);
      const now = new Date();
      if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) {
        return false;
      }
    }
    return true;
  });

  // Calculate Summary
  let totalIncome = 0;
  let totalExpense = 0;
  filtered.forEach((tx) => {
    if (tx.type === 'income') totalIncome += tx.amount;
    else if (tx.type === 'expense') totalExpense += tx.amount;
  });
  const netCashflow = totalIncome - totalExpense;

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedList = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Export handlers
  const handleExport = async (format: 'xlsx' | 'pdf') => {
    if (format === 'xlsx') setIsExportingExcel(true);
    if (format === 'pdf') setIsExportingPdf(true);

    try {
      const res = await fetch('/api/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions: filtered,
          wallets,
          categories,
          format,
          startDate: periodPreset === 'this_month' ? '01 Okt 2026' : 'Awal',
          endDate: periodPreset === 'this_month' ? '31 Okt 2026' : 'Akhir',
          userName: profile.full_name,
        }),
      });

      if (!res.ok) throw new Error('Gagal mengunduh file laporan');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TataDana_Laporan_${format.toUpperCase()}_${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Terjadi error saat mengekspor: ${err.message}`);
    } finally {
      setIsExportingExcel(false);
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-surface-900 tracking-tight">
            Laporan Keuangan & Mutasi
          </h1>
          <p className="text-xs text-surface-500 mt-1">
            Rekapitulasi arus kas bulanan, filter granular, dan generator ekspor ke format Excel & PDF.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => handleExport('xlsx')}
            isLoading={isExportingExcel}
            className="shrink-0 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-600" />
            Ekspor Excel (.xlsx)
          </Button>

          <Button
            variant="primary"
            onClick={() => handleExport('pdf')}
            isLoading={isExportingPdf}
            className="shrink-0"
          >
            <FileText className="w-4 h-4 mr-1.5" />
            Ekspor PDF Resmi
          </Button>
        </div>
      </div>

      {/* Report Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">
              Total Pemasukan
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-black text-emerald-600">{formatRupiah(totalIncome)}</h3>
        </Card>

        <Card className="p-5 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">
              Total Pengeluaran
            </span>
            <TrendingDown className="w-4 h-4 text-red-600" />
          </div>
          <h3 className="text-2xl font-black text-red-600">{formatRupiah(totalExpense)}</h3>
        </Card>

        <Card className="p-5 border-l-4 border-l-brand-500">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">
              Arus Kas Bersih (Net)
            </span>
            <Scale className="w-4 h-4 text-brand-600" />
          </div>
          <h3 className={`text-2xl font-black ${netCashflow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatRupiah(netCashflow)}
          </h3>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 bg-surface-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => { setPeriodPreset('this_month'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                periodPreset === 'this_month' ? 'bg-white text-brand-700 shadow-2xs' : 'text-surface-600'
              }`}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => { setPeriodPreset('all'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                periodPreset === 'all' ? 'bg-white text-brand-700 shadow-2xs' : 'text-surface-600'
              }`}
            >
              Semua Periode
            </button>
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
            className="px-3 py-1.5 rounded-xl border border-surface-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            <option value="all">Semua Jenis Transaksi</option>
            <option value="expense">Pengeluaran Saja</option>
            <option value="income">Pemasukan Saja</option>
            <option value="transfer">Transfer Antar Wallet</option>
          </select>

          {/* Wallet Filter */}
          <select
            value={filterWallet}
            onChange={(e) => { setFilterWallet(e.target.value); setCurrentPage(1); }}
            className="px-3 py-1.5 rounded-xl border border-surface-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            <option value="all">Semua Dompet / Wallet</option>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>

          <span className="text-xs text-surface-400 ml-auto">
            Menampilkan <strong>{filtered.length}</strong> transaksi terpilih
          </span>
        </div>
      </Card>

      {/* Report Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-surface-50 text-surface-500 uppercase tracking-wider font-semibold border-b border-surface-200">
              <tr>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Deskripsi Transaksi</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Wallet</th>
                <th className="py-3 px-4">Sumber</th>
                <th className="py-3 px-4 text-right">Nominal (IDR)</th>
                <th className="py-3 px-4 text-center">Struk Item</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {paginatedList.length > 0 ? (
                paginatedList.map((tx) => {
                  const cat = categories.find((c) => c.id === tx.category_id);
                  const wal = wallets.find((w) => w.id === tx.wallet_id);

                  return (
                    <tr key={tx.id} className="hover:bg-surface-50/70 transition-colors">
                      <td className="py-3 px-4 font-medium text-surface-700 whitespace-nowrap">
                        {formatDateIndo(tx.transaction_date)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-surface-900">{tx.description}</div>
                        {tx.notes && (
                          <div className="text-[11px] text-surface-500 truncate max-w-sm">
                            {tx.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {cat ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-surface-100 text-surface-700 font-medium">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: cat.color }}
                            />
                            {cat.name}
                          </span>
                        ) : (
                          <span className="text-surface-400">Transfer</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-surface-800">
                        {wal?.name || 'Wallet'}
                      </td>
                      <td className="py-3 px-4">
                        {tx.source === 'telegram_text' && <Badge variant="orange" size="sm">Telegram</Badge>}
                        {tx.source === 'telegram_receipt' && <Badge variant="purple" size="sm">Struk OCR</Badge>}
                        {tx.source === 'telegram_voice' && <Badge variant="blue" size="sm">VN Suara</Badge>}
                        {tx.source === 'manual' && <Badge variant="gray" size="sm">Manual</Badge>}
                      </td>
                      <td className="py-3 px-4 text-right font-black whitespace-nowrap">
                        {tx.type === 'expense' && (
                          <span className="text-red-600">-{formatRupiah(tx.amount)}</span>
                        )}
                        {tx.type === 'income' && (
                          <span className="text-emerald-600">+{formatRupiah(tx.amount)}</span>
                        )}
                        {tx.type === 'transfer' && (
                          <span className="text-blue-600">{formatRupiah(tx.amount)}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {tx.receipt_items && tx.receipt_items.length > 0 ? (
                          <button
                            onClick={() => setSelectedReceiptTx(tx)}
                            className="px-2.5 py-1 rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 font-bold transition-colors inline-flex items-center gap-1"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>{tx.receipt_items.length} Item</span>
                          </button>
                        ) : (
                          <span className="text-surface-300">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-surface-400">
                    Tidak ada transaksi dalam periode ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 bg-surface-50 border-t border-surface-200 flex items-center justify-between text-xs">
            <span className="text-surface-500">
              Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong>
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Receipt Breakdown Modal */}
      <ReceiptBreakdownModal
        transaction={selectedReceiptTx}
        isOpen={Boolean(selectedReceiptTx)}
        onClose={() => setSelectedReceiptTx(null)}
      />
    </div>
  );
}
