'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Navbar } from '@/components/dashboard/Navbar';
import { TransactionModal } from '@/components/dashboard/TransactionModal';
import { useTataDana } from '@/lib/store/tatadana-store';
import { Clock, XCircle, ArrowLeft, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = useTataDana();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNewTxModalOpen, setIsNewTxModalOpen] = useState(false);

  // Guard: Akun user yang berstatus pending approval wajib disetujui dahulu oleh Admin Sinta Salsabila
  if (profile.approval_status === 'pending' && !profile.is_admin) {
    return (
      <div className="min-h-screen bg-stone-50 text-surface-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white border border-amber-200 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-300 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
              Menunggu Approval Admin
            </span>
            <h1 className="text-xl font-black text-surface-900 pt-1">
              Pendaftaran Anda Sedang Ditinjau
            </h1>
            <p className="text-xs text-surface-500 leading-relaxed">
              Halo <strong>{profile.full_name}</strong>, sesuai kebijakan aplikasi TataDana, seluruh pendaftaran akun baru harus disetujui terlebih dahulu oleh <strong>Admin Sinta Salsabila</strong> sebelum dapat mengakses dashboard.
            </p>
          </div>
          <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200/80 text-[11px] text-amber-800 text-left space-y-1">
            <div className="flex justify-between">
              <span className="text-amber-600">Email:</span>
              <span className="font-mono font-bold">{profile.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-amber-600">Admin Pengelola:</span>
              <span className="font-bold">Sinta Salsabila (Superadmin)</span>
            </div>
          </div>
          <div className="pt-2">
            <Link href="/auth/login">
              <Button className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs">
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Kembali ke Halaman Masuk
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (profile.approval_status === 'rejected') {
    return (
      <div className="min-h-screen bg-stone-50 text-surface-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white border border-red-200 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-300 text-red-600 flex items-center justify-center mx-auto shadow-inner">
            <XCircle className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-700 bg-red-100 px-3 py-1 rounded-full border border-red-300">
              Pendaftaran Ditolak
            </span>
            <h1 className="text-xl font-black text-surface-900 pt-1">
              Akses Belum Disetujui
            </h1>
            <p className="text-xs text-surface-500 leading-relaxed">
              Mohon maaf, permohonan akses akun untuk <strong>{profile.email}</strong> ditolak oleh Admin Sinta Salsabila. Silakan hubungi admin atau daftarkan akun baru dengan data yang valid.
            </p>
          </div>
          <div className="pt-2">
            <Link href="/auth/login">
              <Button variant="outline" className="w-full font-bold text-xs">
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Kembali ke Halaman Masuk
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#FAFAF9] overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar
        onOpenNewTx={() => setIsNewTxModalOpen(true)}
        className="hidden lg:flex"
      />

      {/* Mobile Sidebar Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-surface-950/60 backdrop-blur-xs"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <Sidebar
            onOpenNewTx={() => setIsNewTxModalOpen(true)}
            onCloseMobile={() => setIsMobileMenuOpen(false)}
            className="relative z-10 w-72 h-full shadow-2xl"
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* Global Transaction Modal */}
      <TransactionModal
        isOpen={isNewTxModalOpen}
        onClose={() => setIsNewTxModalOpen(false)}
      />
    </div>
  );
}
