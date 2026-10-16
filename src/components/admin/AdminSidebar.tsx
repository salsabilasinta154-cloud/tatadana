'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldAlert,
  Cpu,
  Users,
  CreditCard,
  FileCode2,
  ArrowLeft,
  LayoutDashboard,
  Camera,
} from 'lucide-react';
import { cn, compressImageFile } from '@/lib/utils';
import { useTataDana } from '@/lib/store/tatadana-store';

export function AdminSidebar() {
  const pathname = usePathname();
  const { profile, updateProfile, users } = useTataDana();
  const adminFileInputRef = useRef<HTMLInputElement>(null);

  const handleAdminFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Silakan pilih file gambar yang valid.');
      if (adminFileInputRef.current) adminFileInputRef.current.value = '';
      return;
    }
    try {
      const compressedBase64 = await compressImageFile(file, 360, 360, 0.82);
      updateProfile({ avatar_url: compressedBase64 });
    } catch (err: any) {
      alert(`Gagal memproses gambar: ${err.message || 'Terjadi kesalahan'}`);
    } finally {
      if (adminFileInputRef.current) adminFileInputRef.current.value = '';
    }
  };

  const pendingUserCount = (profile && users ? users : []).filter(
    (u) => u.approval_status === 'pending'
  ).length;

  const links = [
    { name: 'Admin Overview', href: '/admin', icon: LayoutDashboard },
    { name: 'AI Providers & Failover', href: '/admin/ai-providers', icon: Cpu },
    { name: 'Kelola Pengguna', href: '/admin/users', icon: Users },
    {
      name: 'Approval Akun Masuk',
      href: '/admin/approvals',
      icon: Users,
      badge: pendingUserCount > 0 ? `${pendingUserCount} Pending` : undefined,
    },
    { name: 'Approval Pembayaran', href: '/admin/payments', icon: CreditCard },
    { name: 'Log AI & Audit', href: '/admin/logs', icon: FileCode2 },
  ];

  return (
    <aside className="w-64 bg-surface-900 text-white flex flex-col h-full shrink-0 select-none border-r border-surface-800">
      <div className="p-6 border-b border-surface-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center font-bold text-lg text-white shadow-brand-glow">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-sm tracking-tight text-white block leading-tight">
              TataDana <span className="text-brand-500">SuperAdmin</span>
            </h2>
            <span className="text-[10px] text-surface-400 font-medium">Control Center</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {links.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all',
                isActive
                  ? 'bg-brand-600 text-white shadow-brand-glow'
                  : 'text-surface-400 hover:text-white hover:bg-surface-800'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Hidden File Input */}
      <input
        ref={adminFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAdminFileChange}
      />

      <div className="p-4 border-t border-surface-800 space-y-2">
        {/* Admin Avatar Preview */}
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-surface-950/70 border border-surface-800">
          <div className="relative group/avatar shrink-0">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-brand-500/40 bg-surface-800 flex items-center justify-center text-brand-400 font-bold text-xs shrink-0">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                profile.full_name.charAt(0) || 'A'
              )}
            </div>
            {/* Quick Upload Button on avatar */}
            <button
              type="button"
              onClick={() => adminFileInputRef.current?.click()}
              title="Pilih foto profil dari perangkat"
              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-xs hover:scale-110 transition-transform opacity-80 hover:opacity-100"
            >
              <Camera className="w-2.5 h-2.5" />
            </button>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate">{profile.full_name}</p>
            <p className="text-[10px] text-brand-400 font-mono">Superadmin</p>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-surface-400 hover:text-brand-400 hover:bg-surface-800 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke User Dashboard</span>
        </Link>
      </div>
    </aside>
  );
}
