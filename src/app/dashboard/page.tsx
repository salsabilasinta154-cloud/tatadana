'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowRight,
  Bot,
  CheckCircle2,
  Circle,
  ExternalLink,
  Receipt,
  Sparkles,
} from 'lucide-react';
import { useTataDana } from '@/lib/store/tatadana-store';
import { StatCard } from '@/components/dashboard/StatCard';
import {
  CategoryPieChart,
  MonthlyBarChart,
  DailyTrendLineChart,
} from '@/components/dashboard/Charts';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatRupiah, formatDateIndo } from '@/lib/utils';
import { ReceiptBreakdownModal } from '@/components/dashboard/ReceiptBreakdownModal';
import { Transaction } from '@/lib/types';

export default function DashboardOverviewPage() {
  const { profile, wallets, transactions, categories, budgets, telegramConnection } =
    useTataDana();

  const [selectedReceiptTx, setSelectedReceiptTx] = useState<Transaction | null>(null);

  // 1. Metric Calculations
  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const currentMonthTransactions = transactions.filter((tx) => {
    const d = new Date(tx.transaction_date);
    return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
  });

  const incomeThisMonth = currentMonthTransactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const expenseThisMonth = currentMonthTransactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalMonthlyBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const remainingBudget = Math.max(0, totalMonthlyBudget - expenseThisMonth);

  // 2. Prepare Data for Charts
  // Category Pie Chart data
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const catExpenses: Record<string, number> = {};

  currentMonthTransactions
    .filter((tx) => tx.type === 'expense' && tx.category_id)
    .forEach((tx) => {
      catExpenses[tx.category_id!] = (catExpenses[tx.category_id!] || 0) + tx.amount;
    });

  const pieData = Object.entries(catExpenses).map(([catId, amt]) => {
    const cat = categoryMap.get(catId);
    return {
      name: cat?.name || 'Lain-lain',
      amount: amt,
      color: cat?.color || '#FF6B00',
    };
  });

  // 6 Months Cashflow dynamically computed (starts from 0 rupiah)
  const monthNames = ['Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt'];
  const monthlyCashflowData = monthNames.map((month, idx) => {
    // Current month is index 5
    if (idx === 5) {
      return { month, income: incomeThisMonth, expense: expenseThisMonth };
    }
    // Previous months: filter from transactions if any exist
    const txForMonth = transactions.filter((tx) => {
      const d = new Date(tx.transaction_date);
      return d.getMonth() + 1 === idx + 5;
    });
    return {
      month,
      income: txForMonth.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expense: txForMonth.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    };
  });

  // Daily Trend Line Data dynamically computed from real expense transactions
  const dailyMap: Record<number, number> = {};
  currentMonthTransactions
    .filter((tx) => tx.type === 'expense')
    .forEach((tx) => {
      const day = new Date(tx.transaction_date).getDate();
      dailyMap[day] = (dailyMap[day] || 0) + tx.amount;
    });

  const dailyPoints =
    Object.keys(dailyMap).length > 0
      ? Object.entries(dailyMap)
          .map(([day, amount]) => ({ day: Number(day), amount }))
          .sort((a, b) => a.day - b.day)
      : [
          { day: 1, amount: 0 },
          { day: 5, amount: 0 },
          { day: 10, amount: 0 },
          { day: 15, amount: 0 },
          { day: 20, amount: 0 },
          { day: 25, amount: 0 },
          { day: 30, amount: 0 },
        ];

  // Onboarding Checklist
  const checklist = [
    {
      id: 'tg',
      title: 'Hubungkan Akun Telegram Bot',
      desc: 'Mulai catat keuangan semudah chat santai',
      isCompleted: telegramConnection.is_verified,
      link: '/dashboard/simulator',
    },
    {
      id: 'wal',
      title: 'Atur Rekening & Dompet',
      desc: `${wallets.length} wallet aktif terhubung`,
      isCompleted: wallets.length >= 2,
      link: '/dashboard/wallets',
    },
    {
      id: 'bud',
      title: 'Tentukan Target Budget Kategori',
      desc: `${budgets.length} kategori telah memiliki limit`,
      isCompleted: budgets.length >= 3,
      link: '/dashboard/budget',
    },
    {
      id: 'tx',
      title: 'Catat Transaksi Perdana',
      desc: `${transactions.length} mutasi berhasil dicatat`,
      isCompleted: transactions.length > 0,
      link: '/dashboard/transaksi',
    },
  ];

  const completedCount = checklist.filter((c) => c.isCompleted).length;
  const progressPercent = Math.round((completedCount / checklist.length) * 100);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-brand-600 via-brand-500 to-orange-500 rounded-3xl p-6 sm:p-8 text-white shadow-brand-glow">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-100 flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5" /> Dashboard TataDana FinTech
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Selamat Datang, {profile.full_name.split(' ')[0]}! 👋
          </h1>
          <p className="text-sm text-brand-50 mt-1 max-w-xl">
            Arus kas Anda sehat. Bot Telegram siap menerima pencatatan via teks slang, struk belanja kasir, atau voice note.
          </p>
        </div>

        <Link
          href="/dashboard/simulator"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-brand-600 hover:bg-brand-50 font-bold text-sm shadow-md transition-all shrink-0 hover:scale-[1.02]"
        >
          <Bot className="w-4 h-4 text-brand-600" />
          <span>Buka Simulator Bot</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Saldo Terkonsolidasi"
          amount={totalBalance}
          icon={Wallet}
          color="brand"
          subtitle={`${wallets.length} Akun Dompet • Saldo Awal Rp 0`}
        />
        <StatCard
          title="Pemasukan Bulan Ini"
          amount={incomeThisMonth}
          icon={TrendingUp}
          color="green"
          trendPercentage={incomeThisMonth > 0 ? 12 : undefined}
          trendType="positive"
          subtitle={incomeThisMonth > 0 ? 'vs bulan lalu' : 'Mulai dari Rp 0'}
        />
        <StatCard
          title="Pengeluaran Bulan Ini"
          amount={expenseThisMonth}
          icon={TrendingDown}
          color="red"
          trendPercentage={expenseThisMonth > 0 ? -4 : undefined}
          trendType="positive"
          subtitle={expenseThisMonth > 0 ? 'efisiensi terkendali' : 'Mulai dari Rp 0'}
        />
        <StatCard
          title="Sisa Kuota Budget"
          amount={remainingBudget}
          icon={PiggyBank}
          color="blue"
          subtitle={totalMonthlyBudget > 0 ? `dari total ${formatRupiah(totalMonthlyBudget)}` : 'Mulai dari Rp 0'}
        />
      </div>

      {/* Onboarding Checklist Card */}
      <Card className="p-6 bg-gradient-to-br from-white to-brand-50/40 border-brand-200/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="font-extrabold text-base text-surface-900 flex items-center gap-2">
              <span>Langkah Memulai TataDana</span>
              <span className="text-xs bg-brand-100 text-brand-800 font-bold px-2 py-0.5 rounded-full">
                {progressPercent}% Siap
              </span>
            </h3>
            <p className="text-xs text-surface-500 mt-0.5">
              Selesaikan checklist agar fitur AI Bot dan mutasi dompet berjalan maksimal.
            </p>
          </div>
          <div className="w-44 bg-surface-200 h-2 rounded-full overflow-hidden shrink-0">
            <div
              className="bg-brand-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {checklist.map((item) => (
            <Link
              key={item.id}
              href={item.link}
              className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                item.isCompleted
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                  : 'bg-white border-surface-200 hover:border-brand-300 text-surface-800'
              }`}
            >
              {item.isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <Circle className="w-5 h-5 text-surface-400 shrink-0 mt-0.5" />
              )}
              <div className="min-w-0">
                <h4 className="text-xs font-bold truncate">{item.title}</h4>
                <p className="text-[11px] text-surface-500 truncate mt-0.5">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <CategoryPieChart data={pieData} />
        </div>
        <div className="lg:col-span-2">
          <MonthlyBarChart data={monthlyCashflowData} />
        </div>
      </div>

      {/* Daily Trend Line */}
      <DailyTrendLineChart data={dailyPoints} />

      {/* Recent Transactions Table */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Transaksi Terkini</CardTitle>
            <p className="text-xs text-surface-500 mt-0.5">Mutasi keuangan terbaru Anda</p>
          </div>
          <Link
            href="/dashboard/transaksi"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            Lihat Semua Transaksi <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-surface-50 text-surface-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Deskripsi</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Wallet</th>
                <th className="py-3 px-4">Sumber</th>
                <th className="py-3 px-4 text-right">Nominal</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-surface-500">
                    <Receipt className="w-8 h-8 text-surface-300 mx-auto mb-2 opacity-60" />
                    <p className="font-bold text-surface-700 text-sm">Belum Ada Transaksi Tercatat</p>
                    <p className="text-xs text-surface-400 mt-1 max-w-sm mx-auto">
                      Dashboard awal Anda dimulai dari <strong>Rp 0</strong>. Saldo dompet akan otomatis terupdate saat Anda mencatat mutasi melalui Telegram Bot atau tombol &apos;Catat Transaksi&apos;.
                    </p>
                  </td>
                </tr>
              ) : (
                transactions.slice(0, 5).map((tx) => {
                const cat = categories.find((c) => c.id === tx.category_id);
                const wal = wallets.find((w) => w.id === tx.wallet_id);

                return (
                  <tr key={tx.id} className="hover:bg-surface-50/70 transition-colors">
                    <td className="py-3 px-4 font-medium text-surface-700 whitespace-nowrap">
                      {formatDateIndo(tx.transaction_date)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-surface-900">{tx.description}</div>
                      {tx.notes && (
                        <div className="text-[11px] text-surface-500 truncate max-w-xs">
                          {tx.notes}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {cat ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-surface-100 text-surface-700 font-medium">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          {cat.name}
                        </span>
                      ) : (
                        <span className="text-surface-400">Transfer</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-surface-800">
                        {wal?.name || 'Wallet'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {tx.source === 'telegram_text' && (
                        <Badge variant="orange" size="sm">
                          Bot Slang
                        </Badge>
                      )}
                      {tx.source === 'telegram_receipt' && (
                        <Badge variant="purple" size="sm">
                          Struk OCR
                        </Badge>
                      )}
                      {tx.source === 'telegram_voice' && (
                        <Badge variant="blue" size="sm">
                          Voice Note
                        </Badge>
                      )}
                      {tx.source === 'manual' && (
                        <Badge variant="gray" size="sm">
                          Manual
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-black whitespace-nowrap">
                      {tx.type === 'expense' && (
                        <span className="text-red-600">-{formatRupiah(tx.amount)}</span>
                      )}
                      {tx.type === 'income' && (
                        <span className="text-emerald-600">+{formatRupiah(tx.amount)}</span>
                      )}
                      {tx.type === 'transfer' && (
                        <span className="text-blue-600">{formatRupiah(tx.amount)}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {tx.receipt_items && tx.receipt_items.length > 0 ? (
                        <button
                          onClick={() => setSelectedReceiptTx(tx)}
                          className="px-2.5 py-1 rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 font-bold transition-colors inline-flex items-center gap-1"
                          title="Lihat Detail Item Struk"
                        >
                          <Receipt className="w-3 h-3" />
                          <span>Rincian</span>
                        </button>
                      ) : (
                        <span className="text-surface-300">-</span>
                      )}
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Receipt Breakdown Modal */}
      <ReceiptBreakdownModal
        transaction={selectedReceiptTx}
        isOpen={Boolean(selectedReceiptTx)}
        onClose={() => setSelectedReceiptTx(null)}
      />
    </div>
  );
}
