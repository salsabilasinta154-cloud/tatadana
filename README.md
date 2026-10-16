# 🚀 TataDana — Smart Personal Finance & AI Telegram Bot SaaS FinTech Indonesia

Platform SaaS FinTech Indonesia modern dan terintegrasi penuh untuk pencatatan keuangan pribadi & UMKM secara instan via **Telegram Bot bertenaga AI multimodal (Google Gemini 1.5 Flash)** dengan failover cerdas ke **OpenAI GPT-4o-mini & DeepSeek V3**, multi-wallet balance reconciliation, OCR struk belanja kasir, dan pembayaran terintegrasi **Midtrans Sandbox (Snap/QRIS)**.

---

## 🌟 Arsitektur & Fitur Utama

1. **Framework & UI/UX:**
   - **Next.js 14 (App Router)** + **TypeScript** + **Tailwind CSS**.
   - Desain premium modern orange-putih (`#FF6B00` brand accent, `#FFF8F3` cream surface, Inter & Plus Jakarta Sans typography).
   - Responsive total (Desktop, Tablet, Mobile) dengan drawer navigasi dan komponen modal aksesibel.

2. **Dual-Method Auth & Verifikasi OTP:**
   - Email & Password standard login/register.
   - **In-App OTP Simulator Lokal**: Menguji alur registrasi dan verifikasi nomor HP 100% end-to-end tanpa biaya SMS gateway.
   - **Telegram Deep-Link OTP**: Menghubungkan akun Telegram fisik (`https://t.me/TataDanaBot?start=otp_489201`) ke profil user secara otomatis.

3. **Multimodal AI Financial Engine (Google Gemini 1.5 Flash Primary):**
   - **Parsing Teks Slang Rupiah:** Mendeteksi nominal gaul Indonesia (`15rb`, `15k`, `1.5jt`, `500k`, `25 ribu`), nama wallet (`bca`, `mandiri`, `gopay`, `cash`), dan kategori secara otomatis.
   - **Vision OCR Struk Kasir:** Mengekstrak struk belanja fisik (Alfamart, Indomaret, Superindo) menjadi daftar multi-item terperinci (nama barang, qty, harga satuan, subtotal, PPN).
   - **Voice Note (VN) Audio:** Mendeteksi transkripsi suara saat pengguna sedang berkendara.
   - **Failover Cluster:** Jika Gemini timeout/gagal, otomatis dialihkan ke OpenAI GPT-4o-mini -> DeepSeek V3 -> Offline Indonesian Rule Parser.

4. **Dual-Mode Telegram Bot Engine:**
   - **Official Webhook Endpoint (`/api/telegram/webhook`):** Idempotent dengan verifikasi `update_id`, memproses update resmi dari server Telegram bot.
   - **In-App Telegram Bot Simulator (`/dashboard/simulator`):** Antarmuka chat interaktif bergaya Telegram di dashboard untuk menguji bot secara real-time tanpa perlu tunneling (ngrok). Setiap transaksi yang diproses bot otomatis masuk ke daftar mutasi dan memotong/menambah saldo dompet pengguna!
   - Endpoint `/api/telegram/test-connection` untuk `getMe` dan `setWebhook`.

5. **Sistem Laporan & Ekspor Dokumen:**
   - Halaman `/dashboard/laporan` dengan filter periode, jenis transaksi, wallet, dan pagination.
   - Rincian struk belanja yang dapat di-expand (multi-item receipt breakdown).
   - **Ekspor Dokumen Riil:** Generator file **Excel (.xlsx)** multi-sheet dan **PDF resmi** via endpoint `/api/reports/export`.

6. **User Dashboard Komprehensif:**
   - `/dashboard`: 4 kartu statistik, Donut chart kategori (SVG murni), Bar chart 6 bulan, Trend line harian, checklist onboarding interaktif.
   - `/dashboard/transaksi`: CRUD mutasi (Pemasukan, Pengeluaran, Transfer antar wallet), search & filter, rincian struk kasir OCR.
   - `/dashboard/budget`: Anggaran bulanan per kategori, visual progress bar (<70% hijau, 70-90% kuning, >90% merah), dan banner peringatan otomatis saat mendekati limit.
   - `/dashboard/wallets`: Multi-wallet (BCA, Mandiri, GoPay, Cash Dompet, BRI), set default wallet, modal transfer saldo antar wallet.
   - `/dashboard/settings`: Tab profil, Tab integrasi bot Telegram (input token, test koneksi, set webhook), Tab pengingat harian (Daily reminder jam 20:00 WIB), Tab kategori custom.

7. **Superadmin Console (`/admin`):**
   - Overview platform, total user, total transaksi, rata-rata latency AI.
   - **Kelola AI Providers:** Switch mode *Single Provider* vs *Failover Chain*, ganti model target, dan uji latensi live.
   - **Kelola Pengguna & User Impersonation:** Admin dapat mengimpersonasi akun user untuk keperluan debugging & support langsung di dashboard.
   - **Approval Pembayaran:** Review mutasi Midtrans QRIS Sandbox dan verifikasi manual transfer bank dengan peninjau bukti transfer transfer dan tombol Approve/Reject.
   - **AI & Audit Logs:** Log detail telemetri (latensi ms, token count, failover recovery) dan audit trail keamanan platform.

8. **Landing Page 11 Sections (`/`):**
   - Navbar, Hero, Problem Aware Bullets, Solusi TataDana, Interactive Live Slang Preview, 3 Alternating Features, Testimonials (Verified marked), Pricing (Free, Starter Rp 49k/bln, Pro Rp 99k Lifetime), FAQ 7 Pertanyaan, Final CTA, dan Footer.

---

## 📁 Struktur Direktori

```
tatadana/
├── README.md
├── package.json
├── tsconfig.json
├── next.config.mjs
├── tailwind.config.ts
├── postcss.config.mjs
├── .env.example
├── .env.local
├── supabase/
│   └── migrations/
│       └── 01_initial_schema.sql     # Skema lengkap 12 tabel + RLS + Triggers + Seed
└── src/
    ├── app/
    │   ├── globals.css
    │   ├── layout.tsx
    │   ├── page.tsx                  # Landing Page (11 Sections)
    │   ├── auth/
    │   │   ├── login/page.tsx        # Login + OTP Simulator
    │   │   └── register/page.tsx     # Register + OTP Simulator
    │   ├── dashboard/
    │   │   ├── layout.tsx            # Dashboard Layout & Sidebar
    │   │   ├── page.tsx              # Ringkasan Overview & Charts
    │   │   ├── transaksi/page.tsx    # CRUD Transaksi & Filter
    │   │   ├── budget/page.tsx       # Smart Budget & Alert Limits
    │   │   ├── wallets/page.tsx      # Multi-Wallet & Transfer
    │   │   ├── laporan/page.tsx      # Laporan, Pagination & Ekspor
    │   │   ├── simulator/page.tsx    # In-App Telegram Simulator
    │   │   └── settings/page.tsx     # Settings, Bot Token & Kategori
    │   ├── admin/
    │   │   ├── layout.tsx            # Superadmin Console Layout
    │   │   ├── page.tsx              # Superadmin Overview
    │   │   ├── ai-providers/page.tsx # AI Providers & Failover Chain
    │   │   ├── users/page.tsx        # User Management & Impersonation
    │   │   ├── payments/page.tsx     # Midtrans & Transfer Approvals
    │   │   └── logs/page.tsx         # AI Telemetry & Audit Logs
    │   └── api/
    │       ├── ai/parse/route.ts
    │       ├── payment/
    │       │   ├── create-transaction/route.ts
    │       │   ├── manual-transfer/route.ts
    │       │   └── notification/route.ts
    │       ├── reports/export/route.ts
    │       └── telegram/
    │           ├── test-connection/route.ts
    │           └── webhook/route.ts
    ├── components/
    │   ├── admin/AdminSidebar.tsx
    │   ├── dashboard/
    │   │   ├── Charts.tsx            # SVG Donut, Bar & Trend Line Charts
    │   │   ├── Navbar.tsx
    │   │   ├── ReceiptBreakdownModal.tsx
    │   │   ├── Sidebar.tsx
    │   │   ├── StatCard.tsx
    │   │   └── TransactionModal.tsx
    │   ├── payment/MidtransModal.tsx
    │   ├── simulator/TelegramChatSimulator.tsx
    │   └── ui/
    │       ├── Badge.tsx
    │       ├── Button.tsx
    │       ├── Card.tsx
    │       └── Modal.tsx
    └── lib/
        ├── types.ts                  # TypeScript Interfaces
        ├── utils.ts                  # Rupiah & Date Formatters
        ├── ai/
        │   ├── deepseek.ts
        │   ├── gemini.ts             # Gemini 1.5 Flash Multimodal
        │   ├── openai.ts
        │   ├── router.ts             # Failover Cluster Orchestrator
        │   └── slang-parser.ts       # Indonesian Slang Nominal Parser
        ├── export/
        │   ├── excel-generator.ts    # SheetJS XLSX Generator
        │   └── pdf-generator.ts      # jsPDF Formatter
        ├── midtrans/snap.ts          # Midtrans Snap Sandbox Client
        ├── store/
        │   ├── mock-data.ts          # Seed Data Lengkap
        │   └── tatadana-store.ts     # Reactive Store + Balance Triggers
        └── supabase/
            ├── client.ts
            ├── middleware.ts
            └── server.ts
```

---

## 🛠️ Panduan Menjalankan Project

### 1. Instalasi Dependensi
```bash
cd C:\Users\salsa\.gemini\antigravity\scratch\tatadana
npm install
```

### 2. Konfigurasi Environment Variables
Salin file `.env.example` ke `.env.local` (sudah disediakan default sandbox):
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
TELEGRAM_BOT_TOKEN=7123456789:AAGxTataDanaDemoBotKeySecret987654321
GEMINI_API_KEY=AIzaSyTataDanaGeminiFlashKey
```

### 3. Migrasi Database Supabase (Live Supabase Setup)
Jalankan file SQL lengkap di **Supabase SQL Editor**:
1. Salin seluruh isi file [`supabase/schema.sql`](file:///C:/Users/salsa/.gemini/antigravity/scratch/tatadana/supabase/schema.sql).
2. Buka dashboard Supabase project Anda di [supabase.com](https://supabase.com).
3. Buka menu **SQL Editor** pada navigasi sidebar kiri -> Klik **New Query**.
4. Tempel (*paste*) seluruh kode SQL lalu klik tombol **Run** (Ctrl+Enter).
5. **Skema 100% Idempotent & Hardened:**
   - **12 Tabel Utama:** `profiles`, `wallets`, `categories`, `transactions`, `transaction_receipt_items`, `budgets`, `telegram_connections`, `ai_provider_configs`, `ai_logs`, `subscription_plans`, `audit_logs`, dan `payment_transactions`.
   - **Aturan Bisnis Otomatis:** Sinta Salsabila (`sinta.salsabila@tatadana.id`) otomatis menjadi Superadmin (`role: 'admin'`, `is_admin: true`, `approval_status: 'approved'`), akun baru berstatus `pending`, dan saldo awal seluruh dompet Rp 0.00.
   - **Row Level Security (RLS):** Policies aman di setiap tabel (hanya user approved yang bisa akses datanya; Superadmin memiliki akses penuh untuk audit, approval, dan konfigurasi AI/pembayaran). Dilengkapi proteksi anti-privilege escalation.
   - **Supabase Storage:** Otomatis mengonfigurasi bucket `receipts` (10MB, mime-type image/pdf) beserta RLS storage policies.
   - **Seed Data Siap Pakai:** 16 kategori standar Indonesia (makanan, transportasi, belanja, gaji, dll.), AI provider default (Google Gemini 1.5 Flash aktif, OpenAI, DeepSeek), dan subscription plans (Free, Starter Rp 49.000/bln, Pro Rp 99.000 Lifetime).

*Catatan: TataDana dirancang secara cerdas dengan sistem fallback reactive store (`tatadana-store.ts`) sehingga aplikasi dapat langsung diuji dan berfungsi penuh secara offline/lokal bahkan sebelum kredensial Supabase live diisi!*

### 4. Menjalankan Server Development
```bash
npm run dev
```
Buka browser di: `http://localhost:3000`

---

## ⚡ Alur Pengujian Fitur End-to-End

1. **Uji Coba Teks Slang di Landing Page:**
   - Kunjungi `http://localhost:3000`
   - Scroll ke bagian **"Coba Ketik Bahasa Gaul Finansial Sekarang"**
   - Ketik `kopi kenangan 28rb gopay` atau `gaji 15jt bca` -> Lihat nominal, kategori, dan wallet diekstrak instan.

2. **Uji Coba Registrasi & OTP Simulator:**
   - Klik **"Mulai Gratis"** -> `http://localhost:3000/auth/register`
   - Masukkan nama & email -> Lanjut ke verifikasi OTP
   - Banner simulator akan menampilkan kode OTP lokal (misal: `489201`)
   - Klik auto-fill & selesaikan pendaftaran -> Otomatis diarahkan ke Dashboard.

3. **Uji Coba Telegram Bot Simulator (`/dashboard/simulator`):**
   - Kirim pesan `nasi padang 35k bca` -> Bot merespons konfirmasi transaksi.
   - Klik tombol **"Foto Struk OCR"** -> Bot menganalisis struk kasir Alfamart dan membedah 6 item barang.
   - Klik tombol **"Voice Note (VN)"** -> Bot memproses rekaman suara.
   - Buka `/dashboard/transaksi` -> Seluruh transaksi dari bot simulator otomatis tercatat di mutasi dan saldo rekening BCA/GoPay otomatis terpotong!

4. **Uji Coba Ekspor Excel & PDF (`/dashboard/laporan`):**
   - Buka halaman Laporan -> Klik tombol **"Ekspor Excel (.xlsx)"** atau **"Ekspor PDF Resmi"** -> File laporan siap cetak akan terunduh ke komputer Anda.

5. **Uji Coba Checkout Midtrans & Approval Superadmin:**
   - Buka Landing Page atau klik tombol Upgrade -> Pilih Paket Pro Lifetime (Rp 99.000)
   - Pilih metode **Midtrans QRIS** untuk simulasi settlement langsung, atau **Transfer Rekening BCA** untuk mengirim bukti transfer.
   - Buka Superadmin Console di `http://localhost:3000/admin/payments` -> Klik **"Lihat Bukti"** lalu **"Approve"** -> Akun pengguna langsung di-upgrade ke Pro Lifetime!
