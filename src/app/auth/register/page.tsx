'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  Zap,
  Bot,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { generateOtpCode } from '@/lib/utils';
import { useTataDana } from '@/lib/store/tatadana-store';

export default function RegisterPage() {
  const router = useRouter();
  const { registerUser, loginUser } = useTataDana();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [simulatedSentOtp, setSimulatedSentOtp] = useState<string | null>(null);
  const [step, setStep] = useState<'info' | 'otp' | 'pending_approval'>('info');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) {
      setErrorMsg('Mohon lengkapi seluruh field formulir.');
      return;
    }
    setErrorMsg('');
    const code = generateOtpCode();
    setSimulatedSentOtp(code);
    setStep('otp');
  };

  const handleVerifyRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulatedSentOtp || otpCode !== simulatedSentOtp) {
      setErrorMsg('Kode OTP tidak sesuai dengan simulasi verifikasi.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const newUser = registerUser({
        full_name: fullName,
        email,
        phone,
      });
      setIsLoading(false);
      // Setiap akun baru yang masuk wajib menunggu persetujuan dari Admin Sinta Salsabila
      setStep('pending_approval');
    }, 600);
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white">
      {/* Left Hero */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-brand-600 via-brand-500 to-orange-600 text-white relative overflow-hidden">
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white text-brand-600 flex items-center justify-center font-black text-xl shadow-md">
              T
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-white">
              Tata<span className="text-brand-200">Dana</span>
            </span>
          </Link>
        </div>

        <div className="relative z-10 my-auto space-y-6 max-w-lg">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-white">
            <Sparkles className="w-3.5 h-3.5" /> Registrasi 100% Gratis
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
            Mulai Kendalikan Arus Finansial Anda dalam 2 Menit.
          </h1>
          <p className="text-brand-100 text-sm leading-relaxed">
            Dapatkan akses penuh ke Bot Telegram bertenaga AI Gemini Flash. Cukup chat santai untuk mencatat segala pengeluaran tanpa buka aplikasi repot.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle2 className="w-5 h-5 text-white/90 shrink-0" />
              <span>Gratis 30 transaksi AI bot setiap bulan</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle2 className="w-5 h-5 text-white/90 shrink-0" />
              <span>Multi-Wallet (BCA, Mandiri, GoPay, Tunai)</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle2 className="w-5 h-5 text-white/90 shrink-0" />
              <span>Ekspor laporan lengkap ke Excel & PDF</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-brand-200 flex items-center justify-between">
          <span>Keamanan Data Finansial Terjamin</span>
          <span className="flex items-center gap-1 font-semibold text-white">
            <ShieldCheck className="w-4 h-4" /> ISO/IEC Standar SaaS
          </span>
        </div>
      </div>

      {/* Right Column */}
      <div className="flex flex-col justify-between p-6 sm:p-12 lg:p-16 max-w-xl mx-auto w-full">
        <div>
          <div className="space-y-2 mb-8">
            <h2 className="text-2xl font-black text-surface-900 tracking-tight">
              Buat Akun TataDana Baru
            </h2>
            <p className="text-xs text-surface-500">
              Registrasi cepat dengan Dual-Method: Verifikasi In-App OTP Simulator lokal tanpa biaya SMS.
            </p>
          </div>

          {step === 'info' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-surface-700 mb-1">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-700 mb-1">
                  Alamat Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                  <input
                    type="email"
                    required
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-700 mb-1">
                  Nomor WhatsApp / HP
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                  <input
                    type="tel"
                    required
                    placeholder="081234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-700 mb-1">
                  Kata Sandi
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                  <input
                    type="password"
                    required
                    placeholder="Minimal 8 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {errorMsg && (
                <p className="text-xs text-red-600 font-semibold">{errorMsg}</p>
              )}

              <Button type="submit" className="w-full shadow-brand-glow">
                <span>Lanjut ke Verifikasi OTP</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </form>
          ) : step === 'otp' ? (
            <form onSubmit={handleVerifyRegister} className="space-y-4">
              {/* Simulated OTP Notification Banner */}
              <div className="p-4 rounded-2xl bg-brand-50 border border-brand-300 text-brand-900 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Zap className="w-4 h-4 text-brand-600" />
                  <span>[Simulator OTP Lokal Aktif]</span>
                </div>
                <p className="text-xs text-brand-800">
                  Kode Verifikasi OTP Anda:{' '}
                  <strong className="font-mono text-base tracking-widest text-brand-950 bg-white px-2.5 py-0.5 rounded-md border border-brand-300">
                    {simulatedSentOtp}
                  </strong>
                </p>
                <button
                  type="button"
                  onClick={() => setOtpCode(simulatedSentOtp || '')}
                  className="text-xs font-bold text-brand-700 underline mt-1.5 block"
                >
                  Klik untuk otomatis mengisi kode
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-700 mb-1">
                  Masukkan 6-Digit Kode OTP
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="Contoh: 489201"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-surface-200 text-center text-xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {errorMsg && (
                <p className="text-xs text-red-600 font-semibold">{errorMsg}</p>
              )}

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('info')}
                  className="w-1/3"
                >
                  Kembali
                </Button>
                <Button type="submit" isLoading={isLoading} className="w-2/3 shadow-brand-glow">
                  Selesaikan Pendaftaran
                </Button>
              </div>
            </form>
          ) : (
            /* Pending Approval by Admin Sinta Salsabila */
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="p-5 rounded-3xl bg-amber-50/80 border border-amber-300 text-amber-950 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                    Menunggu Approval Admin Sinta Salsabila
                  </span>
                </div>
                <h3 className="text-lg font-black text-surface-900 tracking-tight">
                  Pendaftaran Berhasil! Akun Anda Memerlukan Persetujuan.
                </h3>
                <p className="text-xs text-surface-600 leading-relaxed">
                  Halo <strong>{fullName}</strong>, data pendaftaran Anda telah berhasil dicatat. Sesuai ketentuan platform TataDana, semua akun baru (selain Admin) harus <strong>diapprove terlebih dahulu oleh Admin Sinta Salsabila</strong> sebelum Anda dapat masuk ke Dashboard.
                </p>

                <div className="p-3.5 rounded-2xl bg-white/90 border border-amber-200 text-xs space-y-1.5 font-mono">
                  <div className="flex justify-between text-surface-700">
                    <span className="text-surface-500">Nama:</span>
                    <span className="font-bold">{fullName}</span>
                  </div>
                  <div className="flex justify-between text-surface-700">
                    <span className="text-surface-500">Email:</span>
                    <span>{email}</span>
                  </div>
                  <div className="flex justify-between text-surface-700">
                    <span className="text-surface-500">No HP:</span>
                    <span>{phone}</span>
                  </div>
                  <div className="flex justify-between text-amber-700 pt-1 border-t border-amber-100">
                    <span>Status Akun:</span>
                    <span className="font-bold">PENDING APPROVAL</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <Button
                  onClick={() => router.push('/auth/login')}
                  className="w-full shadow-brand-glow"
                >
                  <span>Ke Halaman Masuk (Login)</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    loginUser('sinta.salsabila@tatadana.id');
                    router.push('/admin/approvals');
                  }}
                  className="w-full py-2.5 px-3 rounded-xl border border-brand-300 bg-brand-50 hover:bg-brand-100 text-brand-800 text-xs font-bold transition-all text-center"
                >
                  👑 Masuk sebagai Admin Sinta Salsabila untuk Approve
                </button>
              </div>
            </div>
          )}

          {/* Telegram Deep-Link alternative */}
          <div className="mt-6 pt-6 border-t border-surface-100 text-center">
            <Link
              href="/dashboard/simulator"
              className="inline-flex items-center gap-2 text-xs font-bold text-brand-600 hover:text-brand-700 p-2 rounded-xl hover:bg-brand-50 transition-colors"
            >
              <Bot className="w-4 h-4" />
              <span>Daftar & Hubungkan via Telegram Bot Deep-Link</span>
            </Link>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-surface-500">
          Sudah memiliki akun TataDana?{' '}
          <Link href="/auth/login" className="font-bold text-brand-600 hover:underline">
            Masuk di sini
          </Link>
        </div>
      </div>
    </div>
  );
}
