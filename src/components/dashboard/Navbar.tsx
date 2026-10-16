'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { Menu, Send, Bot, CheckCircle2, UserCheck, Bell, Camera, X } from 'lucide-react';
import { useTataDana } from '@/lib/store/tatadana-store';
import { Badge } from '@/components/ui/Badge';
import { compressImageFile } from '@/lib/utils';

interface NavbarProps {
  onToggleMobileMenu: () => void;
}

export function Navbar({ onToggleMobileMenu }: NavbarProps) {
  const { profile, updateProfile, telegramConnection, impersonatingUserId, stopImpersonation } = useTataDana();
  const navbarFileInputRef = useRef<HTMLInputElement>(null);

  const handleNavbarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Silakan pilih file gambar yang valid.');
      if (navbarFileInputRef.current) navbarFileInputRef.current.value = '';
      return;
    }
    try {
      const compressedBase64 = await compressImageFile(file, 360, 360, 0.82);
      updateProfile({ avatar_url: compressedBase64 });
    } catch (err: any) {
      alert(`Gagal memproses gambar: ${err.message || 'Terjadi kesalahan'}`);
    } finally {
      if (navbarFileInputRef.current) navbarFileInputRef.current.value = '';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-surface-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Hidden File Input */}
      <input
        ref={navbarFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleNavbarFileChange}
      />

      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 text-surface-600 hover:text-surface-900 hover:bg-surface-100 rounded-xl"
        >
          <Menu className="w-5 h-5" />
        </button>

        {impersonatingUserId && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 px-3 py-1 rounded-full text-xs font-semibold text-amber-800">
            <UserCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Mode Impersonasi: {profile.full_name}</span>
            <button
              onClick={() => stopImpersonation()}
              className="ml-1 text-[10px] font-bold bg-amber-200 hover:bg-amber-300 text-amber-900 px-1.5 py-0.5 rounded-md transition-colors"
              title="Keluar dari impersonasi dan kembali ke akun Superadmin"
            >
              Keluar
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Telegram Bot Live Status Pill */}
        <Link
          href="/dashboard/simulator"
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-200/80 text-brand-700 hover:bg-brand-100 transition-colors"
          title="Buka Telegram Bot Simulator"
        >
          <Bot className="w-4 h-4 text-brand-600" />
          <span className="text-xs font-medium">@TataDanaBot</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </Link>

        {/* Telegram Linked Status */}
        {telegramConnection.is_verified ? (
          <Badge variant="green" size="sm" className="hidden md:inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Telegram Terhubung
          </Badge>
        ) : (
          <Badge variant="orange" size="sm" className="hidden md:inline-flex">
            Bot Belum Terhubung
          </Badge>
        )}

        {/* User Profile dropdown preview */}
        <div className="flex items-center gap-2.5 p-1 pr-2 hover:bg-surface-100 rounded-full transition-colors group">
          <div className="relative group/avatar">
            <Link
              href="/dashboard/settings"
              className="w-8 h-8 rounded-full overflow-hidden border border-brand-200 bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-xs block"
            >
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                profile.full_name.charAt(0) || 'U'
              )}
            </Link>
            {/* Quick Upload Button on avatar */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navbarFileInputRef.current?.click();
              }}
              title="Pilih foto profil dari perangkat"
              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-xs hover:scale-110 transition-transform opacity-80 hover:opacity-100"
            >
              <Camera className="w-2.5 h-2.5" />
            </button>
          </div>

          <Link href="/dashboard/settings" className="hidden sm:block text-left">
            <p className="text-xs font-bold text-surface-900 group-hover:text-brand-600 transition-colors leading-tight">
              {profile.full_name}
            </p>
            <p className="text-[10px] text-surface-500 font-medium">
              {profile.subscription_tier.toUpperCase()} TIER
            </p>
          </Link>
        </div>
      </div>
    </header>
  );
}
