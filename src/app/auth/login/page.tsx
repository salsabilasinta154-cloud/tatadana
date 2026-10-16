'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Bot,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Mail,
  Phone,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { generateOtpCode } from '@/lib/utils';
import { useTataDana } from '@/lib/store/tatadana-store';

export default function LoginPage() {
  const router = useRouter();
  const { loginUser } = useTataDana();

  const [authMethod, setAuthMethod] = useState<'password' | 'otp'>('password');
  const [email, setEmail] = useState('sinta.salsabila@tatadana.id');
  const [password, setPassword] = useState('••••••••••••');
  const [phoneNumber, setPhoneNumber] = useState('081234567890');
  const [otpCode, setOtpCode] = useState('');
  const [simulatedSentOtp, setSimulatedSentOtp] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSendSimulatedOtp = () => {
    const code = generateOtpCode();
    setSimulatedSentOtp(code);
    setErrorMsg('');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    if (authMethod === 'otp') {
      if (!simulatedSentOtp || otpCode !== simulatedSentOtp) {
        setErrorMsg('Kode OTP tidak sesuai. Pastikan memasukkan kode dari simulasi di atas.');
        setIsLoading(false);
        return;
      }
    }

    const target = authMethod === 'password' ? email : phoneNumber;
    const res = loginUser(target);

    setTimeout(() => {
      setIsLoading(false);
      if (res.success) {
        if (
          res.user &&
          (('role' in res.user && res.user.role === 'admin') ||
            ('is_admin' in res.user && res.user.is_admin))
        ) {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      } else {
        if (res.reason === 'pending') {
          setErrorMsg(
            `🔒 Akun "${res.user?.full_name || target}" belum disetujui oleh Admin Sinta Salsabila. Anda baru dapat masuk setelah akun di-approve oleh admin.`
          );
        } else if (res.reason === 'rejected') {
          setErrorMsg(
            `⛔ Akun "${res.user?.full_name || target}" telah ditolak oleh Admin Sinta Salsabila.`
          );
        } else {
          setErrorMsg(
            `Akun "${target}" tidak terdaftar. Silakan mendaftar terlebih dahulu.`
          );
        }
      }
    }, 600);
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white">
      {/* Left Column: Brand Hero */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-brand-600 via-brand-500 to-orange-600 text-white relative overflow-hidden">
        {/* Glow decorative shapes */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-black/10 blur-3xl pointer-events-none" />

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
            <Sparkles className="w-3.5 h-3.5" /> Next-Gen FinTech SaaS
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
            Catat Keuangan Harian & UMKM Semudah Chatting di Telegram.
          </h1>
          <p className="text-brand-100 text-sm leading-relaxed">
            Didukung mesin AI multimodal Google Gemini Flash untuk membaca teks slang nominal Indonesia, ekstraksi multi-item struk belanja, dan audio voice note secara instan.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle2 className="w-5 h-5 text-white/90 shrink-0" />
              <span>Parsing slang otomatis: 15rb, 1.5jt, 500k, gopay, bca</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle2 className="w-5 h-5 text-white/90 shrink-0" />
              <span>Multi-Wallet & rekonsiliasi saldo otomatis</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle2 className="w-5 h-5 text-white/90 shrink-0" />
              <span>Midtrans Sandbox QRIS & Manual Bank Transfer</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-brand-200 flex items-center justify-between">
          <span>© 2026 PT Tata Dana Digital Indonesia</span>
          <span className="flex items-center gap-1 font-semibold text-white">
            <ShieldCheck className="w-4 h-4" /> Enkripsi SSL 256-Bit
          </span>
        </div>
      </div>

      {/* Right Column: Form */}
      <div className="flex flex-col justify-between p-6 sm:p-12 lg:p-16 max-w-xl mx-auto w-full">
        <div>
          {/* Mobile Brand Link */}
          <div className="lg:hidden mb-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl brand-gradient text-white flex items-center justify-center font-bold">
                T
              </div>
              <span className="font-extrabold text-xl tracking-tight text-surface-900">
                Tata<span className="text-brand-600">Dana</span>
              </span>
            </Link>
          </div>

          <div className="space-y-2 mb-8">
            <h2 className="text-2xl font-black text-surface-900 tracking-tight">
              Masuk ke Dashboard
            </h2>
            <p className="text-xs text-surface-500">
              Pilih metode masuk dengan Email atau Gunakan In-App OTP Simulator tanpa biaya SMS.
            </p>
          </div>

          {/* Auth Method Selector */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-surface-100 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => { setAuthMethod('password'); setErrorMsg(''); }}
              className={`py-2 rounded-xl text-xs font-bold transition-all ${
                authMethod === 'password'
                  ? 'bg-white text-brand-700 shadow-2xs'
                  : 'text-surface-600 hover:text-surface-900'
              }`}
            >
              Email & Sandi
            </button>
            <button
              type="button"
              onClick={() => { setAuthMethod('otp'); setErrorMsg(''); }}
              className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                authMethod === 'otp'
                  ? 'bg-white text-brand-700 shadow-2xs'
                  : 'text-surface-600 hover:text-surface-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-brand-500" />
              OTP Simulator
            </button>
          </div>

          {/* Quick Demo Account Selector */}
          <div className="mb-6 p-3 rounded-2xl bg-surface-50 border border-surface-200 space-y-1.5">
            <span className="text-[11px] font-bold text-surface-600 uppercase tracking-wider block">
              Pilih Akun Demo untuk Pengujian:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('password');
                  setEmail('sinta.salsabila@tatadana.id');
                  setPhoneNumber('081234567890');
                  setErrorMsg('');
                }}
                className={`p-2 rounded-xl text-left border text-xs transition-all ${
                  email === 'sinta.salsabila@tatadana.id'
                    ? 'bg-brand-50 border-brand-400 text-brand-900 font-bold'
                    : 'bg-white border-surface-200 text-surface-700 hover:border-brand-200'
                }`}
              >
                <div className="font-bold flex items-center gap-1">👑 Sinta Salsabila</div>
                <div className="text-[10px] text-surface-500">Superadmin</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMethod('password');
                  setEmail('dian.lestari@perusahaan.co.id');
                  setPhoneNumber('0819-2233-4455');
                  setErrorMsg('');
                }}
                className={`p-2 rounded-xl text-left border text-xs transition-all ${
                  email === 'dian.lestari@perusahaan.co.id'
                    ? 'bg-brand-50 border-brand-400 text-brand-900 font-bold'
                    : 'bg-white border-surface-200 text-surface-700 hover:border-brand-200'
                }`}
              >
                <div className="font-bold">👤 Dian Paramita</div>
                <div className="text-[10px] text-emerald-600 font-semibold">User Disetujui</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMethod('password');
                  setEmail('budi.raharjo@yahoo.com');
                  setPhoneNumber('0821-4455-6677');
                  setErrorMsg('');
                }}
                className={`p-2 rounded-xl text-left border text-xs transition-all ${
                  email === 'budi.raharjo@yahoo.com'
                    ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold'
                    : 'bg-white border-surface-200 text-surface-700 hover:border-amber-200'
                }`}
              >
                <div className="font-bold">⏳ Budi Raharjo</div>
                <div className="text-[10px] text-amber-600 font-semibold">Pending Approval</div>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {authMethod === 'password' ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-surface-700 mb-1">
                    Email Pengguna
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-surface-700">
                      Kata Sandi
                    </label>
                    <a href="#" className="text-[11px] font-semibold text-brand-600 hover:underline">
                      Lupa sandi?
                    </a>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-semibold text-surface-700 mb-1">
                    Nomor WhatsApp / HP
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleSendSimulatedOtp}
                      className="shrink-0 text-xs"
                    >
                      Kirim OTP
                    </Button>
                  </div>
                </div>

                {/* Simulated OTP Notification Banner */}
                {simulatedSentOtp && (
                  <div className="p-3.5 rounded-2xl bg-brand-50 border border-brand-300 text-brand-900 text-xs space-y-1 animate-in fade-in duration-200">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Zap className="w-4 h-4 text-brand-600" />
                      <span>[Simulator OTP Lokal Aktif]</span>
                    </div>
                    <p className="text-[11px] text-brand-800">
                      Kode Verifikasi Anda: <strong className="font-mono text-sm tracking-widest text-brand-950 bg-white px-2 py-0.5 rounded border border-brand-300">{simulatedSentOtp}</strong>
                    </p>
                    <button
                      type="button"
                      onClick={() => setOtpCode(simulatedSentOtp)}
                      className="text-[11px] font-bold text-brand-700 underline mt-1 block"
                    >
                      Klik untuk isi otomatis
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-surface-700 mb-1">
                    Masukkan 6-Digit Kode OTP
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Contoh: 489201"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-surface-200 text-center text-lg font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </>
            )}

            {errorMsg && (
              <p className="text-xs text-red-600 font-semibold">{errorMsg}</p>
            )}

            <Button type="submit" isLoading={isLoading} className="w-full shadow-brand-glow">
              <span>Masuk Sekarang</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>

          {/* Telegram Deep-Link alternative */}
          <div className="mt-6 pt-6 border-t border-surface-100 text-center">
            <Link
              href="/dashboard/simulator"
              className="inline-flex items-center gap-2 text-xs font-bold text-brand-600 hover:text-brand-700 p-2 rounded-xl hover:bg-brand-50 transition-colors"
            >
              <Bot className="w-4 h-4" />
              <span>Verifikasi Langsung Lewat Telegram Bot</span>
            </Link>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-surface-500">
          Belum punya akun TataDana?{' '}
          <Link href="/auth/register" className="font-bold text-brand-600 hover:underline">
            Daftar Gratis di sini
          </Link>
        </div>
      </div>
    </div>
  );
}
