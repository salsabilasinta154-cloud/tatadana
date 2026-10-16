'use client';

import React, { useState } from 'react';
import { useTataDana } from '@/lib/store/tatadana-store';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formatRupiah } from '@/lib/utils';
import {
  AlertTriangle,
  Plus,
  PiggyBank,
  CheckCircle2,
  BellRing,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Budget } from '@/lib/types';

export default function BudgetPage() {
  const { budgets, categories, transactions, updateBudget, addBudget, deleteBudget, profile } =
    useTataDana();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  // Form states
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [amount, setAmount] = useState('1000000');
  const [threshold, setThreshold] = useState(80);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Calculate actual spending per category for current month
  const categorySpendingMap = new Map<string, number>();
  transactions
    .filter((tx) => {
      if (tx.type !== 'expense' || !tx.category_id) return false;
      const d = new Date(tx.transaction_date);
      return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
    })
    .forEach((tx) => {
      const current = categorySpendingMap.get(tx.category_id!) || 0;
      categorySpendingMap.set(tx.category_id!, current + tx.amount);
    });

  const handleOpenAdd = () => {
    setEditingBudget(null);
    setCategoryId(categories.filter((c) => c.type === 'expense')[0]?.id || '');
    setAmount('1000000');
    setThreshold(80);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: Budget) => {
    setEditingBudget(b);
    setCategoryId(b.category_id);
    setAmount(b.amount.toString());
    setThreshold(b.alert_threshold);
    setIsModalOpen(true);
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    if (editingBudget) {
      updateBudget(editingBudget.id, {
        amount: numAmount,
        alert_threshold: threshold,
        category_id: categoryId,
      });
    } else {
      addBudget({
        user_id: profile.id,
        category_id: categoryId,
        amount: numAmount,
        month: currentMonth,
        year: currentYear,
        alert_threshold: threshold,
      });
    }
    setIsModalOpen(false);
  };

  // Find any budgets currently exceeding threshold
  const alertTriggeredBudgets = budgets.filter((b) => {
    const spent = categorySpendingMap.get(b.category_id) || 0;
    const percent = Math.round((spent / b.amount) * 100);
    return percent >= b.alert_threshold;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-surface-900 tracking-tight">
            Anggaran Kategori (Smart Budget)
          </h1>
          <p className="text-xs text-surface-500 mt-1">
            Kendalikan pengeluaran bulanan dengan visual progress bar dan alert otomatis saat mendekati limit.
          </p>
        </div>

        <Button onClick={handleOpenAdd} className="shrink-0 shadow-brand-glow">
          <Plus className="w-4 h-4 mr-1.5" />
          Atur Budget Kategori
        </Button>
      </div>

      {/* Alert Warning Banner if triggered */}
      {alertTriggeredBudgets.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-xs text-amber-900">
              Peringatan: {alertTriggeredBudgets.length} Kategori Mendekati / Melebihi Batas Anggaran!
            </h4>
            <p className="text-xs text-amber-800 mt-1">
              {alertTriggeredBudgets.map((b) => {
                const cat = categories.find((c) => c.id === b.category_id);
                const spent = categorySpendingMap.get(b.category_id) || 0;
                const pct = Math.round((spent / b.amount) * 100);
                return `${cat?.name || 'Kategori'}: ${pct}% terpakai (${formatRupiah(spent)} / ${formatRupiah(b.amount)})`;
              }).join(' • ')}
            </p>
          </div>
        </div>
      )}

      {/* Budget Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {budgets.map((b) => {
          const cat = categories.find((c) => c.id === b.category_id);
          const spent = categorySpendingMap.get(b.category_id) || 0;
          const percentage = Math.min(100, Math.round((spent / b.amount) * 100));
          const remaining = Math.max(0, b.amount - spent);
          const isWarning = percentage >= b.alert_threshold;
          const isDanger = percentage >= 95;

          return (
            <Card key={b.id} className="relative overflow-hidden group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: cat?.color || '#FF6B00' }}
                  >
                    <PiggyBank className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-surface-900">{cat?.name || 'Kategori'}</h3>
                    <span className="text-[11px] text-surface-500">
                      Bulan Oktober {currentYear}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(b)}
                    className="p-1.5 text-surface-400 hover:text-surface-700 hover:bg-surface-100 rounded-lg transition-colors"
                    title="Ubah Anggaran"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Hapus target anggaran untuk "${cat?.name || 'Kategori'}"?`)) {
                        deleteBudget(b.id);
                      }
                    }}
                    className="p-1.5 text-surface-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Hapus Anggaran"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Amounts summary */}
              <div className="flex items-baseline justify-between mb-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-surface-400 block">
                    Terpakai
                  </span>
                  <span className="text-base font-extrabold text-surface-900">
                    {formatRupiah(spent)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-surface-400 block">
                    Batas Kuota
                  </span>
                  <span className="text-sm font-semibold text-surface-600">
                    {formatRupiah(b.amount)}
                  </span>
                </div>
              </div>

              {/* Visual Progress Bar */}
              <div className="w-full bg-surface-100 h-2.5 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isDanger
                      ? 'bg-red-500'
                      : isWarning
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {/* Status and Alert Footer */}
              <div className="flex items-center justify-between text-xs pt-2 border-t border-surface-100">
                <span className="text-surface-500">
                  Sisa: <strong className="text-surface-800">{formatRupiah(remaining)}</strong>
                </span>

                <span
                  className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                    isDanger
                      ? 'bg-red-100 text-red-800'
                      : isWarning
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {percentage}% ({b.alert_threshold}% Alert)
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Budget Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBudget ? 'Edit Target Anggaran' : 'Atur Target Anggaran Kategori'}
        description="Tentukan batas nominal pengeluaran dan ambang notifikasi peringatan."
        maxWidth="md"
      >
        <form onSubmit={handleSaveBudget} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-surface-600 mb-1">
              Kategori Pengeluaran
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-surface-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              {categories
                .filter((c) => c.type === 'expense')
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-600 mb-1">
              Batas Anggaran Bulanan (Rupiah)
            </label>
            <input
              type="number"
              required
              min="10000"
              step="50000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 text-sm font-bold text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <span className="text-[11px] text-surface-500 mt-1 block">
              Format: <span className="font-semibold text-brand-600">{formatRupiah(Number(amount) || 0)}</span>
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-600 mb-1">
              Ambang Notifikasi Peringatan ({threshold}%)
            </label>
            <input
              type="range"
              min="50"
              max="100"
              step="5"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full accent-brand-600"
            />
            <div className="flex justify-between text-[10px] text-surface-400 mt-1 font-semibold">
              <span>50% (Aman)</span>
              <span>80% (Standar)</span>
              <span>100% (Maksimal)</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit">
              Simpan Target
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
