'use client';

import React, { useState, useEffect } from 'react';
import { useTataDana } from '@/lib/store/tatadana-store';
import { Transaction, TransactionType } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatRupiah } from '@/lib/utils';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Sparkles } from 'lucide-react';
import { parseIndonesianSlang } from '@/lib/ai/slang-parser';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTransaction?: Transaction | null;
}

export function TransactionModal({ isOpen, onClose, initialTransaction }: TransactionModalProps) {
  const { wallets, categories, addTransaction, updateTransaction, profile } = useTataDana();

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<string>('25000');
  const [walletId, setWalletId] = useState<string>(wallets[0]?.id || '');
  const [destWalletId, setDestWalletId] = useState<string>(wallets[1]?.id || '');
  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id || '');
  const [description, setDescription] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [slangQuickInput, setSlangQuickInput] = useState<string>('');

  useEffect(() => {
    if (initialTransaction) {
      setType(initialTransaction.type);
      setAmount(initialTransaction.amount.toString());
      setWalletId(initialTransaction.wallet_id || wallets[0]?.id || '');
      setDestWalletId(initialTransaction.destination_wallet_id || wallets[1]?.id || '');
      setCategoryId(initialTransaction.category_id || categories[0]?.id || '');
      setDescription(initialTransaction.description);
      setNotes(initialTransaction.notes || '');
      setDate(initialTransaction.transaction_date);
    } else if (isOpen) {
      setType('expense');
      setAmount('25000');
      setWalletId(wallets[0]?.id || '');
      setDestWalletId(wallets[1]?.id || '');
      setCategoryId(categories.filter((c) => c.type === 'expense')[0]?.id || categories[0]?.id || '');
      setDescription('');
      setNotes('');
      setDate(new Date().toISOString().slice(0, 10));
      setSlangQuickInput('');
    }
  }, [initialTransaction, isOpen, wallets, categories]);

  // Handle Smart Slang parsing inside modal
  const handleApplySlang = () => {
    if (!slangQuickInput.trim()) return;
    const parsed = parseIndonesianSlang(slangQuickInput);
    if (parsed.amount) {
      setAmount(parsed.amount.toString());
    }
    setType(parsed.type);
    setDescription(parsed.description);

    // Match category
    const matchedCat = categories.find((c) => c.name.toLowerCase() === parsed.categoryName.toLowerCase());
    if (matchedCat) setCategoryId(matchedCat.id);

    // Dompet tidak dipilih otomatis sesuai instruksi: user memilih dompet sendiri secara manual.
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(/[^0-9]/g, ''));
    if (isNaN(numAmount) || numAmount <= 0) return;

    if (initialTransaction) {
      updateTransaction(initialTransaction.id, {
        wallet_id: walletId || null,
        destination_wallet_id: type === 'transfer' ? destWalletId : null,
        category_id: type === 'transfer' ? null : categoryId || null,
        type,
        amount: numAmount,
        description: description || (type === 'transfer' ? 'Transfer Saldo' : 'Transaksi'),
        notes,
        transaction_date: date,
      });
    } else {
      addTransaction({
        user_id: profile.id,
        wallet_id: walletId || null,
        destination_wallet_id: type === 'transfer' ? destWalletId : null,
        category_id: type === 'transfer' ? null : categoryId || null,
        type,
        amount: numAmount,
        fee: 0,
        description: description || (type === 'transfer' ? 'Transfer Saldo' : 'Transaksi Baru'),
        notes,
        source: 'manual',
        transaction_date: date,
        ai_parsed: false,
      });
    }

    // Reset and close
    setSlangQuickInput('');
    setDescription('');
    setNotes('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialTransaction ? 'Ubah Transaksi Keuangan' : 'Catat Transaksi Keuangan'}
      description={
        initialTransaction
          ? 'Perbarui detail transaksi dan saldo dompet Anda akan disesuaikan otomatis.'
          : 'Tambahkan pemasukan, pengeluaran, atau transfer antar dompet Anda.'
      }
      maxWidth="lg"
    >
      {/* Quick Slang AI Bar */}
      <div className="mb-5 p-3 bg-brand-50/70 border border-brand-200/80 rounded-2xl">
        <label className="text-xs font-bold text-brand-800 flex items-center gap-1.5 mb-1.5">
          <Sparkles className="w-3.5 h-3.5 text-brand-600" />
          Ketik Teks Slang AI (Auto-Fill Otomatis)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Contoh: 'kopi kenangan 28rb gopay' atau 'gaji 15jt bca'"
            value={slangQuickInput}
            onChange={(e) => setSlangQuickInput(e.target.value)}
            className="flex-1 text-xs px-3 py-2 rounded-xl border border-brand-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <Button type="button" size="sm" onClick={handleApplySlang}>
            Terapkan
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1 bg-surface-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
              type === 'expense'
                ? 'bg-white text-brand-600 shadow-xs'
                : 'text-surface-600 hover:text-surface-900'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            Pengeluaran
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
              type === 'income'
                ? 'bg-white text-emerald-600 shadow-xs'
                : 'text-surface-600 hover:text-surface-900'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            Pemasukan
          </button>
          <button
            type="button"
            onClick={() => setType('transfer')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
              type === 'transfer'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-surface-600 hover:text-surface-900'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            Transfer
          </button>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-xs font-semibold text-surface-600 mb-1">
            Nominal (Rupiah)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-surface-400 text-sm">
              Rp
            </span>
            <input
              type="number"
              required
              min="100"
              step="100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-surface-200 text-lg font-bold text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <span className="text-[11px] text-surface-500 mt-1 block">
            Terbaca: <span className="font-semibold text-brand-600">{formatRupiah(Number(amount) || 0)}</span>
          </span>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-surface-600 mb-1">
            Deskripsi Transaksi
          </label>
          <input
            type="text"
            required
            placeholder="Contoh: Makan Siang Nasi Padang"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Wallet Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-surface-600 mb-1">
              {type === 'transfer' ? 'Dari Wallet (Sumber)' : 'Pilih Wallet'}
            </label>
            <select
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-surface-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({formatRupiah(w.balance)})
                </option>
              ))}
            </select>
          </div>

          {type === 'transfer' ? (
            <div>
              <label className="block text-xs font-semibold text-surface-600 mb-1">
                Ke Wallet (Tujuan)
              </label>
              <select
                value={destWalletId}
                onChange={(e) => setDestWalletId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-surface-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                {wallets
                  .filter((w) => w.id !== walletId)
                  .map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatRupiah(w.balance)})
                    </option>
                  ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-surface-600 mb-1">
                Kategori
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-surface-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                {categories
                  .filter((c) => c.type === type)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>

        {/* Date and Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-surface-600 mb-1">
              Tanggal Transaksi
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-surface-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-surface-600 mb-1">
              Catatan Tambahan (Opsional)
            </label>
            <input
              type="text"
              placeholder="Misal: bersama tim kantor"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-surface-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit">
            {initialTransaction ? 'Simpan Perubahan' : 'Simpan Transaksi'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
