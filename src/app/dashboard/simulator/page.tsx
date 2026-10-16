'use client';

import React from 'react';
import { TelegramChatSimulator } from '@/components/simulator/TelegramChatSimulator';
import { Bot, ShieldCheck, Zap, Sparkles, ExternalLink, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export default function SimulatorPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold bg-brand-100 text-brand-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Zero Tunnel Setup
            </span>
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Simulator
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-surface-900 tracking-tight">
            In-App Telegram Bot Simulator
          </h1>
          <p className="text-xs text-surface-500 mt-1">
            Uji coba pencatatan teks bahasa santai/slang, vision OCR foto struk, dan rekaman suara secara langsung tanpa perlu ngrok atau server publik.
          </p>
        </div>

        <Link
          href="/dashboard/settings"
          className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1.5 shrink-0"
        >
          <span>Konfigurasi Bot Token Asli</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Guide Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-surface-200/80 shadow-xs flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-surface-900">1. Teks Slang Rupiah</h4>
            <p className="text-[11px] text-surface-500 mt-0.5">
              Ketik contoh: <code className="text-brand-600 font-mono">kopi 28rb gopay</code> atau{' '}
              <code className="text-brand-600 font-mono">gaji 15jt bca</code>.
            </p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-surface-200/80 shadow-xs flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-surface-900">2. Vision OCR Struk</h4>
            <p className="text-[11px] text-surface-500 mt-0.5">
              Klik tombol kamera untuk menguji ekstraksi multi-item struk Alfamart secara otomatis.
            </p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-surface-200/80 shadow-xs flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-surface-900">3. Sinkronisasi Otomatis</h4>
            <p className="text-[11px] text-surface-500 mt-0.5">
              Setiap respons bot akan langsung meng-update saldo dompet dan daftar transaksi di dashboard.
            </p>
          </div>
        </div>
      </div>

      {/* The Simulator Chat Client */}
      <TelegramChatSimulator />
    </div>
  );
}
