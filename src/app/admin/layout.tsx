'use client';

import React from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { ShieldCheck, LogOut, ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useTataDana } from '@/lib/store/tatadana-store';
import { Button } from '@/components/ui/Button';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = useTataDana();

  // Access check: Only Sinta Salsabila / Admin can access Superadmin Console
  if (!profile.is_admin) {
    return (
      <div className="min-h-screen bg-[#0C0A09] text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-3xl bg-surface-900 border border-surface-800 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-red-950/80 border border-red-800 text-red-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-400 bg-red-950 px-2.5 py-0.5 rounded-full border border-red-800">
              Akses Ditolak (403 Forbidden)
            </span>
            <h1 className="text-xl font-black text-white pt-1">
              Portal Khusus Admin Sinta Salsabila
            </h1>
            <p className="text-xs text-surface-400 leading-relaxed">
              Akun Anda saat ini (<strong>{profile.full_name}</strong>) terdaftar sebagai akun <strong>User</strong>. Sesuai kebijakan keamanan, halaman Superadmin hanya dapat diakses oleh Admin Sinta Salsabila.
            </p>
          </div>
          <div className="pt-2">
            <Link href="/dashboard">
              <Button className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs">
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Kembali ke Dashboard User
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex h-screen bg-[#0C0A09] text-surface-100 overflow-hidden">
      {/* Admin Sidebar */}
      <AdminSidebar />

      {/* Admin Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-surface-950">
        {/* Admin Header */}
        <header className="h-16 bg-surface-900 border-b border-surface-800 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-brand-500 uppercase tracking-wider">
              TataDana Superadmin Console
            </span>
            <span className="text-surface-600">•</span>
            <span className="text-surface-400">Environment: Production Sandbox</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-brand-950 border border-brand-800 text-brand-400 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-500" />
              <span>Akses Penuh Superadmin</span>
            </div>
            <Link
              href="/dashboard"
              className="text-xs text-surface-400 hover:text-white flex items-center gap-1 font-medium transition-colors"
            >
              <span>Dashboard User</span>
              <LogOut className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        {/* Scrollable View */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
