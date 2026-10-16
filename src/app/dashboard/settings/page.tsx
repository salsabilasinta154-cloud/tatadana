'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTataDana } from '@/lib/store/tatadana-store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  User,
  Bot,
  Bell,
  Tags,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Plus,
  RefreshCw,
  Send,
  Upload,
  Trash2,
  Camera,
  Sparkles,
} from 'lucide-react';
import { CategoryType, SubscriptionTier } from '@/lib/types';
import { compressImageFile } from '@/lib/utils';
import { MidtransModal } from '@/components/payment/MidtransModal';

export default function SettingsPage() {
  const { profile, updateProfile, categories, addCategory, telegramConnection, setSubscriptionTier } =
    useTataDana();

  const [activeTab, setActiveTab] = useState<'profile' | 'telegram' | 'reminders' | 'categories'>('profile');

  // Profile form
  const [fullName, setFullName] = useState(profile.full_name);
  const [phone, setPhone] = useState(profile.phone || '');
  const [avatarPreview, setAvatarPreview] = useState<string>(profile.avatar_url || '');
  const [profileSaved, setProfileSaved] = useState(false);
  const [avatarSuccessMsg, setAvatarSuccessMsg] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upgrade Modal state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<{
    code: 'starter_monthly' | 'pro_lifetime';
    name: string;
    price: number;
  }>({
    code: 'pro_lifetime',
    name: 'TataDana Pro (Akses Seumur Hidup)',
    price: 99000,
  });

  useEffect(() => {
    setFullName(profile.full_name);
    setPhone(profile.phone || '');
  }, [profile.id]);

  useEffect(() => {
    setAvatarPreview(profile.avatar_url || '');
  }, [profile.avatar_url]);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Silakan pilih file gambar yang valid (JPG, PNG, WEBP, GIF).');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Ukuran file maksimal 10MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploadingAvatar(true);
    try {
      // Compress to lightweight 360x360 base64 string to keep localStorage ultra-light and fast
      const compressedBase64 = await compressImageFile(file, 360, 360, 0.82);
      setAvatarPreview(compressedBase64);
      // Instant save to store so it immediately updates in Sidebar & Navbar
      updateProfile({ avatar_url: compressedBase64 });
      setAvatarSuccessMsg('Foto profil dari perangkat pribadi berhasil diperbarui!');
      setProfileSaved(true);
      setTimeout(() => {
        setProfileSaved(false);
        setAvatarSuccessMsg(null);
      }, 3500);
    } catch (err: any) {
      alert(`Gagal memproses gambar: ${err.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    updateProfile({ avatar_url: '' });
    setAvatarSuccessMsg('Foto profil berhasil dihapus.');
    setProfileSaved(true);
    setTimeout(() => {
      setProfileSaved(false);
      setAvatarSuccessMsg(null);
    }, 3500);
  };

  // Telegram bot test form
  const [botToken, setBotToken] = useState('7123456789:AAGxTataDanaDemoBotKeySecret987654321');
  const [webhookUrl, setWebhookUrl] = useState('https://tatadana.id/api/telegram/webhook');
  const [isTestingBot, setIsTestingBot] = useState(false);
  const [botTestResult, setBotTestResult] = useState<any>(null);

  // Reminders form
  const [reminderTime, setReminderTime] = useState(profile.daily_reminder_time || '20:00');
  const [reminderEnabled, setReminderEnabled] = useState(profile.daily_reminder_enabled);
  const [budgetAlertEnabled, setBudgetAlertEnabled] = useState(profile.budget_alert_enabled);
  const [remindersSaved, setRemindersSaved] = useState(false);

  // Custom Category form
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState<CategoryType>('expense');
  const [catColor, setCatColor] = useState('#FF6B00');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ full_name: fullName, phone, avatar_url: avatarPreview });
    setAvatarSuccessMsg('Profil berhasil disimpan!');
    setProfileSaved(true);
    setTimeout(() => {
      setProfileSaved(false);
      setAvatarSuccessMsg(null);
    }, 3500);
  };

  const handleTestBotConnection = async (action: 'test' | 'set_webhook') => {
    setIsTestingBot(true);
    setBotTestResult(null);
    try {
      const res = await fetch('/api/telegram/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: botToken, action, webhook_url: webhookUrl }),
      });
      const data = await res.json();
      setBotTestResult(data);
    } catch (err: any) {
      setBotTestResult({ success: false, error: err.message });
    } finally {
      setIsTestingBot(false);
    }
  };

  const handleSaveReminders = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      daily_reminder_time: reminderTime,
      daily_reminder_enabled: reminderEnabled,
      budget_alert_enabled: budgetAlertEnabled,
    });
    setRemindersSaved(true);
    setTimeout(() => setRemindersSaved(false), 3000);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    addCategory({
      name: catName,
      type: catType,
      color: catColor,
      icon: 'tag',
      is_system: false,
    });

    setCatName('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-surface-900 tracking-tight">
          Pengaturan Akun & Sistem
        </h1>
        <p className="text-xs text-surface-500 mt-1">
          Kelola profil pengguna, konfigurasi Telegram Bot Webhook resmi, reminder notifikasi, dan kategori khusus.
        </p>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-surface-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'profile'
              ? 'bg-brand-600 text-white shadow-brand-glow'
              : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profil & Akun</span>
        </button>

        <button
          onClick={() => setActiveTab('telegram')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'telegram'
              ? 'bg-brand-600 text-white shadow-brand-glow'
              : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>Integrasi Bot Telegram</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
        </button>

        <button
          onClick={() => setActiveTab('reminders')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'reminders'
              ? 'bg-brand-600 text-white shadow-brand-glow'
              : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Pengingat & Alarm</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'categories'
              ? 'bg-brand-600 text-white shadow-brand-glow'
              : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'
          }`}
        >
          <Tags className="w-4 h-4" />
          <span>Kategori Custom</span>
        </button>
      </div>

      {/* Tab 1: Profile */}
      {activeTab === 'profile' && (
        <Card className="max-w-2xl">
          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarFileChange}
            />

            {/* Avatar & Photo Picker Section */}
            <div className="p-4 rounded-2xl bg-surface-50 border border-surface-200/80 space-y-3">
              <span className="text-xs font-bold text-surface-700 uppercase tracking-wider block">
                Foto Profil Pengguna
              </span>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Avatar Preview */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  title="Klik untuk memilih foto dari perangkat"
                  className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-brand-300 shadow-sm cursor-pointer group shrink-0 bg-brand-50 flex items-center justify-center transition-transform hover:scale-105"
                >
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt={fullName}
                      className="w-full h-full object-cover transition-opacity group-hover:opacity-80"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-black text-brand-700 text-2xl bg-gradient-to-br from-brand-100 to-orange-100">
                      {fullName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase() || 'U'}
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[11px] font-bold">
                    <Camera className="w-5 h-5 mb-0.5" />
                    <span>Ubah</span>
                  </div>
                </div>

                {/* Photo Actions & Info */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-white hover:bg-brand-50 border-brand-200 text-brand-700 font-bold"
                    >
                      <Upload className="w-4 h-4 mr-1.5 text-brand-600" />
                      Pilih Foto dari Perangkat
                    </Button>

                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={handleRemoveAvatar}
                      disabled={!avatarPreview}
                      className="text-xs"
                    >
                      <Trash2 className="w-4 h-4 mr-1.5" />
                      Hapus Foto
                    </Button>
                  </div>

                  <p className="text-[11px] text-surface-500 leading-relaxed">
                    Pilih file gambar (JPG, PNG, GIF, WEBP maks 5MB) dari penyimpanan komputer/HP Anda. Preview akan tampil seketika dan tersinkronisasi otomatis ke Sidebar dan Navbar.
                  </p>
                </div>
              </div>
            </div>

            {/* User Badges Card & Subscription Tier Section */}
            <div className="p-4 bg-brand-50/60 rounded-2xl border border-brand-100 text-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-surface-900 block text-sm">{fullName}</span>
                  <span className="text-surface-500 text-xs">{profile.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      profile.subscription_tier === 'pro'
                        ? 'orange'
                        : profile.subscription_tier === 'starter'
                        ? 'blue'
                        : 'gray'
                    }
                    size="sm"
                  >
                    PAKET {profile.subscription_tier.toUpperCase()}
                  </Badge>
                  {profile.is_admin && (
                    <Badge variant="purple" size="sm">
                      SUPERADMIN
                    </Badge>
                  )}
                </div>
              </div>

              {/* Upgrade Plan Callout & Live Purchase Simulation */}
              <div className="pt-2 border-t border-brand-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <p className="font-semibold text-brand-900 text-xs">
                    {profile.subscription_tier === 'pro'
                      ? 'Status: Akses Seumur Hidup (Lifetime) Aktif'
                      : profile.subscription_tier === 'starter'
                      ? 'Status: Paket Starter Bulanan (Rp 49.000/bln)'
                      : 'Status: Paket Gratis (Free Tier)'}
                  </p>
                  <p className="text-[11px] text-surface-500">
                    Beli atau upgrade paket dengan Midtrans QRIS atau Transfer Bank Manual.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setCheckoutPlan({
                        code: 'pro_lifetime',
                        name: 'TataDana Pro (Akses Seumur Hidup)',
                        price: 99000,
                      });
                      setIsCheckoutOpen(true);
                    }}
                    className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-brand-glow"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1" />
                    Beli Paket Pro (Rp99k)
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setCheckoutPlan({
                        code: 'starter_monthly',
                        name: 'TataDana Starter (Bulanan)',
                        price: 49000,
                      });
                      setIsCheckoutOpen(true);
                    }}
                    className="text-xs bg-white font-semibold"
                  >
                    Starter (Rp49k)
                  </Button>
                </div>
              </div>

              {/* Quick Tier Demo Switcher */}
              <div className="pt-2 border-t border-brand-200/40 flex items-center gap-2 text-[11px]">
                <span className="text-surface-500 font-medium">Uji Coba Ganti Tier Langsung:</span>
                {(['free', 'starter', 'pro'] as SubscriptionTier[]).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setSubscriptionTier(tier)}
                    className={`px-2 py-0.5 rounded-md font-bold uppercase transition-all ${
                      profile.subscription_tier === tier
                        ? 'bg-brand-600 text-white shadow-xs'
                        : 'bg-surface-200 text-surface-600 hover:bg-surface-300'
                    }`}
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-surface-600 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-600 mb-1">
                  Alamat Email (Akun Utama)
                </label>
                <input
                  type="email"
                  disabled
                  value={profile.email}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 text-sm bg-surface-100 text-surface-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-600 mb-1">
                  Nomor WhatsApp / Telepon
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {profileSaved && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{avatarSuccessMsg || 'Perubahan profil berhasil disimpan!'}</span>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button type="submit">Simpan Perubahan</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Tab 2: Telegram Bot Integration */}
      {activeTab === 'telegram' && (
        <div className="space-y-6 max-w-3xl">
          <Card className="space-y-4">
            <div>
              <h3 className="font-bold text-base text-surface-900">
                Pengaturan Telegram Bot Resmi
              </h3>
              <p className="text-xs text-surface-500 mt-1">
                Masukkan API Token bot dari @BotFather untuk mengaktifkan bot live production atau lakukan uji koneksi webhook.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-surface-600 mb-1">
                Bot Token (@BotFather)
              </label>
              <input
                type="text"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="7123456789:AAGxTataDana..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-surface-600 mb-1">
                Webhook URL Target
              </label>
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://tatadana.id/api/telegram/webhook"
                className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleTestBotConnection('test')}
                isLoading={isTestingBot}
              >
                <RefreshCw className="w-4 h-4 mr-1.5" />
                Test getMe (Koneksi Bot)
              </Button>

              <Button
                type="button"
                variant="primary"
                onClick={() => handleTestBotConnection('set_webhook')}
                isLoading={isTestingBot}
              >
                <Send className="w-4 h-4 mr-1.5" />
                Simpan & Set Webhook Resmi
              </Button>
            </div>

            {/* Test Results Output */}
            {botTestResult && (
              <div
                className={`p-4 rounded-2xl border text-xs font-mono mt-3 ${
                  botTestResult.success
                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900'
                    : 'bg-red-50/70 border-red-300 text-red-900'
                }`}
              >
                <div className="flex items-center gap-2 font-bold mb-1">
                  {botTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span>{botTestResult.message || botTestResult.error}</span>
                </div>
                {botTestResult.bot && (
                  <p className="mt-1 text-[11px] text-surface-700">
                    Bot Info: @{botTestResult.bot.username} (ID: {botTestResult.bot.id}) • Status Webhook: OK
                  </p>
                )}
              </div>
            )}
          </Card>

          {/* DeepLink OTP linking Card */}
          <Card className="p-6 bg-brand-50/60 border border-brand-200">
            <h4 className="font-bold text-sm text-brand-900 mb-1">
              Deep-Link OTP Telegram Verifikasi
            </h4>
            <p className="text-xs text-brand-800 leading-relaxed">
              Hubungkan akun Telegram fisik Anda tanpa repot. Buka link berikut di aplikasi Telegram Anda:
            </p>
            <div className="mt-3 flex items-center gap-2">
              <code className="text-xs px-3 py-2 rounded-xl bg-white border border-brand-300 font-mono text-brand-900 select-all">
                https://t.me/TataDanaBot?start=otp_489201
              </code>
              <a
                href="https://t.me/TataDanaBot?start=otp_489201"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 inline-flex items-center gap-1.5 shrink-0"
              >
                <span>Buka Telegram</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 3: Reminders */}
      {activeTab === 'reminders' && (
        <Card className="max-w-2xl">
          <form onSubmit={handleSaveReminders} className="space-y-4">
            <div>
              <h3 className="font-bold text-base text-surface-900">
                Pengingat & Notifikasi Harian
              </h3>
              <p className="text-xs text-surface-500 mt-1">
                TataDana akan mengingatkan Anda untuk merekap pengeluaran malam hari via Bot Telegram.
              </p>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-50 border border-surface-200">
              <div>
                <h4 className="font-bold text-xs text-surface-900">
                  Notifikasi Ringkasan Malam (Daily Reminder)
                </h4>
                <p className="text-[11px] text-surface-500">
                  Kirimkan pengingat jika belum ada transaksi dicatat hari ini.
                </p>
              </div>
              <input
                type="checkbox"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                className="w-4 h-4 accent-brand-600 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-surface-600 mb-1">
                Waktu Pengingat Harian (WIB)
              </label>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-50 border border-surface-200">
              <div>
                <h4 className="font-bold text-xs text-surface-900">
                  Peringatan Batas Anggaran (Budget Alert Trigger)
                </h4>
                <p className="text-[11px] text-surface-500">
                  Peringatkan otomatis saat pengeluaran kategori mencapai 80% dari batas bulanan.
                </p>
              </div>
              <input
                type="checkbox"
                checked={budgetAlertEnabled}
                onChange={(e) => setBudgetAlertEnabled(e.target.checked)}
                className="w-4 h-4 accent-brand-600 cursor-pointer"
              />
            </div>

            {remindersSaved && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Pengaturan pengingat berhasil disimpan!</span>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button type="submit">Simpan Pengingat</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Tab 4: Categories */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          <Card>
            <h3 className="font-bold text-base text-surface-900 mb-3">
              Tambah Kategori Khusus
            </h3>
            <form onSubmit={handleAddCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-surface-600 mb-1">
                  Nama Kategori
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Skincare, Freelance, Kopi"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-surface-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-surface-600 mb-1">
                    Jenis
                  </label>
                  <select
                    value={catType}
                    onChange={(e) => setCatType(e.target.value as CategoryType)}
                    className="w-full px-3 py-2 rounded-xl border border-surface-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  >
                    <option value="expense">Pengeluaran</option>
                    <option value="income">Pemasukan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-600 mb-1">
                    Warna Penanda
                  </label>
                  <input
                    type="color"
                    value={catColor}
                    onChange={(e) => setCatColor(e.target.value)}
                    className="w-full h-8 rounded-xl border border-surface-200 cursor-pointer p-0.5 bg-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" size="sm">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Kategori
                </Button>
              </div>
            </form>
          </Card>

          <Card>
            <h3 className="font-bold text-base text-surface-900 mb-3">
              Daftar Kategori Aktif ({categories.length})
            </h3>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-surface-50 border border-surface-200/80 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="font-semibold text-surface-800">{c.name}</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-surface-400">
                    {c.type}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Checkout & Upgrade Modal */}
      <MidtransModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        planCode={checkoutPlan.code}
        planName={checkoutPlan.name}
        price={checkoutPlan.price}
      />
    </div>
  );
}
