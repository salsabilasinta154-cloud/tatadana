'use client';

import React, { useState, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatRupiah, compressImageFile } from '@/lib/utils';
import { useTataDana } from '@/lib/store/tatadana-store';
import {
  CreditCard,
  QrCode,
  Building2,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  UploadCloud,
  ImageIcon,
} from 'lucide-react';

interface MidtransModalProps {
  isOpen: boolean;
  onClose: () => void;
  planCode: 'starter_monthly' | 'pro_lifetime';
  planName: string;
  price: number;
}

export function MidtransModal({
  isOpen,
  onClose,
  planCode,
  planName,
  price,
}: MidtransModalProps) {
  const { profile, updateProfile, addPayment } = useTataDana();

  const [paymentMethod, setPaymentMethod] = useState<'midtrans_qris' | 'manual_transfer'>('midtrans_qris');
  const [bankName, setBankName] = useState('BCA');
  const [senderName, setSenderName] = useState('');
  const [receiptImage, setReceiptImage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const receiptFileInputRef = useRef<HTMLInputElement>(null);

  const handleReceiptChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Silakan pilih file gambar bukti transfer.');
      if (receiptFileInputRef.current) receiptFileInputRef.current.value = '';
      return;
    }
    try {
      // Compress receipt image to safe dimensions
      const compressed = await compressImageFile(file, 900, 900, 0.78);
      setReceiptImage(compressed);
    } catch (err: any) {
      alert(`Gagal memproses gambar: ${err.message || 'Terjadi kesalahan'}`);
    } finally {
      if (receiptFileInputRef.current) receiptFileInputRef.current.value = '';
    }
  };

  const handlePay = async () => {
    setIsProcessing(true);

    try {
      if (paymentMethod === 'midtrans_qris') {
        const orderId = `TD-${planCode === 'pro_lifetime' ? 'PRO' : 'START'}-${Date.now()}`;

        // Record in store so it appears in Admin Console
        addPayment({
          order_id: orderId,
          plan_code: planCode,
          amount: price,
          payment_method: 'midtrans_qris',
          status: 'settlement',
          midtrans_transaction_id: `mid_qris_${Date.now()}`,
          user_id: profile.id,
          user_name: profile.full_name,
          user_email: profile.email,
          user_phone: profile.phone || '0812-3456-7890',
          admin_notes: 'Otomatis settlement via Midtrans QRIS Sandbox Instant',
        });

        // Simulate instant Sandbox QRIS Settlement
        setTimeout(() => {
          updateProfile({
            subscription_tier: planCode === 'pro_lifetime' ? 'pro' : 'starter',
            subscription_status: 'active',
          });
          setIsProcessing(false);
          setIsSuccess(true);
          setSuccessMessage(
            `Pembayaran Sandbox Rp ${formatRupiah(price, false)} berhasil diselesaikan melalui Midtrans QRIS! Akun Anda telah di-upgrade ke ${planName}.`
          );
        }, 1000);
      } else {
        // Manual Transfer Bank
        const orderId = `TD-MANUAL-${Date.now()}`;
        const finalReceipt =
          receiptImage ||
          'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80';

        addPayment({
          order_id: orderId,
          plan_code: planCode,
          amount: price,
          payment_method: 'manual_transfer',
          status: 'pending',
          bank_name: bankName,
          account_sender_name: senderName || profile.full_name,
          manual_receipt_url: finalReceipt,
          user_id: profile.id,
          user_name: profile.full_name,
          user_email: profile.email,
          user_phone: profile.phone || '0812-3456-7890',
          admin_notes: `Menunggu konfirmasi mutasi rekening ${bankName} a/n PT Tata Dana`,
        });

        setIsProcessing(false);
        setIsSuccess(true);
        setSuccessMessage(
          'Bukti transfer berhasil dikirim ke antrean Admin! Kami akan melakukan verifikasi dan mengaktifkan akun Anda dalam 1x24 jam.'
        );
      }
    } catch (err: any) {
      alert(`Terjadi kendala: ${err.message}`);
      setIsProcessing(false);
    }
  };

  const resetAndClose = () => {
    setIsSuccess(false);
    setIsProcessing(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={resetAndClose}
      title={isSuccess ? 'Pembayaran Berhasil Dikonfirmasi' : `Checkout ${planName}`}
      description={
        isSuccess
          ? 'Terima kasih telah bergabung bersama TataDana!'
          : 'Pilih metode pembayaran aman melalui Midtrans Sandbox atau Transfer Bank Manual.'
      }
      maxWidth="md"
    >
      {isSuccess ? (
        <div className="text-center py-6 space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-surface-900">Upgrade Berhasil!</h3>
            <p className="text-sm text-surface-600 mt-2 leading-relaxed">{successMessage}</p>
          </div>
          <Button onClick={resetAndClose} className="w-full mt-4">
            Lanjut ke Dashboard
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Plan Summary Card */}
          <div className="p-4 rounded-2xl bg-brand-50 border border-brand-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block">
                Paket Dipilih
              </span>
              <h4 className="font-extrabold text-surface-900 text-base">{planName}</h4>
            </div>
            <div className="text-right">
              <span className="text-xs text-surface-500 block">Total Investasi</span>
              <span className="text-xl font-black text-brand-600">{formatRupiah(price)}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-surface-600">
              Metode Pembayaran
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('midtrans_qris')}
                className={`p-3 rounded-2xl border text-left flex flex-col gap-2 transition-all ${
                  paymentMethod === 'midtrans_qris'
                    ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20'
                    : 'border-surface-200 hover:border-surface-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <QrCode className="w-5 h-5 text-brand-600" />
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                    Instan
                  </span>
                </div>
                <div>
                  <span className="font-bold text-xs text-surface-900 block">Midtrans QRIS</span>
                  <span className="text-[10px] text-surface-500">GoPay, OVO, ShopeePay, BCA</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('manual_transfer')}
                className={`p-3 rounded-2xl border text-left flex flex-col gap-2 transition-all ${
                  paymentMethod === 'manual_transfer'
                    ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20'
                    : 'border-surface-200 hover:border-surface-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Building2 className="w-5 h-5 text-brand-600" />
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                    Manual
                  </span>
                </div>
                <div>
                  <span className="font-bold text-xs text-surface-900 block">Transfer Rekening</span>
                  <span className="text-[10px] text-surface-500">BCA PT Tata Dana Digital</span>
                </div>
              </button>
            </div>
          </div>

          {/* Conditional Method Form */}
          {paymentMethod === 'manual_transfer' ? (
            <div className="p-4 bg-surface-50 rounded-2xl border border-surface-200 space-y-3">
              <div className="p-3 bg-white rounded-xl border border-surface-200 text-xs">
                <span className="text-surface-500 block">Rekening Tujuan:</span>
                <span className="font-bold text-surface-900 text-sm block">BCA: 8830-1928-33</span>
                <span className="text-surface-600 block">a/n PT TATA DANA DIGITAL INDONESIA</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-600 mb-1">
                  Nama Pemilik Rekening Pengirim
                </label>
                <input
                  type="text"
                  placeholder="Nama sesuai buku tabungan Anda"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                />
              </div>

              <input
                ref={receiptFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleReceiptChange}
              />

              <div
                onClick={() => receiptFileInputRef.current?.click()}
                className="border border-dashed border-surface-300 hover:border-brand-500 rounded-xl p-3 text-center bg-white cursor-pointer transition-colors"
              >
                {receiptImage ? (
                  <div className="space-y-1">
                    <img
                      src={receiptImage}
                      alt="Preview Bukti"
                      className="h-20 w-auto mx-auto object-contain rounded-lg border border-surface-200"
                    />
                    <span className="text-xs font-bold text-brand-600 block">
                      Bukti transfer terpilih (Klik untuk ganti)
                    </span>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="w-6 h-6 text-brand-500 mx-auto mb-1" />
                    <span className="text-xs font-semibold text-surface-700 block">
                      Klik untuk Upload Bukti Transfer dari Perangkat
                    </span>
                    <span className="text-[10px] text-surface-400">
                      Format JPG, PNG, WEBP (maks 5MB) • Atau biarkan default simulasi
                    </span>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Sandbox Midtrans Payment Gateway Aktif</span>
                <span>
                  Transaksi ini berjalan di lingkungan simulasi Midtrans Sandbox. Tidak ada saldo riil
                  yang terpotong.
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-100">
            <Button type="button" variant="outline" onClick={resetAndClose} disabled={isProcessing}>
              Batal
            </Button>
            <Button type="button" onClick={handlePay} isLoading={isProcessing}>
              {paymentMethod === 'midtrans_qris' ? 'Bayar via QRIS Sekarang' : 'Kirim Bukti Transfer'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
