'use client';

import React, { useState } from 'react';
import { useTataDana } from '@/lib/store/tatadana-store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formatRupiah } from '@/lib/utils';
import {
  WalletCards,
  Plus,
  ArrowLeftRight,
  CheckCircle2,
  Trash2,
  Building2,
  Smartphone,
  Banknote,
  Star,
} from 'lucide-react';
import { WalletType, Wallet } from '@/lib/types';

export default function WalletsPage() {
  const { wallets, addWallet, updateWallet, deleteWallet, addTransaction, profile } =
    useTataDana();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  // New Wallet form
  const [name, setName] = useState('');
  const [type, setType] = useState<WalletType>('bank');
  const [balance, setBalance] = useState('500000');
  const [accountNumber, setAccountNumber] = useState('');
  const [color, setColor] = useState('#00529C');

  // Transfer form
  const [sourceWalletId, setSourceWalletId] = useState(wallets[0]?.id || '');
  const [destWalletId, setDestWalletId] = useState(wallets[1]?.id || '');
  const [transferAmount, setTransferAmount] = useState('100000');
  const [transferFee, setTransferFee] = useState('0');
  const [transferNotes, setTransferNotes] = useState('Pindah saldo operasional');

  const handleCreateWallet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const numBalance = parseFloat(balance) || 0;

    addWallet({
      user_id: profile.id,
      name,
      type,
      balance: numBalance,
      account_number: accountNumber || 'Akun Utama',
      color,
      icon: type === 'bank' ? 'building-2' : type === 'ewallet' ? 'smartphone' : 'banknote',
      is_default: wallets.length === 0,
    });

    setName('');
    setAccountNumber('');
    setIsAddOpen(false);
  };

  const handleSetDefault = (id: string) => {
    wallets.forEach((w) => {
      updateWallet(w.id, { is_default: w.id === id });
    });
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(transferAmount);
    const fee = parseFloat(transferFee) || 0;
    if (isNaN(amount) || amount <= 0 || sourceWalletId === destWalletId) return;

    addTransaction({
      user_id: profile.id,
      wallet_id: sourceWalletId,
      destination_wallet_id: destWalletId,
      category_id: null,
      type: 'transfer',
      amount,
      fee,
      description: `Transfer Antar Wallet`,
      notes: transferNotes,
      source: 'manual',
      transaction_date: new Date().toISOString().slice(0, 10),
      ai_parsed: false,
    });

    setIsTransferOpen(false);
  };

  const totalConsolidated = wallets.reduce((sum, w) => sum + w.balance, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-surface-900 tracking-tight">
            Multi-Wallet Management
          </h1>
          <p className="text-xs text-surface-500 mt-1">
            Satukan pemantauan rekening bank, dompet digital e-wallet, dan uang tunai fisik dalam satu tempat.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => setIsTransferOpen(true)}
            className="shrink-0"
          >
            <ArrowLeftRight className="w-4 h-4 mr-1.5" />
            Transfer Antar Wallet
          </Button>
          <Button onClick={() => setIsAddOpen(true)} className="shrink-0 shadow-brand-glow">
            <Plus className="w-4 h-4 mr-1.5" />
            Tambah Wallet
          </Button>
        </div>
      </div>

      {/* Summary Banner */}
      <div className="p-6 rounded-3xl bg-surface-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-card-soft">
        <div>
          <span className="text-xs font-bold text-surface-400 uppercase tracking-wider block">
            Total Likuiditas Seluruh Wallet
          </span>
          <h2 className="text-3xl font-black text-white mt-1">
            {formatRupiah(totalConsolidated)}
          </h2>
        </div>
        <div className="flex items-center gap-3 text-xs text-surface-300">
          <div className="px-3 py-1.5 rounded-xl bg-surface-800 border border-surface-700">
            {wallets.length} Akun Terdaftar
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-surface-800 border border-surface-700">
            Mata Uang: IDR (Rupiah)
          </div>
        </div>
      </div>

      {/* Wallets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {wallets.map((w) => {
          return (
            <Card
              key={w.id}
              className="relative overflow-hidden group hover:border-surface-400 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold shadow-xs"
                      style={{ backgroundColor: w.color }}
                    >
                      {w.type === 'bank' && <Building2 className="w-5 h-5" />}
                      {w.type === 'ewallet' && <Smartphone className="w-5 h-5" />}
                      {w.type === 'cash' && <Banknote className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-surface-900 flex items-center gap-1.5">
                        <span>{w.name}</span>
                        {w.is_default && (
                          <span
                            className="p-0.5 text-amber-500"
                            title="Wallet Default"
                          >
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-surface-500 font-mono">
                        {w.account_number || w.type.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  {wallets.length > 1 && (
                    <button
                      onClick={() => {
                        if (confirm(`Hapus wallet "${w.name}"?`)) {
                          deleteWallet(w.id);
                        }
                      }}
                      className="p-1.5 text-surface-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Hapus Wallet"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="my-3">
                  <span className="text-[10px] uppercase font-bold text-surface-400 block">
                    Saldo Tersedia
                  </span>
                  <span className="text-2xl font-black text-surface-900 tracking-tight">
                    {formatRupiah(w.balance)}
                  </span>
                </div>
              </div>

              {/* Action footer */}
              <div className="pt-3 border-t border-surface-100 flex items-center justify-between text-xs">
                {w.is_default ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Default Pilihan
                  </span>
                ) : (
                  <button
                    onClick={() => handleSetDefault(w.id)}
                    className="text-surface-500 hover:text-brand-600 font-medium transition-colors text-[11px]"
                  >
                    Set sebagai Default
                  </button>
                )}

                <span className="text-surface-400 capitalize text-[11px]">
                  Tipe: {w.type}
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Add Wallet Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Tambah Akun Wallet Baru"
        description="Daftarkan rekening bank baru, dompet digital, atau uang tunai."
        maxWidth="md"
      >
        <form onSubmit={handleCreateWallet} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-surface-600 mb-1">
              Nama Wallet
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: BCA Tabungan, OVO Jajan, Tunai"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-surface-600 mb-1">
                Tipe Wallet
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as WalletType)}
                className="w-full px-3 py-2 rounded-xl border border-surface-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="bank">Rekening Bank</option>
                <option value="ewallet">E-Wallet Digital</option>
                <option value="cash">Uang Tunai / Cash</option>
                <option value="investment">Investasi / Reksadana</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-600 mb-1">
                Warna Kartu
              </label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full h-9 rounded-xl border border-surface-200 cursor-pointer p-1 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-600 mb-1">
              Nomor Rekening / Identitas Akun
            </label>
            <input
              type="text"
              placeholder="Contoh: 8830-1928-33 atau 081234567890"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-surface-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-600 mb-1">
              Saldo Awal (Rupiah)
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-surface-200 text-sm font-bold text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-100">
            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
              Batal
            </Button>
            <Button type="submit">
              Simpan Wallet
            </Button>
          </div>
        </form>
      </Modal>

      {/* Transfer Modal */}
      <Modal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        title="Transfer Saldo Antar Wallet"
        description="Pindahkan dana antara rekening dan e-wallet Anda secara langsung."
        maxWidth="md"
      >
        <form onSubmit={handleExecuteTransfer} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-surface-600 mb-1">
                Dari Wallet (Sumber)
              </label>
              <select
                value={sourceWalletId}
                onChange={(e) => setSourceWalletId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-surface-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({formatRupiah(w.balance)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-600 mb-1">
                Ke Wallet (Tujuan)
              </label>
              <select
                value={destWalletId}
                onChange={(e) => setDestWalletId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-surface-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                {wallets
                  .filter((w) => w.id !== sourceWalletId)
                  .map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatRupiah(w.balance)})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-600 mb-1">
              Nominal Transfer (Rupiah)
            </label>
            <input
              type="number"
              required
              min="1000"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 text-sm font-bold text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-600 mb-1">
              Biaya Admin / Fee (Opsional)
            </label>
            <input
              type="number"
              min="0"
              value={transferFee}
              onChange={(e) => setTransferFee(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-surface-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-600 mb-1">
              Catatan
            </label>
            <input
              type="text"
              value={transferNotes}
              onChange={(e) => setTransferNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-surface-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-100">
            <Button type="button" variant="outline" onClick={() => setIsTransferOpen(false)}>
              Batal
            </Button>
            <Button type="submit">
              Kirim Transfer Saldo
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
