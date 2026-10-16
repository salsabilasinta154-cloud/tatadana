'use client';

import React, { useState } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Filter,
  Receipt,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Pencil,
} from 'lucide-react';
import { useTataDana } from '@/lib/store/tatadana-store';
import { Transaction, TransactionType } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatRupiah, formatDateIndo } from '@/lib/utils';
import { TransactionModal } from '@/components/dashboard/TransactionModal';
import { ReceiptBreakdownModal } from '@/components/dashboard/ReceiptBreakdownModal';

export default function TransactionsPage() {
  const { transactions, wallets, categories, deleteTransaction } = useTataDana();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterWallet, setFilterWallet] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<Transaction | null>(null);

  // Filter transactions
  const filtered = transactions.filter((tx) => {
    if (filterType !== 'all' && tx.type !== filterType) return false;
    if (filterWallet !== 'all' && tx.wallet_id !== filterWallet) return false;
    if (filterCategory !== 'all' && tx.category_id !== filterCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchDesc = tx.description.toLowerCase().includes(q);
      const matchNotes = (tx.notes || '').toLowerCase().includes(q);
      if (!matchDesc && !matchNotes) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-surface-900 tracking-tight">
            Mutasi Transaksi
          </h1>
          <p className="text-xs text-surface-500 mt-1">
            Kelola seluruh riwayat pemasukan, pengeluaran, dan transfer antar wallet Anda.
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingTx(null);
            setIsModalOpen(true);
          }}
          className="shrink-0 shadow-brand-glow"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Catat Transaksi Baru
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              placeholder="Cari deskripsi atau catatan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-surface-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-surface-50/50"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-surface-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="all">Semua Jenis Transaksi</option>
              <option value="expense">Pengeluaran (Expense)</option>
              <option value="income">Pemasukan (Income)</option>
              <option value="transfer">Transfer Antar Wallet</option>
            </select>
          </div>

          {/* Wallet Filter */}
          <div>
            <select
              value={filterWallet}
              onChange={(e) => setFilterWallet(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-surface-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="all">Semua Wallet</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-surface-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Transactions Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-surface-50 text-surface-500 uppercase tracking-wider font-semibold border-b border-surface-200">
              <tr>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Deskripsi & Catatan</th>
                <th className="py-3 px-4">Tipe</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Wallet</th>
                <th className="py-3 px-4">Sumber</th>
                <th className="py-3 px-4 text-right">Nominal</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {filtered.length > 0 ? (
                filtered.map((tx) => {
                  const cat = categories.find((c) => c.id === tx.category_id);
                  const wal = wallets.find((w) => w.id === tx.wallet_id);
                  const destWal = wallets.find((w) => w.id === tx.destination_wallet_id);

                  return (
                    <tr key={tx.id} className="hover:bg-surface-50/70 transition-colors">
                      <td className="py-3 px-4 font-medium text-surface-700 whitespace-nowrap">
                        {formatDateIndo(tx.transaction_date)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-surface-900">{tx.description}</div>
                        {tx.notes && (
                          <div className="text-[11px] text-surface-500 max-w-sm truncate">
                            {tx.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {tx.type === 'expense' && (
                          <span className="inline-flex items-center gap-1 font-semibold text-red-600">
                            <ArrowUpRight className="w-3.5 h-3.5" /> Pengeluaran
                          </span>
                        )}
                        {tx.type === 'income' && (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                            <ArrowDownLeft className="w-3.5 h-3.5" /> Pemasukan
                          </span>
                        )}
                        {tx.type === 'transfer' && (
                          <span className="inline-flex items-center gap-1 font-semibold text-blue-600">
                            <ArrowLeftRight className="w-3.5 h-3.5" /> Transfer
                          </span>
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
                          <span className="text-surface-400">
                            {destWal ? `Ke ${destWal.name}` : '-'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-surface-800">
                          {wal?.name || 'Wallet'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {tx.source === 'telegram_text' && <Badge variant="orange" size="sm">Bot Text</Badge>}
                        {tx.source === 'telegram_receipt' && <Badge variant="purple" size="sm">Struk OCR</Badge>}
                        {tx.source === 'telegram_voice' && <Badge variant="blue" size="sm">Voice Note</Badge>}
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
                        <div className="flex items-center justify-center gap-2">
                          {tx.receipt_items && tx.receipt_items.length > 0 && (
                            <button
                              onClick={() => setSelectedReceiptTx(tx)}
                              className="p-1 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                              title="Lihat Rincian Struk"
                            >
                              <Receipt className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditingTx(tx);
                              setIsModalOpen(true);
                            }}
                            className="p-1 text-surface-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                            title="Ubah Transaksi"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Hapus transaksi "${tx.description}"? Saldo wallet akan dikembalikan.`)) {
                                deleteTransaction(tx.id);
                              }
                            }}
                            className="p-1 text-surface-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus Transaksi"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-surface-400">
                    Tidak ada transaksi yang cocok dengan kriteria pencarian Anda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modals */}
      <TransactionModal
        isOpen={isModalOpen}
        initialTransaction={editingTx}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTx(null);
        }}
      />
      <ReceiptBreakdownModal
        transaction={selectedReceiptTx}
        isOpen={Boolean(selectedReceiptTx)}
        onClose={() => setSelectedReceiptTx(null)}
      />
    </div>
  );
}
