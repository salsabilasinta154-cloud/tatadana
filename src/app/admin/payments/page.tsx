'use client';

import React, { useState, useRef } from 'react';
import { useTataDana } from '@/lib/store/tatadana-store';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { formatRupiah, formatDateTimeIndo, openImageInNewTab, compressImageFile } from '@/lib/utils';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Eye,
  Building2,
  QrCode,
  AlertCircle,
  Phone,
  Mail,
  Clock,
  Search,
  Sparkles,
  Plus,
  RefreshCw,
  Check,
  ShieldCheck,
  ExternalLink,
  RotateCcw,
  Upload,
  ImageIcon,
  User,
} from 'lucide-react';
import { PaymentTransaction } from '@/lib/types';

export default function AdminPaymentsPage() {
  const { payments, approvePayment, rejectPayment, addPayment, resetToSeed, profile } = useTataDana();

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [selectedReceiptPayment, setSelectedReceiptPayment] =
    useState<PaymentTransaction | null>(null);
  const [rejectingPayment, setRejectingPayment] =
    useState<PaymentTransaction | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);

  // Toast / feedback message
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Simulation form state
  const [simTargetType, setSimTargetType] = useState<'current' | 'other'>('current');
  const [simName, setSimName] = useState('Pradita Wijaya');
  const [simEmail, setSimEmail] = useState('pradita.w@gmail.com');
  const [simPhone, setSimPhone] = useState('0812-9876-5432');
  const [simPlan, setSimPlan] = useState<'starter_monthly' | 'pro_lifetime'>('pro_lifetime');
  const [simMethod, setSimMethod] = useState<'manual_transfer' | 'midtrans_qris'>('manual_transfer');
  const [simBank, setSimBank] = useState('BCA');
  const [simReceiptMode, setSimReceiptMode] = useState<'default' | 'upload'>('default');
  const [simCustomReceipt, setSimCustomReceipt] = useState<string>('');
  const simReceiptFileRef = useRef<HTMLInputElement>(null);

  const handleSimReceiptChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Silakan pilih file gambar bukti transfer.');
      if (simReceiptFileRef.current) simReceiptFileRef.current.value = '';
      return;
    }
    try {
      const compressed = await compressImageFile(file, 900, 900, 0.78);
      setSimCustomReceipt(compressed);
      setSimReceiptMode('upload');
    } catch (err: any) {
      alert(`Gagal memproses gambar: ${err.message || 'Terjadi kesalahan'}`);
    } finally {
      if (simReceiptFileRef.current) simReceiptFileRef.current.value = '';
    }
  };

  const handleSimulateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const orderPrefix = simPlan === 'pro_lifetime' ? 'TD-PRO' : 'TD-START';
    const orderId = `${orderPrefix}-${Date.now().toString().slice(-6)}`;
    const amount = simPlan === 'pro_lifetime' ? 99000 : 49000;

    const finalName = simTargetType === 'current' ? profile.full_name : simName;
    const finalEmail = simTargetType === 'current' ? profile.email : simEmail;
    const finalPhone = simTargetType === 'current' ? (profile.phone || '0812-3456-7890') : simPhone;
    const finalUserId = simTargetType === 'current' ? profile.id : undefined;

    const finalReceipt =
      simMethod === 'manual_transfer'
        ? simReceiptMode === 'upload' && simCustomReceipt
          ? simCustomReceipt
          : 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80'
        : undefined;

    addPayment({
      order_id: orderId,
      plan_code: simPlan,
      amount,
      payment_method: simMethod,
      status: simMethod === 'midtrans_qris' ? 'settlement' : 'pending',
      bank_name: simMethod === 'manual_transfer' ? `Bank ${simBank}` : undefined,
      account_sender_name: simMethod === 'manual_transfer' ? finalName : undefined,
      manual_receipt_url: finalReceipt,
      user_id: finalUserId,
      user_name: finalName,
      user_email: finalEmail,
      user_phone: finalPhone,
      admin_notes:
        simMethod === 'midtrans_qris'
          ? 'Midtrans QRIS Sandbox Instant Settlement'
          : `Menunggu konfirmasi mutasi rekening ${simBank} a/n PT Tata Dana`,
    });

    setIsSimulateModalOpen(false);
    showToast(
      'success',
      `Transaksi uji coba ${orderId} (${simPlan === 'pro_lifetime' ? 'Paket Pro' : 'Paket Starter'}) berhasil dibuat untuk ${finalName}!`
    );
  };

  const handleApprove = (orderId: string, planCode: string, userName?: string) => {
    approvePayment(orderId, 'Disetujui oleh Superadmin');
    const planLabel = planCode.includes('pro') ? 'Pro Lifetime' : 'Starter';
    showToast(
      'success',
      `Pembayaran order ${orderId} berhasil disetujui! Akun ${userName || 'user'} telah di-upgrade ke ${planLabel}.`
    );
    if (selectedReceiptPayment?.order_id === orderId) {
      setSelectedReceiptPayment(null);
    }
  };

  const handleOpenReject = (pay: PaymentTransaction) => {
    setRejectingPayment(pay);
    setRejectReason('Bukti transfer tidak valid / nominal tidak cocok');
  };

  const handleConfirmReject = () => {
    if (!rejectingPayment) return;
    const orderId = rejectingPayment.order_id;
    const reason = rejectReason.trim() || 'Bukti transfer ditolak oleh admin';
    rejectPayment(orderId, reason);
    setRejectingPayment(null);
    if (selectedReceiptPayment?.order_id === orderId) {
      setSelectedReceiptPayment(null);
    }
    showToast('error', `Pembayaran order ${orderId} ditolak: "${reason}"`);
  };

  // Metrics calculation
  const totalCount = payments.length;
  const pendingCount = payments.filter((p) => p.status === 'pending').length;
  const settlementCount = payments.filter((p) => p.status === 'settlement').length;
  const rejectedCount = payments.filter((p) => p.status === 'rejected').length;
  const settlementRevenue = payments
    .filter((p) => p.status === 'settlement')
    .reduce((sum, p) => sum + p.amount, 0);

  // Filtered Payments
  const filtered = payments.filter((p) => {
    // Status filter
    if (filterStatus === 'pending' && p.status !== 'pending') return false;
    if (filterStatus === 'settlement' && p.status !== 'settlement') return false;
    if (filterStatus === 'rejected' && p.status !== 'rejected') return false;

    // Plan filter
    if (filterPlan === 'starter' && !p.plan_code.includes('start')) return false;
    if (filterPlan === 'pro' && !p.plan_code.includes('pro')) return false;

    // Method filter
    if (filterMethod === 'manual' && p.payment_method !== 'manual_transfer') return false;
    if (filterMethod === 'midtrans' && p.payment_method === 'manual_transfer') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchOrder = p.order_id.toLowerCase().includes(q);
      const matchName = (p.user_name || '').toLowerCase().includes(q);
      const matchEmail = (p.user_email || '').toLowerCase().includes(q);
      const matchPhone = (p.user_phone || '').toLowerCase().includes(q);
      if (!matchOrder && !matchName && !matchEmail && !matchPhone) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold border transition-all animate-in fade-in slide-in-from-top-2 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-700 shadow-lg shadow-emerald-950/50'
              : 'bg-red-950/90 text-red-300 border-red-700 shadow-lg shadow-red-950/50'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-surface-400 hover:text-white ml-4 text-xs font-mono"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-brand-500" />
            Approval Pembelian Aplikasi
          </h1>
          <p className="text-xs text-surface-400 mt-1 max-w-2xl leading-relaxed">
            Pusat verifikasi transaksi pembelian Paket Starter (Rp49.000/bln) dan Paket Pro (Rp99.000 Sekali Bayar) baik dari Midtrans Sandbox maupun Transfer Bank Manual.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={() => setIsSimulateModalOpen(true)}
            className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-brand-glow"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Simulasi Transaksi Baru
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (confirm('Reset ulang data demo pembayaran ke kondisi default?')) {
                resetToSeed();
                showToast('success', 'Data transaksi berhasil di-reset ke data bawaan.');
              }
            }}
            className="text-xs border-surface-700 hover:bg-surface-800 text-surface-300"
            title="Reset ke data bawaan"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Reset Data
          </Button>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Transaksi */}
        <div className="p-4 rounded-2xl bg-surface-900 border border-surface-800">
          <div className="flex items-center justify-between text-surface-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Transaksi</span>
            <CreditCard className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalCount} Pesanan</div>
          <p className="text-[11px] text-surface-400 mt-0.5">Semua metode & paket</p>
        </div>

        {/* Menunggu Approval */}
        <div className="p-4 rounded-2xl bg-surface-900 border border-amber-900/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between text-amber-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Menunggu Approval</span>
            <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-amber-400">{pendingCount} Transaksi</div>
          <p className="text-[11px] text-amber-300/80 mt-0.5">Perlu verifikasi bukti transfer</p>
        </div>

        {/* Disetujui (Settlement) */}
        <div className="p-4 rounded-2xl bg-surface-900 border border-emerald-900/50">
          <div className="flex items-center justify-between text-emerald-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Disetujui (Settlement)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{settlementCount} Transaksi</div>
          <p className="text-[11px] text-emerald-300/80 mt-0.5">
            Omzet: {formatRupiah(settlementRevenue)}
          </p>
        </div>

        {/* Ditolak (Rejected) */}
        <div className="p-4 rounded-2xl bg-surface-900 border border-red-900/40">
          <div className="flex items-center justify-between text-red-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Ditolak</span>
            <XCircle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400">{rejectedCount} Transaksi</div>
          <p className="text-[11px] text-surface-400 mt-0.5">Bukti tidak valid / kadaluarsa</p>
        </div>
      </div>

      {/* Filter Badges & Search Bar */}
      <div className="bg-surface-900 rounded-2xl border border-surface-800 p-4 space-y-4">
        {/* Status Filter Badges */}
        <div className="flex flex-wrap items-center gap-2 pb-1">
          <span className="text-xs font-bold text-surface-400 uppercase tracking-wider mr-1">
            Status:
          </span>

          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'all'
                ? 'bg-brand-600 text-white shadow-brand-glow'
                : 'text-surface-400 hover:text-white bg-surface-950/60 hover:bg-surface-800'
            }`}
          >
            Semua ({totalCount})
          </button>

          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterStatus === 'pending'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/50'
                : 'text-amber-400 bg-amber-950/40 border border-amber-900/60 hover:bg-amber-950'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Menunggu Approval (Pending) ({pendingCount})
          </button>

          <button
            onClick={() => setFilterStatus('settlement')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterStatus === 'settlement'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50'
                : 'text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 hover:bg-emerald-950'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Disetujui (Settlement) ({settlementCount})
          </button>

          <button
            onClick={() => setFilterStatus('rejected')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterStatus === 'rejected'
                ? 'bg-red-600 text-white shadow-lg shadow-red-900/50'
                : 'text-red-400 bg-red-950/40 border border-red-900/60 hover:bg-red-950'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            Ditolak ({rejectedCount})
          </button>
        </div>

        {/* Secondary Filters: Search & Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2 border-t border-surface-800">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-surface-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari Nama pembeli, Email, Nomor HP, atau Order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-surface-950 border border-surface-800 text-xs text-white placeholder-surface-500 focus:outline-none focus:border-brand-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div>
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-surface-950 border border-surface-800 text-xs text-surface-300 focus:outline-none focus:border-brand-500"
            >
              <option value="all">Semua Paket Aplikasi</option>
              <option value="starter">Paket Starter (Rp 49.000/bln)</option>
              <option value="pro">Paket Pro (Rp 99.000 Sekali Bayar)</option>
            </select>
          </div>

          <div>
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-surface-950 border border-surface-800 text-xs text-surface-300 focus:outline-none focus:border-brand-500"
            >
              <option value="all">Semua Metode Pembayaran</option>
              <option value="manual">Transfer Bank Manual</option>
              <option value="midtrans">Midtrans Sandbox (QRIS & Snap)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Approval Table */}
      <div className="bg-surface-900 rounded-3xl border border-surface-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-surface-950 text-surface-400 uppercase tracking-wider font-semibold border-b border-surface-800">
              <tr>
                <th className="py-3.5 px-4">Order ID & Waktu</th>
                <th className="py-3.5 px-4">Rincian Pembeli</th>
                <th className="py-3.5 px-4">Paket Aplikasi</th>
                <th className="py-3.5 px-4">Nominal</th>
                <th className="py-3.5 px-4">Metode Bayar</th>
                <th className="py-3.5 px-4 text-center">Bukti Transfer</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Aksi Verifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-surface-500">
                    <AlertCircle className="w-8 h-8 text-surface-600 mx-auto mb-2" />
                    <p className="font-bold text-surface-400 text-sm">Tidak ada transaksi yang cocok.</p>
                    <p className="text-[11px] text-surface-500 mt-1">
                      Coba sesuaikan kata kunci pencarian atau ganti filter status.
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((pay) => {
                  const isPro = pay.plan_code.toLowerCase().includes('pro');

                  return (
                    <tr
                      key={pay.id}
                      className="hover:bg-surface-950/70 transition-colors group"
                    >
                      {/* Order ID & Tanggal/Jam */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-white text-[11px]">
                          {pay.order_id}
                        </div>
                        <div className="text-[10px] text-surface-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-surface-500" />
                          <span>{formatDateTimeIndo(pay.created_at)}</span>
                        </div>
                      </td>

                      {/* Rincian Pembeli (Nama, Email, No HP) */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-xs">
                          {pay.user_name || 'Pengguna TataDana'}
                        </div>
                        <div className="text-[11px] text-surface-400 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-surface-500 shrink-0" />
                          <span className="truncate max-w-[160px]">{pay.user_email || '-'}</span>
                        </div>
                        <div className="text-[11px] text-brand-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-brand-500 shrink-0" />
                          <span className="font-mono">{pay.user_phone || '0812-3456-7890'}</span>
                        </div>
                      </td>

                      {/* Paket Aplikasi */}
                      <td className="py-3.5 px-4">
                        {isPro ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-orange-950/60 border border-orange-800 text-orange-300 font-bold text-[11px]">
                            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                            <span>Pro Lifetime (Rp99k)</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-950/60 border border-blue-800 text-blue-300 font-bold text-[11px]">
                            <Check className="w-3.5 h-3.5 text-blue-400" />
                            <span>Starter (Rp49k/bln)</span>
                          </div>
                        )}
                      </td>

                      {/* Nominal */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-black text-white text-sm">
                          {formatRupiah(pay.amount)}
                        </span>
                      </td>

                      {/* Metode Bayar */}
                      <td className="py-3.5 px-4">
                        {pay.payment_method === 'manual_transfer' ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 text-blue-400 font-bold text-xs">
                              <Building2 className="w-3.5 h-3.5" /> Transfer {pay.bank_name || 'BCA'}
                            </span>
                            {pay.account_sender_name && (
                              <div className="text-[10px] text-surface-400 truncate max-w-[140px]">
                                a/n {pay.account_sender_name}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-xs">
                              <QrCode className="w-3.5 h-3.5" /> Midtrans QRIS
                            </span>
                            <div className="text-[10px] text-surface-500 font-mono">
                              Sandbox API
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Bukti Transfer */}
                      <td className="py-3.5 px-4 text-center">
                        {pay.manual_receipt_url ? (
                          <button
                            onClick={() => setSelectedReceiptPayment(pay)}
                            className="px-2.5 py-1.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-brand-400 font-bold inline-flex items-center gap-1.5 transition-all hover:scale-105 border border-surface-700"
                            title="Klik untuk membuka gambar bukti transfer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Lihat Bukti</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedReceiptPayment(pay)}
                            className="px-2.5 py-1.5 rounded-xl bg-surface-950/60 hover:bg-surface-800 text-surface-400 hover:text-emerald-400 font-mono text-[10px] inline-flex items-center gap-1 border border-surface-800 transition-colors"
                            title="Klik untuk melihat rincian verifikasi otomatis API"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>Otomatis API</span>
                          </button>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {pay.status === 'settlement' && (
                          <div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> DISUTUJUI (SETTLEMENT)
                            </span>
                            {pay.admin_notes && (
                              <p className="text-[10px] text-surface-400 mt-0.5 truncate max-w-[160px]">
                                {pay.admin_notes}
                              </p>
                            )}
                          </div>
                        )}

                        {pay.status === 'pending' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800 inline-flex items-center gap-1 animate-pulse">
                            <Clock className="w-3 h-3" /> MENUNGGU APPROVAL
                          </span>
                        )}

                        {pay.status === 'rejected' && (
                          <div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800 inline-flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> DITOLAK
                            </span>
                            {pay.admin_notes && (
                              <p className="text-[10px] text-red-400/80 mt-0.5 italic truncate max-w-[160px]">
                                Alasan: {pay.admin_notes}
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Aksi Verifikasi */}
                      <td className="py-3.5 px-4 text-center">
                        {pay.status === 'pending' ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(pay.order_id, pay.plan_code, pay.user_name)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2.5 py-1 font-bold"
                              title="Setujui dan upgrade paket pengguna otomatis"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleOpenReject(pay)}
                              className="text-xs px-2.5 py-1 font-bold"
                              title="Tolak pembayaran dengan catatan alasan"
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" />
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-surface-500 text-[11px] font-semibold">
                              {pay.status === 'settlement' ? 'Selesai Disetujui' : 'Telah Ditolak'}
                            </span>
                            {pay.status === 'rejected' && (
                              <button
                                onClick={() => handleApprove(pay.order_id, pay.plan_code, pay.user_name)}
                                className="text-[10px] text-brand-400 hover:underline ml-1 font-bold"
                                title="Ubah status menjadi disetujui"
                              >
                                Pulihkan
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Lihat Bukti Transfer Bank */}
      <Modal
        isOpen={Boolean(selectedReceiptPayment)}
        onClose={() => setSelectedReceiptPayment(null)}
        title="Pemeriksaan Bukti Transfer Bank"
        description={`Order ID: ${selectedReceiptPayment?.order_id || ''} • Pembeli: ${selectedReceiptPayment?.user_name || ''}`}
        maxWidth="lg"
      >
        {selectedReceiptPayment && (
          <div className="space-y-4">
            {/* Image Preview Container or API Settlement Card */}
            {selectedReceiptPayment.manual_receipt_url ? (
              <div className="rounded-2xl overflow-hidden border border-surface-200 max-h-96 flex items-center justify-center bg-surface-950 p-2 relative group">
                <img
                  src={selectedReceiptPayment.manual_receipt_url}
                  alt="Bukti Transfer"
                  className="max-h-80 w-auto object-contain rounded-xl shadow-md"
                />
                <button
                  type="button"
                  onClick={() =>
                    openImageInNewTab(
                      selectedReceiptPayment.manual_receipt_url || '',
                      `Bukti Transfer - ${selectedReceiptPayment.order_id}`
                    )
                  }
                  className="absolute bottom-4 right-4 bg-black/75 hover:bg-black text-white px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition-colors shadow-md"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Buka Ukuran Penuh
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-emerald-900/60 bg-emerald-950/40 p-5 text-center text-emerald-300 space-y-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-1" />
                <p className="font-bold text-sm">Pembayaran Terverifikasi Otomatis Midtrans</p>
                <p className="text-xs text-emerald-400/80 font-mono">
                  ID: {selectedReceiptPayment.midtrans_transaction_id || selectedReceiptPayment.order_id} • QRIS / Snap Settlement
                </p>
              </div>
            )}

            {/* Buyer and Transaction Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-surface-50 rounded-2xl text-xs border border-surface-200">
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-surface-500">Nama Pembeli:</span>
                  <span className="font-bold text-surface-900">{selectedReceiptPayment.user_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-500">Alamat Email:</span>
                  <span className="font-mono text-surface-800">{selectedReceiptPayment.user_email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-500">Nomor WhatsApp:</span>
                  <span className="font-mono font-bold text-brand-600">
                    {selectedReceiptPayment.user_phone || '0812-3456-7890'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-500">Waktu Transaksi:</span>
                  <span className="text-surface-800">
                    {formatDateTimeIndo(selectedReceiptPayment.created_at)}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 sm:border-l sm:border-surface-200 sm:pl-3">
                <div className="flex justify-between">
                  <span className="text-surface-500">Paket Aplikasi:</span>
                  <span className="font-bold uppercase text-brand-600">
                    {selectedReceiptPayment.plan_code.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-500">Nominal Transfer:</span>
                  <span className="font-black text-emerald-600 text-sm">
                    {formatRupiah(selectedReceiptPayment.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-500">Bank Pengirim:</span>
                  <span className="font-bold text-surface-900">
                    {selectedReceiptPayment.bank_name || 'Bank BCA'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-500">Nama Rekening:</span>
                  <span className="font-bold text-surface-900">
                    {selectedReceiptPayment.account_sender_name || selectedReceiptPayment.user_name}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons in Modal */}
            <div className="flex items-center justify-between pt-3 border-t border-surface-200">
              <span className="text-xs text-surface-500">
                Status saat ini:{' '}
                <strong className="text-surface-900 uppercase">
                  {selectedReceiptPayment.status}
                </strong>
              </span>

              <div className="flex items-center gap-2">
                {selectedReceiptPayment.status === 'pending' ? (
                  <>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleOpenReject(selectedReceiptPayment)}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      Tolak Bukti
                    </Button>
                    <Button
                      size="sm"
                      onClick={() =>
                        handleApprove(
                          selectedReceiptPayment.order_id,
                          selectedReceiptPayment.plan_code,
                          selectedReceiptPayment.user_name
                        )
                      }
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Setujui & Upgrade Akun
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedReceiptPayment(null)}
                  >
                    Tutup
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal 2: Alasan Penolakan Pembayaran */}
      <Modal
        isOpen={Boolean(rejectingPayment)}
        onClose={() => setRejectingPayment(null)}
        title="Tolak Pembayaran Transaksi"
        description={`Order ID: ${rejectingPayment?.order_id || ''} • Pembeli: ${rejectingPayment?.user_name || ''}`}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-surface-700 mb-1.5">
              Catatan Alasan Penolakan (Akan disimpan di riwayat & audit log):
            </label>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full p-3 rounded-xl border border-surface-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Contoh: Bukti transfer buram, nominal transfer tidak sesuai, dll..."
            />
          </div>

          {/* Quick Reason Chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-surface-500">Pilihan Cepat Alasan:</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Bukti transfer buram / tidak terbaca',
                'Nominal transfer tidak sesuai',
                'Nama pemilik rekening tidak cocok',
                'Mutasi belum masuk ke rekening',
                'Bukti transaksi terindikasi palsu',
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setRejectReason(chip)}
                  className="px-2.5 py-1 rounded-lg bg-surface-100 hover:bg-brand-50 text-[10px] text-surface-700 hover:text-brand-700 border border-surface-200 transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-200">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRejectingPayment(null)}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleConfirmReject}
            >
              Konfirmasi Tolak Pembayaran
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal 3: Simulasi Transaksi Pembelian Baru */}
      <Modal
        isOpen={isSimulateModalOpen}
        onClose={() => setIsSimulateModalOpen(false)}
        title="Simulasi Pembelian Aplikasi Baru"
        description="Buat transaksi uji coba langsung untuk menguji alur approval dan upgrade akun di dashboard admin."
        maxWidth="md"
      >
        <form onSubmit={handleSimulateSubmit} className="space-y-4">
          {/* Target User Selector */}
          <div>
            <label className="block text-xs font-bold text-surface-700 mb-1">
              Target Akun Pembeli
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSimTargetType('current')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  simTargetType === 'current'
                    ? 'border-brand-500 bg-brand-50 text-brand-900 ring-2 ring-brand-500/20'
                    : 'border-surface-200 bg-white hover:border-surface-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-brand-700">
                  <User className="w-3.5 h-3.5" />
                  <span>Akun Profil Saya</span>
                </div>
                <p className="text-[10px] text-surface-500 mt-0.5 truncate">
                  {profile.full_name} ({profile.subscription_tier.toUpperCase()})
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSimTargetType('other')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  simTargetType === 'other'
                    ? 'border-brand-500 bg-brand-50 text-brand-900 ring-2 ring-brand-500/20'
                    : 'border-surface-200 bg-white hover:border-surface-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-surface-800">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Pengguna Lain / Kustom</span>
                </div>
                <p className="text-[10px] text-surface-500 mt-0.5">Input data pembeli baru</p>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-surface-700 mb-1">
              Pilihan Paket Pembelian
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSimPlan('pro_lifetime')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  simPlan === 'pro_lifetime'
                    ? 'border-brand-500 bg-brand-50/70 ring-2 ring-brand-500/20'
                    : 'border-surface-200 bg-white hover:border-surface-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-surface-900">Paket Pro Lifetime</span>
                  <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                </div>
                <span className="text-sm font-black text-brand-600 mt-1">Rp 99.000</span>
                <span className="text-[10px] text-surface-500">Sekali Bayar</span>
              </button>

              <button
                type="button"
                onClick={() => setSimPlan('starter_monthly')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  simPlan === 'starter_monthly'
                    ? 'border-brand-500 bg-brand-50/70 ring-2 ring-brand-500/20'
                    : 'border-surface-200 bg-white hover:border-surface-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-surface-900">Paket Starter</span>
                  <Check className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <span className="text-sm font-black text-blue-600 mt-1">Rp 49.000</span>
                <span className="text-[10px] text-surface-500">Per Bulan</span>
              </button>
            </div>
          </div>

          {/* Buyer Details Fields (if custom user) */}
          {simTargetType === 'other' ? (
            <div className="space-y-3 p-3 bg-surface-50 rounded-xl border border-surface-200">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-surface-600 mb-1">
                    Nama Pembeli
                  </label>
                  <input
                    type="text"
                    required
                    value={simName}
                    onChange={(e) => setSimName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-surface-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-surface-600 mb-1">
                    Nomor WhatsApp / HP
                  </label>
                  <input
                    type="tel"
                    required
                    value={simPhone}
                    onChange={(e) => setSimPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-surface-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-600 mb-1">
                  Email Pembeli
                </label>
                <input
                  type="email"
                  required
                  value={simEmail}
                  onChange={(e) => setSimEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-surface-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                />
              </div>
            </div>
          ) : (
            <div className="p-3 bg-brand-50/60 rounded-xl border border-brand-100 text-xs flex items-center justify-between">
              <div>
                <span className="font-bold text-surface-900 block">{profile.full_name}</span>
                <span className="text-surface-500 text-[11px]">{profile.email} • {profile.phone || '0812-3456-7890'}</span>
              </div>
              <Badge variant="orange" size="sm">Akun Aktif</Badge>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-surface-600 mb-1">
              Metode Pembayaran
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSimMethod('manual_transfer')}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                  simMethod === 'manual_transfer'
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-surface-200 text-surface-600 hover:bg-surface-50'
                }`}
              >
                Transfer Bank Manual (Pending)
              </button>
              <button
                type="button"
                onClick={() => setSimMethod('midtrans_qris')}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                  simMethod === 'midtrans_qris'
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-surface-200 text-surface-600 hover:bg-surface-50'
                }`}
              >
                Midtrans QRIS (Settlement)
              </button>
            </div>
          </div>

          {simMethod === 'manual_transfer' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-surface-600 mb-1">
                  Bank Pengirim
                </label>
                <select
                  value={simBank}
                  onChange={(e) => setSimBank(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-surface-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="BCA">Bank BCA</option>
                  <option value="Mandiri">Bank Mandiri</option>
                  <option value="BRI">Bank BRI</option>
                  <option value="BNI">Bank BNI</option>
                  <option value="BSI">Bank Syariah Indonesia (BSI)</option>
                </select>
              </div>

              {/* Receipt Image Upload or Sample */}
              <div>
                <input
                  ref={simReceiptFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleSimReceiptChange}
                />
                <label className="block text-xs font-semibold text-surface-600 mb-1">
                  Bukti Pembayaran / Struk Transfer
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => simReceiptFileRef.current?.click()}
                    className="text-xs bg-white border-brand-200 text-brand-700 font-bold"
                  >
                    <Upload className="w-3.5 h-3.5 mr-1 text-brand-600" />
                    Pilih File dari Perangkat
                  </Button>
                  {simCustomReceipt && (
                    <button
                      type="button"
                      onClick={() => setSimCustomReceipt('')}
                      className="text-[10px] text-red-500 hover:underline"
                    >
                      Reset ke Struk Bawaan
                    </button>
                  )}
                </div>

                {simCustomReceipt ? (
                  <div className="mt-2 flex items-center gap-2 p-2 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800">
                    <img
                      src={simCustomReceipt}
                      alt="Preview"
                      className="w-10 h-10 object-cover rounded-lg border border-emerald-300"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-bold block truncate">Struk Kustom Terunggah</span>
                      <span className="text-[10px] text-emerald-600">Siap diperiksa di modal admin</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-surface-500 mt-1">
                    Opsional: Gunakan struk default demo atau unggah file gambar struk asli dari perangkat Anda.
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-200">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsSimulateModalOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" size="sm" className="font-bold">
              Buat Transaksi Sekarang
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
