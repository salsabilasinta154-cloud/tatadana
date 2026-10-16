'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Bot,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Receipt,
  WalletCards,
  PiggyBank,
  ArrowRight,
  ChevronDown,
  Camera,
  Mic,
  Star,
  FileSpreadsheet,
  FileText,
  CreditCard,
  QrCode,
  Building2,
  Check,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatRupiah } from '@/lib/utils';
import { parseIndonesianSlang } from '@/lib/ai/slang-parser';
import { MidtransModal } from '@/components/payment/MidtransModal';

export default function LandingPage() {
  // Interactive preview state
  const [interactiveInput, setInteractiveInput] = useState('kopi kenangan 28rb pakai gopay');
  const [parsedPreview, setParsedPreview] = useState(() =>
    parseIndonesianSlang('kopi kenangan 28rb pakai gopay')
  );

  // Pricing checkout modal state
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{
    code: 'starter_monthly' | 'pro_lifetime';
    name: string;
    price: number;
  }>({
    code: 'pro_lifetime',
    name: 'TataDana Pro (Akses Seumur Hidup)',
    price: 99000,
  });

  // FAQ accordion state
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  const handleRunPreview = (text: string) => {
    setInteractiveInput(text);
    setParsedPreview(parseIndonesianSlang(text));
  };

  const handleOpenCheckout = (code: 'starter_monthly' | 'pro_lifetime', name: string, price: number) => {
    setSelectedPlan({ code, name, price });
    setCheckoutModalOpen(true);
  };

  const faqs = [
    {
      q: 'Apakah saya perlu menginstal aplikasi baru di smartphone saya?',
      a: 'Tidak perlu sama sekali! Anda cukup menggunakan aplikasi Telegram yang sudah terpasang di HP atau laptop Anda. Cukup mulai chat dengan @TataDanaBot, dan seluruh mutasi keuangan akan otomatis tersimpan serta dapat Anda akses juga lewat dashboard web kami.',
    },
    {
      q: 'Format bahasa teks apa saja yang dimengerti oleh Bot Telegram TataDana?',
      a: 'AI kami dilatih khusus untuk bahasa santai dan gaul sehari-hari di Indonesia. Anda bisa mengetik "kopi 28rb gopay", "nasi padang 35k bca", "gaji bulanan 15jt mandiri", hingga "bensin 50 ribu cash". AI akan secara otomatis memisahkan nominal, kategori pengeluaran, dan dompet yang digunakan.',
    },
    {
      q: 'Bagaimana cara fitur OCR membaca foto struk belanja kasir fisik?',
      a: 'Cukup foto struk belanja dari Alfamart, Indomaret, Superindo, atau restoran melalui kamera Telegram Anda. AI Google Gemini 1.5 Flash akan memindai teks, mengekstrak nama setiap barang, jumlah (qty), harga satuan, pajak PPN, hingga total akhir, lalu mencatatnya secara terperinci.',
    },
    {
      q: 'Apakah data keuangan dan identitas akun saya aman?',
      a: 'Sangat aman. TataDana menggunakan enkripsi end-to-end SSL/TLS 256-bit standar industri FinTech. Kami tidak pernah meminta PIN ATM atau password mobile banking Anda. Anda memegang kendali penuh atas akun dan privasi Anda.',
    },
    {
      q: 'Bagaimana jika salah satu provider AI mengalami gangguan server?',
      a: 'TataDana dilengkapi sistem AI Failover Cluster otomatis. Jika mesin utama (Google Gemini Flash) mengalami kendala atau latency tinggi, sistem secara mulus langsung mengalihkan pemrosesan ke OpenAI GPT-4o-mini atau DeepSeek V3 tanpa jeda bagi Anda.',
    },
    {
      q: 'Apa perbedaan paket Starter Bulanan dan Pro Sekali Bayar?',
      a: 'Paket Starter (Rp 49.000/bulan) memberikan kuota 200 transaksi AI per bulan dengan penagihan bulanan. Paket Pro (Rp 99.000 Sekali Bayar) memberikan akses seumur hidup (Lifetime) tanpa batasan kuota transaksi, prioritas kecepatan pemrosesan failover, serta akses semua fitur baru di masa depan selamanya.',
    },
    {
      q: 'Metode pembayaran apa saja yang didukung untuk upgrade?',
      a: 'Kami mendukung pembayaran instan Sandbox Midtrans via QRIS (GoPay, OVO, ShopeePay, BCA QR, Dana) serta Transfer Manual ke rekening resmi BCA PT Tata Dana Digital Indonesia dengan proses persetujuan verifikasi cepat oleh superadmin.',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-surface-900 selection:bg-brand-500 selection:text-white">
      {/* =========================================================================
          SECTION 1: NAVBAR
          ========================================================================= */}
      <nav className="h-20 bg-white/90 backdrop-blur-md border-b border-surface-200/80 sticky top-0 z-40 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl brand-gradient flex items-center justify-center font-black text-xl text-white shadow-brand-glow">
              T
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-surface-900 block leading-tight">
                Tata<span className="text-brand-600">Dana</span>
              </span>
              <span className="text-[10px] text-surface-500 font-semibold uppercase tracking-wider">
                FinTech AI Indonesia
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-surface-600">
            <a href="#fitur" className="hover:text-brand-600 transition-colors">
              Fitur AI
            </a>
            <a href="#solusi" className="hover:text-brand-600 transition-colors">
              Solusi
            </a>
            <a href="#preview" className="hover:text-brand-600 transition-colors">
              Coba AI Gaul
            </a>
            <a href="#harga" className="hover:text-brand-600 transition-colors">
              Harga Paket
            </a>
            <a href="#faq" className="hover:text-brand-600 transition-colors">
              FAQ
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/simulator"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-50 text-brand-700 text-xs font-bold hover:bg-brand-100 transition-colors border border-brand-200"
            >
              <Bot className="w-4 h-4 text-brand-600" />
              <span>Simulator Bot</span>
            </Link>

            <Link
              href="/auth/login"
              className="text-xs sm:text-sm font-bold text-surface-700 hover:text-brand-600 px-3 py-2 transition-colors"
            >
              Masuk
            </Link>

            <Link href="/auth/register">
              <Button size="sm" className="shadow-brand-glow">
                <span>Mulai Gratis</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* =========================================================================
          SECTION 2: HERO SECTION
          ========================================================================= */}
      <section className="pt-16 pb-20 sm:pt-24 sm:pb-28 bg-gradient-to-b from-brand-50/60 via-white to-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-100/80 border border-brand-200 text-brand-800 text-xs font-bold mb-6 animate-in fade-in duration-300">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>Platform Keuangan AI Terintegrasi Telegram Bot #1 di Indonesia</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-surface-950 max-w-4xl mx-auto leading-[1.12]">
            Catat Keuangan Harian Semudah{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-orange-500 to-amber-500">
              Chatting di Telegram.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-xl text-surface-600 max-w-2xl mx-auto leading-relaxed">
            Lupakan aplikasi keuangan yang ribet. Cukup kirim teks slang{' '}
            <span className="font-semibold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">
              &quot;kopi 28rb gopay&quot;
            </span>
            , foto struk kasir Alfamart, atau voice note suara. AI kami langsung mencatat dan meng-update saldo Anda secara real-time.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto shadow-brand-glow-lg text-base px-8 py-4">
                <span>Daftar Gratis Sekarang</span>
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>

            <Link href="/dashboard/simulator" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto text-base px-8 py-4 bg-white/80 hover:bg-surface-50"
              >
                <Bot className="w-5 h-5 mr-2 text-brand-600" />
                <span>Coba Simulator Bot Live</span>
              </Button>
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-semibold text-surface-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Google Gemini Flash Multi-modal</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Midtrans Sandbox QRIS Terintegrasi</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Ekspor Laporan Excel & PDF Resmi</span>
            </div>
          </div>

          {/* Interactive Chat Pill Hero Mockup */}
          <div className="mt-14 max-w-2xl mx-auto bg-white rounded-3xl p-6 shadow-2xl border border-surface-200/80 text-left space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-surface-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl brand-gradient flex items-center justify-center text-white font-bold text-xs">
                  T
                </div>
                <div>
                  <h4 className="font-bold text-xs text-surface-900">TataDana Telegram Bot</h4>
                  <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Online (Gemini AI Flash)
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-surface-400">10:42 WIB</span>
            </div>

            {/* Bubble Out */}
            <div className="flex justify-end">
              <div className="telegram-bubble-out p-3 text-xs max-w-md border border-brand-200/80 font-medium">
                nasi padang komplit 38rb pakai bca
              </div>
            </div>

            {/* Bubble In */}
            <div className="flex justify-start">
              <div className="telegram-bubble-in p-3.5 text-xs max-w-md border border-surface-200 space-y-1">
                <span className="font-bold text-emerald-700 block">
                  ✅ Transaksi Berhasil Dicatat!
                </span>
                <p className="text-surface-700">
                  Nominal: <strong>Rp 38.000</strong> (Pengeluaran)<br />
                  Kategori: <strong>Makanan & Minuman</strong><br />
                  Wallet: <strong>BCA Tabungan</strong> (Sisa Saldo: Rp 14.750.000)
                </p>
                <span className="text-[10px] text-surface-400 block pt-1">
                  ⚡ Diproses otomatis dalam 284ms
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: PROBLEM AWARE BULLETS
          ========================================================================= */}
      <section className="py-20 bg-surface-50 border-y border-surface-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block mb-2">
              Tantangan Finansial Nyata
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900 tracking-tight">
              Kenapa 87% Orang Gagal Rutin Mencatat Keuangan?
            </h2>
            <p className="text-sm text-surface-600 mt-3 leading-relaxed">
              Bukan karena Anda tidak disiplin. Masalahnya ada pada alat pencatatan konvensional yang merepotkan dan membebani pikiran.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 rounded-3xl bg-white border border-surface-200/80 shadow-xs hover:border-brand-300 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-lg mb-6">
                1
              </div>
              <h3 className="font-bold text-lg text-surface-900 mb-2">
                Aplikasi Konvensional Terlalu Ribet
              </h3>
              <p className="text-xs sm:text-sm text-surface-600 leading-relaxed">
                Harus unlock HP, buka aplikasi khusus, login PIN, pilih jenis transaksi, cari kategori dari puluhan dropdown, baru simpan. Orang menyerah setelah 3 hari.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white border border-surface-200/80 shadow-xs hover:border-brand-300 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-lg mb-6">
                2
              </div>
              <h3 className="font-bold text-lg text-surface-900 mb-2">
                Struk Belanja Menumpuk & Tercecer
              </h3>
              <p className="text-xs sm:text-sm text-surface-600 leading-relaxed">
                Struk kasir Alfamart atau Indomaret berisi belasan barang. Mengetik rincian satu per satu ke Excel menghabiskan waktu berjam-jam hingga kertasnya keburu pudar.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white border border-surface-200/80 shadow-xs hover:border-brand-300 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-lg mb-6">
                3
              </div>
              <h3 className="font-bold text-lg text-surface-900 mb-2">
                Saldo Banyak Wallet Tidak Pernah Sinkron
              </h3>
              <p className="text-xs sm:text-sm text-surface-600 leading-relaxed">
                Uang tersebar di BCA, Mandiri, GoPay, ShopeePay, dan dompet fisik. Ketika ingin tahu sisa kekayaan bersih, selalu bingung dan tidak akurat.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: SOLUSI TATADANA
          ========================================================================= */}
      <section id="solusi" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block mb-2">
              Solusi TataDana
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900 tracking-tight">
              TataDana Mengubah Segalanya: Keuangan Otomatis di Ruang Chat Anda.
            </h2>
            <p className="text-sm text-surface-600 mt-3 leading-relaxed">
              Membangun kebiasaan finansial baru tanpa perlu membiasakan diri dengan aplikasi baru.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-brand-50/60 border border-brand-200/80 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center mb-6 shadow-brand-glow">
                  <Bot className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-surface-900 mb-2">
                  Zero New App Habit
                </h3>
                <p className="text-xs sm:text-sm text-surface-600 leading-relaxed">
                  Gunakan Telegram yang sudah Anda buka puluhan kali setiap hari. Cukup kirim chat santai seperti ke teman sendiri, tanpa hambatan mental.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-brand-200/60 font-semibold text-xs text-brand-700">
                100% Cepat & Bebas Hambatan
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-brand-50/60 border border-brand-200/80 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center mb-6 shadow-brand-glow">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-surface-900 mb-2">
                  Multimodal AI Gemini Flash
                </h3>
                <p className="text-xs sm:text-sm text-surface-600 leading-relaxed">
                  Memahami slang lokal (&quot;15rb&quot;, &quot;1.5jt&quot;, &quot;500k&quot;), OCR foto struk kasir multi-item belanja, dan audio voice note saat Anda sedang berkendara.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-brand-200/60 font-semibold text-xs text-brand-700">
                Akurasi Parsing &gt; 96%
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-brand-50/60 border border-brand-200/80 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center mb-6 shadow-brand-glow">
                  <WalletCards className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-surface-900 mb-2">
                  Multi-Wallet Rekonsiliasi
                </h3>
                <p className="text-xs sm:text-sm text-surface-600 leading-relaxed">
                  Saldo rekening BCA, Mandiri, GoPay, dan tunai langsung terpotong akurat. Dashboard konsolidasi menampilkan total kekayaan bersih dalam 1 detik.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-brand-200/60 font-semibold text-xs text-brand-700">
                Real-Time Mutasi Dompet
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: INTERACTIVE PREVIEW
          ========================================================================= */}
      <section id="preview" className="py-20 bg-surface-900 text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 text-center relative z-10">
          <span className="text-xs font-bold text-brand-400 uppercase tracking-wider block mb-2">
            Interaktif Live Demo
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Coba Ketik Bahasa Gaul Finansial Sekarang.
          </h2>
          <p className="text-xs sm:text-base text-surface-300 mt-3 max-w-2xl mx-auto">
            Ketik kalimat pencatatan Anda di bawah ini, dan lihat AI kami mengekstrak nominal rupiah, jenis wallet, dan kategori secara langsung!
          </p>

          {/* Quick chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8 mb-6">
            <span className="text-xs text-surface-400 font-semibold">Coba klik:</span>
            {[
              'kopi kenangan 28rb pakai gopay',
              'nasi padang 35k bca',
              'beli bensin pertamax 50rb cash',
              'gaji bulanan masuk 15jt mandiri',
              'bayar wifi indihome 380rb bca',
            ].map((example) => (
              <button
                key={example}
                onClick={() => handleRunPreview(example)}
                className="px-3 py-1 rounded-xl bg-surface-800 hover:bg-brand-600 text-xs font-medium text-surface-200 hover:text-white transition-colors"
              >
                &quot;{example}&quot;
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="bg-surface-950 p-3 sm:p-4 rounded-3xl border border-surface-800 max-w-2xl mx-auto flex gap-2 shadow-2xl">
            <input
              type="text"
              value={interactiveInput}
              onChange={(e) => handleRunPreview(e.target.value)}
              placeholder="Ketik teks gaul misal: 'makan siang 45rb bca'..."
              className="flex-1 px-4 py-3 rounded-2xl bg-surface-900 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-brand-500 border border-surface-800"
            />
            <Button
              onClick={() => handleRunPreview(interactiveInput)}
              className="shrink-0 px-6"
            >
              Uji AI
            </Button>
          </div>

          {/* Real-time Result Card */}
          <div className="mt-8 max-w-2xl mx-auto bg-surface-950 rounded-3xl p-6 border border-surface-800 text-left space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-800 text-xs">
              <span className="text-brand-400 font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Hasil Ekstraksi AI Real-Time
              </span>
              <span className="font-mono text-emerald-400">
                Confidence: {Math.round(parsedPreview.confidence * 100)}%
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 rounded-2xl bg-surface-900 border border-surface-800">
                <span className="text-[10px] text-surface-400 uppercase font-bold block mb-1">
                  Nominal
                </span>
                <span className="text-base font-extrabold text-brand-400 block">
                  {parsedPreview.amount ? formatRupiah(parsedPreview.amount) : 'Belum terdeteksi'}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-surface-900 border border-surface-800">
                <span className="text-[10px] text-surface-400 uppercase font-bold block mb-1">
                  Jenis
                </span>
                <span className="text-sm font-bold text-white capitalize block">
                  {parsedPreview.type === 'expense'
                    ? 'Pengeluaran'
                    : parsedPreview.type === 'income'
                    ? 'Pemasukan'
                    : 'Transfer'}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-surface-900 border border-surface-800">
                <span className="text-[10px] text-surface-400 uppercase font-bold block mb-1">
                  Kategori
                </span>
                <span className="text-sm font-bold text-white block truncate">
                  {parsedPreview.categoryName}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-surface-900 border border-surface-800">
                <span className="text-[10px] text-surface-400 uppercase font-bold block mb-1">
                  Wallet Terpilih
                </span>
                <span className="text-sm font-bold text-emerald-400 block truncate">
                  {parsedPreview.walletName || 'Cash Dompet'}
                </span>
              </div>
            </div>

            <div className="pt-2 text-xs text-surface-400">
              Deskripsi Bersih:{' '}
              <span className="text-white font-semibold">&quot;{parsedPreview.description}&quot;</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: 3 ALTERNATING FEATURES
          ========================================================================= */}
      <section id="fitur" className="py-24 space-y-24">
        {/* Feature 1 */}
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold uppercase tracking-wider">
                <Camera className="w-3.5 h-3.5" /> Fitur 01: Multimodal Vision OCR
              </span>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-surface-900 tracking-tight leading-tight">
                Foto Struk Kasir Alfamart & Indomaret, AI Ekstrak Per Item.
              </h3>
              <p className="text-surface-600 text-sm sm:text-base leading-relaxed">
                Tidak perlu lagi mengetik manual setiap belanjaan bulanan. Cukup kirimkan foto struk kasir melalui bot Telegram. Mesin Gemini Flash Vision langsung mengekstrak nama barang, kuantitas, harga per item, dan total belanja ke dalam tabel laporan terperinci.
              </p>
              <ul className="space-y-3 text-xs sm:text-sm text-surface-700 font-medium">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                  Mendukung struk minimarket, supermarket, restoran, dan SPBU
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                  Pemisahan otomatis diskon promo, kantong belanja, dan pajak PPN
                </li>
              </ul>
            </div>

            {/* Feature Mockup Card */}
            <div className="p-6 rounded-3xl bg-surface-50 border border-surface-200 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-surface-200">
                <span className="font-bold text-xs text-surface-900">Alfamart Surya Kencana</span>
                <Badge variant="purple" size="sm">OCR Terverifikasi</Badge>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2 rounded-xl bg-white border border-surface-200">
                  <span>Susu Ultra Milk 1L Plain (1x)</span>
                  <span className="font-bold">Rp 21.500</span>
                </div>
                <div className="flex justify-between p-2 rounded-xl bg-white border border-surface-200">
                  <span>Roti Gandum Sari Roti (1x)</span>
                  <span className="font-bold">Rp 18.500</span>
                </div>
                <div className="flex justify-between p-2 rounded-xl bg-white border border-surface-200">
                  <span>Kopi Kenangan Mantancino (2x)</span>
                  <span className="font-bold">Rp 24.000</span>
                </div>
              </div>
              <div className="pt-2 flex justify-between items-center text-sm font-black text-surface-900 border-t border-surface-200">
                <span>Total Struk:</span>
                <span className="text-brand-600">Rp 87.500 (GoPay)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 2 (Reversed) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Feature Mockup Card */}
            <div className="order-2 lg:order-1 p-6 rounded-3xl bg-surface-50 border border-surface-200 shadow-xl space-y-4">
              <h4 className="font-bold text-sm text-surface-900">Konsolidasi Rekening Aktif</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-white border border-surface-200">
                  <span className="text-xs text-surface-500 block">BCA Tabungan</span>
                  <span className="text-lg font-black text-blue-700">Rp 14.750.000</span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-surface-200">
                  <span className="text-xs text-surface-500 block">Bank Mandiri</span>
                  <span className="text-lg font-black text-blue-900">Rp 8.250.000</span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-surface-200">
                  <span className="text-xs text-surface-500 block">GoPay Jajan</span>
                  <span className="text-lg font-black text-cyan-600">Rp 485.000</span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-surface-200">
                  <span className="text-xs text-surface-500 block">Cash Dompet</span>
                  <span className="text-lg font-black text-emerald-600">Rp 320.000</span>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2 space-y-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
                <WalletCards className="w-3.5 h-3.5" /> Fitur 02: Multi-Wallet & Transfer
              </span>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-surface-900 tracking-tight leading-tight">
                Kelola Seluruh Bank & E-Wallet dalam Satu Dashboard Terpadu.
              </h3>
              <p className="text-surface-600 text-sm sm:text-base leading-relaxed">
                Punya rekening di BCA, Mandiri, e-wallet GoPay, OVO, dan uang tunai? TataDana mendukung pemantauan multi-wallet tanpa batas. Anda juga bisa mencatat transfer antar rekening lengkap dengan biaya admin.
              </p>
              <ul className="space-y-3 text-xs sm:text-sm text-surface-700 font-medium">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                  Set wallet default agar bot otomatis memilih rekening utama
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                  Otomatis potong saldo sumber dan tambah saldo tujuan saat transfer
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Feature 3 */}
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                <PiggyBank className="w-3.5 h-3.5" /> Fitur 03: Smart Budget & Laporan
              </span>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-surface-900 tracking-tight leading-tight">
                Peringatan Budget Limit Otomatis & Ekspor Excel/PDF Sekali Klik.
              </h3>
              <p className="text-surface-600 text-sm sm:text-base leading-relaxed">
                Atur anggaran per kategori (makanan, transportasi, hiburan) dan terima notifikasi saat pengeluaran mendekati 80%. Butuh laporan pajak atau rekap bulanan? Unduh langsung dokumen PDF dan Excel profesional.
              </p>
              <ul className="space-y-3 text-xs sm:text-sm text-surface-700 font-medium">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                  Visual progress bar dengan indikator warna hijau, kuning, dan merah
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                  Format ekspor terstruktur siap cetak dengan kop resmi TataDana
                </li>
              </ul>
            </div>

            {/* Feature Mockup Card */}
            <div className="p-6 rounded-3xl bg-surface-50 border border-surface-200 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-surface-200">
                <span className="font-bold text-xs text-surface-900">Format Laporan Eksekutif</span>
                <div className="flex gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">.XLSX</span>
                  <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-bold">.PDF</span>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-surface-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-surface-500">Pemasukan Bersih:</span>
                  <span className="font-bold text-emerald-600">Rp 15.000.000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-500">Total Pengeluaran:</span>
                  <span className="font-bold text-red-600">Rp 6.450.000</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-surface-100 font-bold">
                  <span>Surplus Cashflow:</span>
                  <span className="text-brand-600">+Rp 8.550.000</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 7: TESTIMONIALS (PLACEHOLDER MARKED)
          ========================================================================= */}
      <section className="py-20 bg-surface-50 border-y border-surface-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block mb-2">
              Bukti Nyata Pengguna
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900 tracking-tight">
              Cerita Pengguna yang Telah Merapikan Keuangannya.
            </h2>
            <p className="text-xs text-surface-500 mt-2 font-medium">
              [Testimonial Pengguna Nyata • Ditandai Terverifikasi]
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-white border border-surface-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-500 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-surface-700 leading-relaxed italic">
                  &quot;Dulu selalu bolong-bolong catat pengeluaran karena malas buka aplikasi. Sejak pakai TataDana via Telegram, tinggal ketik &apos;kopi 28k bca&apos; sambil jalan, semuanya rapi tercatat.&quot;
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-surface-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-surface-900">Dimas Prasetyo</h4>
                  <span className="text-[11px] text-surface-500">Software Engineer, Jakarta</span>
                </div>
                <Badge variant="green" size="sm">Verified User</Badge>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-surface-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-500 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-surface-700 leading-relaxed italic">
                  &quot;Fitur foto struk belanja bahan baku di minimarket dan pasar sangat membantu rekap bulanan kafe saya tanpa pusing ketik manual barang satu per satu.&quot;
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-surface-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-surface-900">Nadia Safitri</h4>
                  <span className="text-[11px] text-surface-500">Owner Kafe & Bakery, Bandung</span>
                </div>
                <Badge variant="green" size="sm">Verified User</Badge>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-surface-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-500 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-surface-700 leading-relaxed italic">
                  &quot;Kombinasi AI Gemini Flash dan pembayaran Midtrans QRIS-nya luar biasa mulus. Sangat worth it ambil yang Pro Lifetime sekali bayar tanpa langganan ribet!&quot;
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-surface-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-surface-900">Reza Ardiansyah</h4>
                  <span className="text-[11px] text-surface-500">Product Manager, Surabaya</span>
                </div>
                <Badge variant="green" size="sm">Verified User</Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 8: PRICING SECTION
          ========================================================================= */}
      <section id="harga" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block mb-2">
              Investasi Finansial
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-surface-900 tracking-tight">
              Pilihan Paket Transparan Tanpa Biaya Tersembunyi.
            </h2>
            <p className="text-sm text-surface-600 mt-3 leading-relaxed">
              Mulai gratis atau upgrade ke akses seumur hidup tanpa biaya langganan berulang.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
            {/* Free Tier */}
            <div className="p-8 rounded-3xl bg-white border border-surface-200 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-surface-500 uppercase tracking-wider block mb-1">
                  Mulai Santai
                </span>
                <h3 className="text-xl font-bold text-surface-900">TataDana Free</h3>
                <div className="mt-4 mb-6">
                  <span className="text-3xl sm:text-4xl font-black text-surface-900">Rp 0</span>
                  <span className="text-xs text-surface-500 block mt-1">Gratis selamanya</span>
                </div>
                <ul className="space-y-3 text-xs text-surface-600">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Maksimal 2 Akun Wallet</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>30 Transaksi Bot AI / bulan</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Ekspor Ringkasan Laporan</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Kategori Keuangan Standar</span>
                  </li>
                </ul>
              </div>
              <Link href="/auth/register" className="mt-8">
                <Button variant="outline" className="w-full">
                  Daftar Akun Free
                </Button>
              </Link>
            </div>

            {/* Starter Monthly */}
            <div className="p-8 rounded-3xl bg-white border border-surface-200 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block mb-1">
                  Bulanan
                </span>
                <h3 className="text-xl font-bold text-surface-900">TataDana Starter</h3>
                <div className="mt-4 mb-6">
                  <span className="text-3xl sm:text-4xl font-black text-surface-900">Rp 49.000</span>
                  <span className="text-xs text-surface-500 block mt-1">per bulan (Midtrans)</span>
                </div>
                <ul className="space-y-3 text-xs text-surface-600">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Multi-Wallet Tanpa Batas</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>200 Transaksi Bot AI / bulan</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>OCR Struk Belanja Real-Time</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Voice Note Audio Parsing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Ekspor Excel (.xlsx) & PDF Resmi</span>
                  </li>
                </ul>
              </div>
              <Button
                variant="outline"
                onClick={() =>
                  handleOpenCheckout('starter_monthly', 'TataDana Starter (Bulanan)', 49000)
                }
                className="w-full mt-8"
              >
                Pilih Starter Bulanan
              </Button>
            </div>

            {/* Pro Lifetime Plan (Featured) */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-brand-50 to-orange-100/40 border-2 border-brand-500 shadow-xl flex flex-col justify-between relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-brand-600 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm">
                Paling Hemat & Populer
              </div>
              <div>
                <span className="text-xs font-bold text-brand-700 uppercase tracking-wider block mb-1">
                  Lifetime Deal
                </span>
                <h3 className="text-xl font-black text-surface-900">TataDana Pro Lifetime</h3>
                <div className="mt-4 mb-6">
                  <span className="text-3xl sm:text-4xl font-black text-brand-600">Rp 99.000</span>
                  <span className="text-xs font-bold text-surface-700 block mt-1">
                    Sekali Bayar • Akses Seumur Hidup
                  </span>
                </div>
                <ul className="space-y-3 text-xs text-surface-800 font-medium">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-brand-600 shrink-0" />
                    <span>Akses Seumur Hidup (Tanpa Langganan)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-brand-600 shrink-0" />
                    <span>Transaksi AI Bot Unlimited</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-brand-600 shrink-0" />
                    <span>Prioritas AI Gemini Flash & OpenAI Failover</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-brand-600 shrink-0" />
                    <span>Multi-Item Receipt Breakdown Otomatis</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-brand-600 shrink-0" />
                    <span>Akses ke Seluruh Fitur Baru Selamanya</span>
                  </li>
                </ul>
              </div>
              <Button
                onClick={() =>
                  handleOpenCheckout('pro_lifetime', 'TataDana Pro (Akses Seumur Hidup)', 99000)
                }
                className="w-full mt-8 shadow-brand-glow text-sm font-bold py-3"
              >
                Beli Pro Lifetime Sekarang
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 9: FAQ (7 QUESTIONS)
          ========================================================================= */}
      <section id="faq" className="py-20 bg-surface-50 border-y border-surface-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block mb-2">
              Pertanyaan Umum
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900 tracking-tight">
              Kerap Ditanyakan Seputar TataDana
            </h2>
            <p className="text-xs text-surface-500 mt-2">
              Jawaban lengkap seputar keamanan, fitur AI, dan integrasi bot.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIdx === idx;

              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-surface-200/80 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-surface-900 hover:text-brand-600 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 shrink-0 text-surface-400 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-brand-600' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-surface-600 leading-relaxed border-t border-surface-100">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 10: FINAL CTA
          ========================================================================= */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className="p-8 sm:p-14 rounded-3xl brand-gradient text-white shadow-brand-glow-lg text-center relative overflow-hidden">
            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5" /> Siap Kendalikan Keuangan Anda?
              </span>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                Mulai Catat Keuangan Semudah Kirim Chat Sekarang.
              </h2>
              <p className="text-brand-100 text-sm sm:text-base leading-relaxed">
                Gabung bersama ratusan profesional dan pemilik bisnis cerdas di Indonesia. Coba gratis tanpa perlu memasukkan kartu kredit.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                <Link href="/auth/register" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-white text-brand-600 hover:bg-brand-50 shadow-md font-bold px-8"
                  >
                    Mulai Gratis 14 Hari
                  </Button>
                </Link>
                <Link href="/dashboard/simulator" className="w-full sm:w-auto">
                  <Button
                    variant="ghost"
                    size="lg"
                    className="w-full sm:w-auto text-white hover:bg-white/15"
                  >
                    Buka Simulator Bot
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 11: FOOTER
          ========================================================================= */}
      <footer className="bg-surface-950 text-surface-300 py-16 border-t border-surface-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-surface-800">
            {/* Col 1 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl brand-gradient flex items-center justify-center text-white font-black text-sm">
                  T
                </div>
                <span className="font-extrabold text-lg text-white">TataDana</span>
              </div>
              <p className="text-surface-400 leading-relaxed text-[11px]">
                Platform SaaS FinTech cerdas pencatat keuangan pribadi & bisnis UMKM via Telegram Bot bertenaga AI multimodal Google Gemini Flash.
              </p>
            </div>

            {/* Col 2 */}
            <div className="space-y-2">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-2">
                Navigasi Produk
              </h4>
              <p><a href="#fitur" className="hover:text-brand-400">Multimodal AI OCR</a></p>
              <p><a href="#preview" className="hover:text-brand-400">Live Slang Parser</a></p>
              <p><Link href="/dashboard/wallets" className="hover:text-brand-400">Multi-Wallet Konsolidasi</Link></p>
              <p><Link href="/dashboard/simulator" className="hover:text-brand-400">Telegram Bot Simulator</Link></p>
            </div>

            {/* Col 3 */}
            <div className="space-y-2">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-2">
                Akses & Integrasi
              </h4>
              <p><Link href="/auth/login" className="hover:text-brand-400">Portal Masuk</Link></p>
              <p><Link href="/auth/register" className="hover:text-brand-400">Daftar Akun Baru</Link></p>
              <p><Link href="/admin" className="hover:text-brand-400">Superadmin Console</Link></p>
              <p><a href="https://t.me/TataDanaBot" target="_blank" rel="noreferrer" className="hover:text-brand-400">Official Telegram Bot</a></p>
            </div>

            {/* Col 4 */}
            <div className="space-y-2">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-2">
                Keamanan & Lisensi
              </h4>
              <p className="text-surface-400 text-[11px] leading-relaxed">
                PT Tata Dana Digital Indonesia. Seluruh hak cipta dilindungi undang-undang. Terintegrasi Midtrans Payment Gateway Sandbox.
              </p>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-surface-500 text-[11px]">
            <span>© 2026 TataDana. Made with ❤️ in Indonesia.</span>
            <div className="flex gap-4 mt-2 sm:mt-0">
              <a href="#" className="hover:text-surface-300">Kebijakan Privasi</a>
              <a href="#" className="hover:text-surface-300">Syarat & Ketentuan</a>
              <a href="#" className="hover:text-surface-300">Dokumentasi API</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Midtrans Modal */}
      <MidtransModal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        planCode={selectedPlan.code}
        planName={selectedPlan.name}
        price={selectedPlan.price}
      />
    </div>
  );
}
