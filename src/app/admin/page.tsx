'use client';

import React from 'react';
import Link from 'next/link';
import {
  Users,
  CreditCard,
  Cpu,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useTataDana } from '@/lib/store/tatadana-store';
import { Card } from '@/components/ui/Card';
import { formatRupiah, formatDateIndo } from '@/lib/utils';

export default function AdminOverviewPage() {
  const { aiConfigs, aiProviderMode, aiLogs, payments, transactions, auditLogs, users } =
    useTataDana();

  const userList = users || [];
  const proUsers = userList.filter((u) => u.tier === 'pro').length;
  const starterUsers = userList.filter((u) => u.tier === 'starter').length;
  const freeUsers = userList.filter((u) => u.tier === 'free').length;

  const pendingPayments = payments.filter((p) => p.status === 'pending');
  const avgLatency =
    aiLogs.length > 0
      ? Math.round(aiLogs.reduce((sum, l) => sum + l.latency_ms, 0) / aiLogs.length)
      : 320;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Superadmin Overview
        </h1>
        <p className="text-xs text-surface-400 mt-1">
          Pantau performa AI provider cluster, status pembayaran Midtrans & transfer, serta metriks platform.
        </p>
      </div>

      {/* 4 Admin Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-surface-900 border border-surface-800">
          <div className="flex items-center justify-between text-surface-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Pengguna</span>
            <Users className="w-4 h-4 text-brand-500" />
          </div>
          <h3 className="text-2xl font-black text-white">{userList.length} User Aktif</h3>
          <p className="text-[11px] text-surface-400 mt-1">
            {proUsers} Pro Lifetime • {starterUsers} Starter • {freeUsers} Free
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-surface-900 border border-surface-800">
          <div className="flex items-center justify-between text-surface-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Transaksi Finansial</span>
            <Sparkles className="w-4 h-4 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-black text-white">{transactions.length} Mutasi</h3>
          <p className="text-[11px] text-emerald-400 mt-1">Sinkronisasi Telegram Real-time</p>
        </div>

        <div className="p-5 rounded-2xl bg-surface-900 border border-surface-800">
          <div className="flex items-center justify-between text-surface-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">AI Latency Rata-rata</span>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>
          <h3 className="text-2xl font-black text-white">{avgLatency} ms</h3>
          <p className="text-[11px] text-surface-400 mt-1">
            Mode: {aiProviderMode === 'failover' ? 'Failover Chain (3 Provider)' : 'Single'}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-surface-900 border border-surface-800">
          <div className="flex items-center justify-between text-surface-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Approval</span>
            <CreditCard className="w-4 h-4 text-amber-500" />
          </div>
          <h3 className="text-2xl font-black text-amber-400">
            {pendingPayments.length} Pembayaran
          </h3>
          <p className="text-[11px] text-surface-400 mt-1">Menunggu approval transfer bank</p>
        </div>
      </div>

      {/* AI Cluster Status & Pending Approvals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Cluster Status */}
        <div className="p-6 rounded-2xl bg-surface-900 border border-surface-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-white">Status AI Providers Engine</h3>
                <p className="text-xs text-surface-400">Arsitektur multimodal & failover resilience</p>
              </div>
              <Link
                href="/admin/ai-providers"
                className="text-xs font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1"
              >
                Konfigurasi <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {aiConfigs.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-xl bg-surface-950 border border-surface-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase">{c.provider_name}</h4>
                      <p className="text-[11px] text-surface-400">{c.model_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-brand-400">
                      Prioritas #{c.priority_order}
                    </span>
                    <span className="text-[10px] text-surface-500 block">
                      {c.tokens_used_this_month.toLocaleString()} token terpakai
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-surface-800 flex items-center justify-between text-xs text-surface-400">
            <span>Primary Engine: Google Gemini Flash</span>
            <span className="text-emerald-400 font-bold">Resilience 99.9%</span>
          </div>
        </div>

        {/* Pending Payments Widget */}
        <div className="p-6 rounded-2xl bg-surface-900 border border-surface-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-white">Antrean Konfirmasi Pembayaran</h3>
                <p className="text-xs text-surface-400">Transaksi yang memerlukan verifikasi manual admin</p>
              </div>
              <Link
                href="/admin/payments"
                className="text-xs font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1"
              >
                Semua Pembayaran <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {pendingPayments.length > 0 ? (
              <div className="space-y-3">
                {pendingPayments.map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-xl bg-surface-950 border border-amber-900/40 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white font-mono">{p.order_id}</span>
                        <span className="text-[10px] font-bold bg-amber-900/60 text-amber-300 px-1.5 py-0.5 rounded">
                          PENDING
                        </span>
                      </div>
                      <p className="text-[11px] text-surface-400 mt-0.5">
                        {p.user_name} • {p.bank_name || 'BCA'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-white block">
                        {formatRupiah(p.amount)}
                      </span>
                      <Link
                        href="/admin/payments"
                        className="text-[10px] font-bold text-brand-400 hover:underline"
                      >
                        Review Bukti Transfer
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-surface-500 text-xs">
                Tidak ada pembayaran pending saat ini. Semua mutasi telah berstatus settlement.
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-surface-800 flex items-center justify-between text-xs text-surface-400">
            <span>Metode: Midtrans QRIS / Snap & BCA Transfer</span>
          </div>
        </div>
      </div>

      {/* Audit Logs Preview */}
      <div className="p-6 rounded-2xl bg-surface-900 border border-surface-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base text-white">Aktivitas Audit Log Platform</h3>
          <Link
            href="/admin/logs"
            className="text-xs font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1"
          >
            Lihat Log Lengkap <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-2">
          {auditLogs.slice(0, 4).map((a) => (
            <div
              key={a.id}
              className="p-3 rounded-xl bg-surface-950 border border-surface-800 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-brand-500" />
                <div>
                  <span className="font-bold text-white font-mono">{a.action}</span>
                  <span className="text-surface-400 ml-2">({a.target_resource})</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-surface-400 font-mono text-[11px]">
                <span>{a.ip_address}</span>
                <span>{new Date(a.created_at).toLocaleTimeString('id-ID')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
