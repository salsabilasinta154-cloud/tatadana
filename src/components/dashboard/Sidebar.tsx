'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Receipt,
  PiggyBank,
  WalletCards,
  FileSpreadsheet,
  BotMessageSquare,
  Settings,
  ShieldCheck,
  PlusCircle,
  Sparkles,
  Camera,
} from 'lucide-react';
import { cn, compressImageFile } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { useTataDana } from '@/lib/store/tatadana-store';

interface SidebarProps {
  onOpenNewTx?: () => void;
  className?: string;
  onCloseMobile?: () => void;
}

export function Sidebar({ onOpenNewTx, className, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { profile, updateProfile } = useTataDana();
  const sidebarFileInputRef = useRef<HTMLInputElement>(null);

  const handleSidebarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Silakan pilih file gambar yang valid.');
      if (sidebarFileInputRef.current) sidebarFileInputRef.current.value = '';
      return;
    }
    try {
      const compressedBase64 = await compressImageFile(file, 360, 360, 0.82);
      updateProfile({ avatar_url: compressedBase64 });
    } catch (err: any) {
      alert(`Gagal memproses gambar: ${err.message || 'Terjadi kesalahan'}`);
    } finally {
      if (sidebarFileInputRef.current) sidebarFileInputRef.current.value = '';
    }
  };

  const navigation = [
    { name: 'Ringkasan', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Transaksi', href: '/dashboard/transaksi', icon: Receipt },
    { name: 'Budget Kategori', href: '/dashboard/budget', icon: PiggyBank },
    { name: 'Multi-Wallet', href: '/dashboard/wallets', icon: WalletCards },
    { name: 'Laporan & Ekspor', href: '/dashboard/laporan', icon: FileSpreadsheet },
    {
      name: 'Simulator Telegram',
      href: '/dashboard/simulator',
      icon: BotMessageSquare,
      badge: 'Live Bot',
      badgeColor: 'bg-brand-500 text-white',
    },
    { name: 'Pengaturan', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <aside
      className={cn(
        'w-64 bg-white border-r border-surface-200/80 flex flex-col h-full shrink-0 select-none',
        className
      )}
    >
      {/* Brand Header */}
      <div className="p-6 border-b border-surface-100 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl brand-gradient flex items-center justify-center shadow-brand-glow text-white font-bold text-lg">
            T
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-surface-900 block leading-tight">
              Tata<span className="text-brand-600">Dana</span>
            </span>
            <span className="text-[10px] font-medium text-surface-500 tracking-wider uppercase">
              Fintech AI Indonesia
            </span>
          </div>
        </Link>
      </div>

      {/* Quick Action Button */}
      <div className="p-4 pb-2">
        <Button
          onClick={() => {
            if (onOpenNewTx) onOpenNewTx();
            if (onCloseMobile) onCloseMobile();
          }}
          className="w-full shadow-brand-glow"
        >
          <PlusCircle className="w-4 h-4 mr-1.5" />
          Catat Transaksi
        </Button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={cn(
                'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group',
                isActive
                  ? 'bg-brand-50 text-brand-700 font-semibold shadow-xs'
                  : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    'w-4 h-4 transition-colors',
                    isActive ? 'text-brand-600' : 'text-surface-400 group-hover:text-surface-700'
                  )}
                />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span
                  className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider',
                    item.badgeColor
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Hidden File Input */}
      <input
        ref={sidebarFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleSidebarFileChange}
      />

      {/* Admin and Plan Callout */}
      <div className="p-4 border-t border-surface-100 space-y-2">
        <div className="p-3 bg-gradient-to-br from-brand-50 to-orange-100/50 rounded-2xl border border-brand-200/60">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-brand-900 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" /> TataDana Pro
            </span>
            <span className="text-[10px] bg-brand-600 text-white font-bold px-1.5 py-0.5 rounded-full">
              LIFETIME
            </span>
          </div>
          <p className="text-[11px] text-brand-800 leading-snug">
            AI Gemini Flash & OCR struk tanpa batas aktif selamanya.
          </p>
        </div>

        {profile.is_admin && (
          <Link
            href="/admin"
            onClick={onCloseMobile}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded-xl transition-colors font-bold"
          >
            <ShieldCheck className="w-4 h-4 text-brand-600" />
            <span>Superadmin Portal (Sinta)</span>
          </Link>
        )}
      </div>

      {/* User Profile Card with Avatar & Quick Device Upload */}
      <div className="p-3 border-t border-surface-100 bg-surface-50/60">
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-100 transition-colors group">
          <div className="relative group/avatar shrink-0">
            <Link
              href="/dashboard/settings"
              onClick={onCloseMobile}
              className="w-10 h-10 rounded-xl overflow-hidden border border-brand-200 bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm block"
            >
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-brand-700 text-sm">
                  {profile.full_name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase() || 'U'}
                </div>
              )}
            </Link>

            {/* Quick Upload Button on avatar */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                sidebarFileInputRef.current?.click();
              }}
              title="Pilih foto profil dari perangkat"
              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-xs hover:scale-110 transition-transform"
            >
              <Camera className="w-2.5 h-2.5" />
            </button>
          </div>

          <Link
            href="/dashboard/settings"
            onClick={onCloseMobile}
            className="min-w-0 flex-1 text-left block"
          >
            <p className="text-xs font-bold text-surface-900 truncate group-hover:text-brand-600 transition-colors leading-tight">
              {profile.full_name}
            </p>
            <p className="text-[10px] text-surface-500 truncate mt-0.5">
              {profile.email}
            </p>
          </Link>
        </div>
      </div>
    </aside>
  );
}
