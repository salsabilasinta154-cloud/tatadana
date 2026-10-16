'use client';

import React, { useState } from 'react';
import { useTataDana } from '@/lib/store/tatadana-store';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
  UserCheck,
  UserX,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Plus,
  ShieldCheck,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { ManagedUser } from '@/lib/types';

export default function AdminApprovalsPage() {
  const { users, approveUser, rejectUser, registerUser, profile, resetToSeed } = useTataDana();

  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
  const [simName, setSimName] = useState('Raditya Pratama');
  const [simEmail, setSimEmail] = useState('raditya.p@gmail.com');
  const [simPhone, setSimPhone] = useState('0852-1122-3344');

  const [rejectingUser, setRejectingUser] = useState<ManagedUser | null>(null);
  const [rejectReason, setRejectReason] = useState('Data pendaftaran tidak valid atau tidak memenuhi syarat');

  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const usersList: ManagedUser[] = users || [];

  // Metrics
  const totalCount = usersList.length;
  const pendingCount = usersList.filter((u) => u.approval_status === 'pending').length;
  const approvedCount = usersList.filter((u) => u.approval_status === 'approved' || (!u.approval_status && u.status === 'active')).length;
  const rejectedCount = usersList.filter((u) => u.approval_status === 'rejected').length;

  // Filtered
  const filtered = usersList.filter((u) => {
    const status = u.approval_status || (u.status === 'active' ? 'approved' : 'pending');

    if (filterStatus === 'pending' && status !== 'pending') return false;
    if (filterStatus === 'approved' && status !== 'approved') return false;
    if (filterStatus === 'rejected' && status !== 'rejected') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = u.full_name.toLowerCase().includes(q);
      const matchEmail = u.email.toLowerCase().includes(q);
      const matchPhone = (u.phone || '').toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchPhone) return false;
    }

    return true;
  });

  const handleApprove = (user: ManagedUser) => {
    approveUser(user.id);
    showToast('success', `Akun ${user.full_name} (${user.email}) berhasil disetujui! Pengguna kini dapat masuk ke dashboard.`);
  };

  const handleOpenReject = (user: ManagedUser) => {
    setRejectingUser(user);
    setRejectReason('Pendaftaran ditolak oleh Admin Sinta Salsabila');
  };

  const handleConfirmReject = () => {
    if (!rejectingUser) return;
    rejectUser(rejectingUser.id, rejectReason);
    showToast('error', `Akun ${rejectingUser.full_name} telah ditolak: "${rejectReason}"`);
    setRejectingUser(null);
  };

  const handleSimulateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simName || !simEmail) return;

    const newUser = registerUser({
      full_name: simName,
      email: simEmail,
      phone: simPhone,
    });

    setIsSimulateModalOpen(false);
    showToast('success', `Pendaftar baru "${newUser.full_name}" berhasil disimulasikan dan masuk ke antrean approval.`);
    setFilterStatus('pending');
  };

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

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-400 flex items-center gap-1 bg-brand-950/80 px-2.5 py-0.5 rounded-full border border-brand-800">
              <ShieldCheck className="w-3.5 h-3.5" /> Superadmin Sinta Salsabila
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <UserCheck className="w-6 h-6 text-brand-500" />
            Approval Akun Pengguna Baru
          </h1>
          <p className="text-xs text-surface-400 mt-1 max-w-2xl leading-relaxed">
            Hanya akun <strong>Sinta Salsabila</strong> yang bertindak sebagai Admin. Seluruh akun yang ingin masuk harus disetujui (diapprove) terlebih dahulu sebelum dapat mengakses dashboard. Selain akun Admin ini, seluruh akun terdaftar adalah User.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={() => setIsSimulateModalOpen(true)}
            className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-brand-glow"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Simulasi Pendaftar Baru
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (confirm('Reset seluruh data ke kondisi awal bawaan?')) {
                resetToSeed();
                showToast('success', 'Data akun berhasil direset ke seed default.');
              }
            }}
            className="text-xs border-surface-700 hover:bg-surface-800 text-surface-300"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Reset Data
          </Button>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Approval (Primary) */}
        <div className="p-4 rounded-2xl bg-surface-900 border border-amber-900/60 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between text-amber-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Menunggu Approval</span>
            <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-amber-400">{pendingCount} Akun</div>
          <p className="text-[11px] text-amber-300/80 mt-0.5">Perlu diverifikasi Admin Sinta Salsabila</p>
        </div>

        {/* Disetujui (Approved) */}
        <div className="p-4 rounded-2xl bg-surface-900 border border-emerald-900/50">
          <div className="flex items-center justify-between text-emerald-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Akun Disetujui</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{approvedCount} Pengguna</div>
          <p className="text-[11px] text-emerald-300/80 mt-0.5">Dapat login ke platform</p>
        </div>

        {/* Ditolak (Rejected) */}
        <div className="p-4 rounded-2xl bg-surface-900 border border-red-900/40">
          <div className="flex items-center justify-between text-red-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pendaftaran Ditolak</span>
            <XCircle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400">{rejectedCount} Akun</div>
          <p className="text-[11px] text-surface-400 mt-0.5">Akses masuk diblokir</p>
        </div>

        {/* Total Terdaftar */}
        <div className="p-4 rounded-2xl bg-surface-900 border border-surface-800">
          <div className="flex items-center justify-between text-surface-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Terdaftar</span>
            <Sparkles className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalCount} Akun</div>
          <p className="text-[11px] text-surface-400 mt-0.5">Termasuk 1 Akun Admin Sinta Salsabila</p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-surface-900 rounded-2xl border border-surface-800 p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-surface-400 uppercase tracking-wider mr-1">
            Status:
          </span>

          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterStatus === 'pending'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/50'
                : 'text-amber-400 bg-amber-950/40 border border-amber-900/60 hover:bg-amber-950'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Menunggu Approval ({pendingCount})
          </button>

          <button
            onClick={() => setFilterStatus('approved')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterStatus === 'approved'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50'
                : 'text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 hover:bg-emerald-950'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Disetujui ({approvedCount})
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
        </div>

        {/* Search */}
        <div className="relative pt-2 border-t border-surface-800">
          <Search className="w-4 h-4 text-surface-400 absolute left-3.5 top-1/2 -translate-y-1/2 mt-1" />
          <input
            type="text"
            placeholder="Cari nama pengguna, email, atau nomor HP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-surface-950 border border-surface-800 text-xs text-white placeholder-surface-500 focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-surface-900 rounded-3xl border border-surface-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-surface-950 text-surface-400 uppercase tracking-wider font-semibold border-b border-surface-800">
              <tr>
                <th className="py-3.5 px-4">Pengguna</th>
                <th className="py-3.5 px-4">Kontak (HP)</th>
                <th className="py-3.5 px-4">Role Akses</th>
                <th className="py-3.5 px-4">Tanggal Daftar</th>
                <th className="py-3.5 px-4">Status Approval</th>
                <th className="py-3.5 px-4 text-center">Aksi Persetujuan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-surface-500">
                    <AlertCircle className="w-8 h-8 text-surface-600 mx-auto mb-2" />
                    <p className="font-bold text-surface-400 text-sm">Tidak ada akun dalam daftar ini.</p>
                    <p className="text-[11px] text-surface-500 mt-1">
                      Klik &apos;Simulasi Pendaftar Baru&apos; untuk mencoba alur pendaftaran dan approval.
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const isAdmin =
                    u.role === 'admin' ||
                    u.full_name.toLowerCase().includes('sinta salsabila') ||
                    u.email.toLowerCase().includes('sinta.salsabila');

                  const status = u.approval_status || (u.status === 'active' ? 'approved' : 'pending');

                  return (
                    <tr key={u.id} className="hover:bg-surface-950/70 transition-colors">
                      {/* Name & Email */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-xs flex items-center gap-1.5">
                          {u.full_name}
                          {isAdmin && (
                            <span className="text-[10px] bg-brand-500/20 text-brand-400 font-bold px-1.5 py-0.5 rounded border border-brand-500/40">
                              ADMIN
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-surface-400 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-surface-500" />
                          <span>{u.email}</span>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 font-mono text-surface-300">
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-surface-500" />
                          <span>{u.phone || '-'}</span>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        {isAdmin ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-brand-950 text-brand-300 border border-brand-700 font-bold text-[11px]">
                            👑 SuperAdmin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-surface-800 text-surface-300 border border-surface-700 font-semibold text-[11px]">
                            👤 Regular User
                          </span>
                        )}
                      </td>

                      {/* Created At */}
                      <td className="py-3.5 px-4 text-surface-400 font-mono">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-surface-500" />
                          <span>{new Date(u.created_at).toLocaleDateString('id-ID')}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {status === 'pending' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800 inline-flex items-center gap-1 animate-pulse">
                            <Clock className="w-3 h-3" /> MENUNGGU APPROVAL
                          </span>
                        )}
                        {status === 'approved' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> DISETUJUI (APPROVED)
                          </span>
                        )}
                        {status === 'rejected' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800 inline-flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> DITOLAK
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        {isAdmin ? (
                          <span className="text-[11px] text-surface-500 italic">Akun Superadmin Utama</span>
                        ) : status === 'pending' ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(u)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2.5 py-1 font-bold"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleOpenReject(u)}
                              className="text-xs px-2.5 py-1 font-bold"
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" />
                              Reject
                            </Button>
                          </div>
                        ) : status === 'approved' ? (
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-emerald-400 font-semibold text-[11px] mr-1">Telah Disetujui</span>
                            <button
                              onClick={() => handleOpenReject(u)}
                              className="text-[10px] text-red-400 hover:underline font-bold"
                            >
                              Cabut Izin
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-red-400 font-semibold text-[11px] mr-1">Telah Ditolak</span>
                            <button
                              onClick={() => handleApprove(u)}
                              className="text-[10px] text-emerald-400 hover:underline font-bold"
                            >
                              Setujui Ulang
                            </button>
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

      {/* Modal Simulasi Pendaftar Baru */}
      <Modal
        isOpen={isSimulateModalOpen}
        onClose={() => setIsSimulateModalOpen(false)}
        title="Simulasi Pendaftar Akun Baru"
        description="Buat akun pendaftar baru untuk menguji alur persetujuan Admin Sinta Salsabila."
        maxWidth="md"
      >
        <form onSubmit={handleSimulateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-surface-700 mb-1">
              Nama Lengkap Pendaftar
            </label>
            <input
              type="text"
              required
              value={simName}
              onChange={(e) => setSimName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-surface-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-surface-700 mb-1">
              Alamat Email
            </label>
            <input
              type="email"
              required
              value={simEmail}
              onChange={(e) => setSimEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-surface-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-surface-700 mb-1">
              Nomor WhatsApp / HP
            </label>
            <input
              type="tel"
              required
              value={simPhone}
              onChange={(e) => setSimPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-surface-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="p-3 bg-brand-50 border border-brand-200 rounded-xl text-xs text-brand-900 space-y-1">
            <span className="font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
              Role: Regular User (Pending Approval)
            </span>
            <p className="text-[11px] text-brand-800">
              Akun baru ini akan otomatis masuk ke daftar status Menunggu Approval. Pengguna tidak dapat masuk sebelum Admin Sinta Salsabila menyetujuinya.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-200">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsSimulateModalOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" size="sm" className="bg-brand-600 hover:bg-brand-700 text-white font-bold">
              Daftarkan Akun
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Alasan Penolakan Akun */}
      <Modal
        isOpen={Boolean(rejectingUser)}
        onClose={() => setRejectingUser(null)}
        title="Tolak Pendaftaran Akun"
        description={`Pengguna: ${rejectingUser?.full_name || ''} (${rejectingUser?.email || ''})`}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-surface-700 mb-1.5">
              Alasan Penolakan:
            </label>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full p-3 rounded-xl border border-surface-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-200">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRejectingUser(null)}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmReject}
              className="font-bold"
            >
              Konfirmasi Tolak Akun
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
