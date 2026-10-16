'use client';

import React from 'react';
import { Transaction } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';
import { formatRupiah, formatDateIndo } from '@/lib/utils';
import { Receipt, Store, Calendar, CheckCircle2, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface ReceiptBreakdownModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ReceiptBreakdownModal({
  transaction,
  isOpen,
  onClose,
}: ReceiptBreakdownModalProps) {
  if (!transaction) return null;

  const items = transaction.receipt_items || [];
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rincian Item Struk Kasir (AI OCR)"
      description="Ekstraksi multi-item otomatis dari gambar struk fisik."
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Receipt Header Card */}
        <div className="p-4 rounded-2xl bg-surface-50 border border-surface-200/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center text-brand-700">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-surface-900 text-sm">{transaction.description}</h4>
              <p className="text-xs text-surface-500 flex items-center gap-1 mt-0.5">
                <Calendar className="w-3.5 h-3.5" />
                {formatDateIndo(transaction.transaction_date, true)}
              </p>
            </div>
          </div>
          <Badge variant="green" size="sm" className="flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> OCR Gemini 1.5 Flash
          </Badge>
        </div>

        {/* Items List Table */}
        <div className="border border-surface-200 rounded-2xl overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-surface-100 text-surface-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Item Barang</th>
                <th className="py-2.5 px-2 text-center">Qty</th>
                <th className="py-2.5 px-3 text-right">Harga Satuan</th>
                <th className="py-2.5 px-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {items.length > 0 ? (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-50/60">
                    <td className="py-2 px-3 font-medium text-surface-900">{item.item_name}</td>
                    <td className="py-2 px-2 text-center text-surface-600">{item.quantity}x</td>
                    <td className="py-2 px-3 text-right text-surface-600">
                      {formatRupiah(item.unit_price)}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-surface-900">
                      {formatRupiah(item.subtotal)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-surface-400">
                    Tidak ada rincian item tambahan untuk transaksi ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Totals Summary */}
          <div className="bg-surface-50 p-4 border-t border-surface-200 space-y-1.5">
            <div className="flex justify-between text-xs text-surface-600">
              <span>Total Item Fisik:</span>
              <span className="font-semibold">{totalItems} pcs</span>
            </div>
            <div className="flex justify-between text-sm font-black text-surface-900 pt-1 border-t border-surface-200/60">
              <span>Total Transaksi Struk:</span>
              <span className="text-brand-600">{formatRupiah(transaction.amount)}</span>
            </div>
          </div>
        </div>

        {/* Verification Footer */}
        <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3.5 py-2.5 rounded-xl border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>Data struk telah terverifikasi dan saldo dompet telah disinkronkan otomatis.</span>
        </div>
      </div>
    </Modal>
  );
}
