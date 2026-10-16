'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Camera,
  Mic,
  Sparkles,
  Bot,
  CheckCircle2,
  Paperclip,
  Code2,
  RefreshCw,
  Zap,
  WalletCards,
  Check,
} from 'lucide-react';
import { useTataDana } from '@/lib/store/tatadana-store';
import { Button } from '@/components/ui/Button';
import { formatRupiah } from '@/lib/utils';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  hasPhoto?: boolean;
  hasVoice?: boolean;
  parsedData?: any;
  requiresWalletSelection?: boolean;
  selectedWalletId?: string | null;
  confirmed?: boolean;
  inputSource?: 'manual' | 'telegram_text' | 'telegram_receipt' | 'telegram_voice' | 'api';
  rawText?: string;
}

export function TelegramChatSimulator() {
  const { addTransaction, profile, wallets, categories } = useTataDana();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'bot',
      text:
        '👋 *Halo Sinta Salsabila! Selamat datang di TataDana Bot* 🚀\n\nSaya adalah asisten AI pencatat keuangan Anda. Coba kirimkan teks transaksi, foto struk, atau voice note. AI Bot tidak akan memilih dompet secara otomatis, melainkan meminta Anda memilih dompet sumber dana.',
      timestamp: '10:00',
    },
  ]);

  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
  const [latestRawResponse, setLatestRawResponse] = useState<any>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = async (
    textToSend: string,
    options?: { hasPhoto?: boolean; hasVoice?: boolean }
  ) => {
    if (!textToSend.trim() && !options?.hasPhoto && !options?.hasVoice) return;

    const userMsg: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      hasPhoto: options?.hasPhoto,
      hasVoice: options?.hasVoice,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsLoading(true);

    try {
      const payload: any = {
        update_id: Math.floor(100000 + Math.random() * 900000),
        message: {
          message_id: Math.floor(100 + Math.random() * 900),
          from: {
            id: 928371928,
            is_bot: false,
            first_name: profile.full_name.split(' ')[0] || 'Sinta',
            username: 'sintasalsabila',
          },
          chat: {
            id: 928371928,
            type: 'private',
          },
          date: Math.floor(Date.now() / 1000),
          text: textToSend,
        },
      };

      if (options?.hasPhoto) {
        payload.message.photo = [{ file_id: 'photo_mock_receipt_123', width: 800, height: 1200 }];
        payload.simulated_image = 'data:image/jpeg;base64,mockReceiptImage';
      }

      if (options?.hasVoice) {
        payload.message.voice = { file_id: 'voice_mock_audio_123', duration: 4 };
      }

      const res = await fetch('/api/telegram/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setLatestRawResponse(data);

      const isParsed = Boolean(data.parsed_transaction && data.parsed_transaction.success);

      const botReply: ChatMessage = {
        id: `msg_b_${Date.now()}`,
        sender: 'bot',
        text: data.reply || 'Pesan diterima oleh server TataDana.',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        parsedData: data.parsed_transaction,
        requiresWalletSelection: isParsed,
        inputSource: options?.hasPhoto
          ? 'telegram_receipt'
          : options?.hasVoice
          ? 'telegram_voice'
          : 'telegram_text',
        rawText: textToSend,
      };

      setMessages((prev) => [...prev, botReply]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_err_${Date.now()}`,
          sender: 'bot',
          text: `⚠️ Terjadi kendala memproses pesan: ${err.message}`,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectWallet = (messageId: string, walletId: string) => {
    setMessages((prev) => {
      const targetMsg = prev.find((m) => m.id === messageId);
      if (!targetMsg || !targetMsg.parsedData) return prev;

      const pt = targetMsg.parsedData;
      const selectedWallet = wallets.find((w) => w.id === walletId);
      if (!selectedWallet) return prev;

      // Match category
      const matchedCat = pt.type === 'transfer' ? null : categories.find((c) =>
        c.name.toLowerCase().includes((pt.category || '').toLowerCase())
      );

      // Save transaction to store with EXPLICIT chosen wallet
      addTransaction({
        user_id: profile.id,
        wallet_id: walletId,
        destination_wallet_id: pt.type === 'transfer' ? (wallets.find((w) => w.id !== walletId)?.id || null) : null,
        category_id: pt.type === 'transfer' ? null : (matchedCat?.id || categories[0]?.id || null),
        type: pt.type || 'expense',
        amount: pt.amount,
        fee: 0,
        description: pt.description || (pt.type === 'transfer' ? 'Transfer Antar Wallet' : 'Transaksi Telegram Bot'),
        notes: pt.notes || `Input Bot: "${targetMsg.rawText || pt.description}" (Dompet dipilih: ${selectedWallet.name})`,
        source: targetMsg.inputSource || 'telegram_text',
        transaction_date: new Date().toISOString().slice(0, 10),
        ai_parsed: true,
        receipt_items: pt.items?.map((it: any, idx: number) => ({
          id: `item_${Date.now()}_${idx}`,
          transaction_id: '',
          item_name: it.name,
          quantity: it.quantity || 1,
          unit_price: it.price || it.subtotal,
          subtotal: it.subtotal,
        })),
      });

      return prev.map((m) =>
        m.id === messageId
          ? { ...m, confirmed: true, selectedWalletId: walletId }
          : m
      ).concat({
        id: `msg_conf_${Date.now()}`,
        sender: 'bot',
        text: `✅ *Dompet Terpilih: ${selectedWallet.name}*\n\nTransaksi *${pt.description || 'Pencatatan Finansial'}* (${formatRupiah(pt.amount)}) telah berhasil disimpan dan saldo dompet *${selectedWallet.name}* telah diperbarui.`,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      });
    });
  };

  const quickPrompts = [
    { label: 'Kopi 28rb Gopay', text: 'kopi kenangan 28rb pakai gopay' },
    { label: 'Nasi Padang 35k BCA', text: 'nasi padang 35k bca' },
    { label: 'Gaji 15jt Mandiri', text: 'gaji bulanan masuk 15jt ke mandiri' },
    { label: 'Bensin 50rb Cash', text: 'bensin pertamax 50rb cash dompet' },
    { label: 'DeepLink OTP Linking', text: '/start otp_489201' },
    { label: 'Menu Help', text: '/help' },
  ];

  return (
    <div className="bg-white rounded-3xl border border-surface-200/80 shadow-card-soft overflow-hidden flex flex-col h-[750px] max-w-4xl mx-auto">
      {/* Telegram Chat Header */}
      <div className="bg-brand-600 px-6 py-4 text-white flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-black text-xl text-white border border-white/30">
              <Bot className="w-6 h-6" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-brand-600" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-extrabold text-base leading-tight">TataDana Bot</h3>
              <CheckCircle2 className="w-4 h-4 text-white fill-white/20" />
            </div>
            <p className="text-xs text-brand-100 flex items-center gap-1">
              <span>@TataDanaBot</span> • <span className="text-white font-medium">Online (AI Gemini Flash)</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRawJson(!showRawJson)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors border border-white/20"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>{showRawJson ? 'Tutup JSON' : 'Lihat Payload'}</span>
          </button>
          <button
            onClick={() => {
              setMessages([
                {
                  id: 'msg_welcome',
                  sender: 'bot',
                  text: '👋 Chat dibersihkan. Silakan kirimkan instruksi pencatatan keuangan baru.',
                  timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                },
              ]);
            }}
            title="Reset Chat"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Raw JSON Debug Drawer */}
      {showRawJson && (
        <div className="bg-surface-900 text-surface-200 p-4 text-xs font-mono border-b border-surface-800 max-h-48 overflow-y-auto">
          <div className="flex items-center justify-between text-brand-400 mb-1 font-bold">
            <span>Webhook Raw JSON Telemetry</span>
            <span>HTTP 200 OK</span>
          </div>
          <pre>{JSON.stringify(latestRawResponse || { info: 'Kirim pesan untuk melihat webhook response real-time.' }, null, 2)}</pre>
        </div>
      )}

      {/* Quick Prompts Bar */}
      <div className="bg-surface-50 px-4 py-2.5 border-b border-surface-200/80 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
        <span className="text-[11px] font-bold text-surface-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Zap className="w-3 h-3 text-brand-500" /> Cepat:
        </span>
        {quickPrompts.map((q) => (
          <button
            key={q.label}
            onClick={() => sendMessage(q.text)}
            className="px-2.5 py-1 rounded-lg bg-white border border-surface-200 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 text-surface-700 font-medium shrink-0 transition-colors shadow-2xs"
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-[#F7F5F0] space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[70%] p-3.5 shadow-sm ${
                  isUser
                    ? 'telegram-bubble-out border border-brand-200/80 text-surface-900'
                    : 'telegram-bubble-in border border-surface-200 text-surface-900'
                }`}
              >
                {/* Media Badges */}
                {msg.hasPhoto && (
                  <div className="mb-2 p-2 bg-brand-100/70 rounded-xl flex items-center gap-2 text-xs font-semibold text-brand-800">
                    <Camera className="w-4 h-4 text-brand-600" />
                    <span>[Simulasi Unggah Foto Struk Kasir Alfamart]</span>
                  </div>
                )}
                {msg.hasVoice && (
                  <div className="mb-2 p-2 bg-emerald-100/70 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-800">
                    <Mic className="w-4 h-4 text-emerald-600" />
                    <span>[Simulasi Audio Voice Note 4 Detik]</span>
                  </div>
                )}

                {/* Message Body with line breaks & markdown bolds */}
                <div className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                  {msg.text.split('\n').map((line, i) => (
                    <p key={i} className="min-h-[1.2em]">
                      {line.split(/(\*[^*]+\*|`[^`]+`)/g).map((chunk, ci) => {
                        if (chunk.startsWith('*') && chunk.endsWith('*')) {
                          return <strong key={ci}>{chunk.slice(1, -1)}</strong>;
                        }
                        if (chunk.startsWith('`') && chunk.endsWith('`')) {
                          return (
                            <code key={ci} className="px-1 py-0.5 rounded bg-surface-200/80 font-mono text-[11px] text-surface-800">
                              {chunk.slice(1, -1)}
                            </code>
                          );
                        }
                        return chunk;
                      })}
                    </p>
                  ))}
                </div>

                {/* Inline Wallet Keyboard: AI Bot requires manual wallet selection */}
                {msg.requiresWalletSelection && (
                  <div className="mt-3 pt-3 border-t border-surface-200/80 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-brand-700">
                      <WalletCards className="w-4 h-4 text-brand-600" />
                      <span>
                        {msg.confirmed
                          ? 'Dompet Pembayaran Terpilih:'
                          : 'Pilih Dompet / Sumber Dana:'}
                      </span>
                    </div>

                    {!msg.confirmed ? (
                      <div className="space-y-1.5">
                        <p className="text-[11px] text-surface-500">
                          AI Bot tidak memilih dompet secara otomatis. Silakan tentukan rekening / dompet untuk mutasi ini:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                          {wallets.map((w) => (
                            <button
                              key={w.id}
                              onClick={() => handleSelectWallet(msg.id, w.id)}
                              className="p-2 rounded-xl border border-surface-200 bg-white hover:border-brand-500 hover:bg-brand-50 text-left transition-all shadow-2xs group flex items-center justify-between"
                            >
                              <div className="min-w-0 pr-2">
                                <div className="text-xs font-bold text-surface-900 group-hover:text-brand-700 truncate">
                                  {w.name}
                                </div>
                                <div className="text-[10px] text-surface-500 font-mono">
                                  Saldo: {formatRupiah(w.balance)}
                                </div>
                              </div>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-brand-100 text-brand-700 group-hover:bg-brand-600 group-hover:text-white transition-colors shrink-0">
                                Pilih
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          {wallets.find((w) => w.id === msg.selectedWalletId)?.name || 'Dompet'} (Tersimpan)
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Bottom timestamp */}
                <div className="flex justify-end mt-1.5">
                  <span className="text-[10px] text-surface-400 font-medium">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start">
            <div className="telegram-bubble-in p-3 border border-surface-200 flex items-center gap-2 text-xs text-brand-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-ping" />
              <span>TataDana Bot sedang menganalisis input dengan AI Gemini Flash...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Action Bar */}
      <div className="p-3 bg-white border-t border-surface-200 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          {/* Simulated Photo Button */}
          <button
            type="button"
            onClick={() =>
              sendMessage('Foto Struk Kasir Alfamart Surya Kencana 87.500', { hasPhoto: true })
            }
            className="p-2.5 rounded-xl border border-surface-200 hover:border-brand-300 hover:bg-brand-50 text-surface-600 hover:text-brand-600 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="Kirim Foto Struk OCR"
          >
            <Camera className="w-4 h-4 text-brand-600" />
            <span className="hidden sm:inline">Foto Struk OCR</span>
          </button>

          {/* Simulated Voice Note Button */}
          <button
            type="button"
            onClick={() =>
              sendMessage('Makan nasi bebek sinjay sama es jeruk habis 45 ribu tunai', {
                hasVoice: true,
              })
            }
            className="p-2.5 rounded-xl border border-surface-200 hover:border-brand-300 hover:bg-brand-50 text-surface-600 hover:text-brand-600 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="Kirim Rekaman Suara VN"
          >
            <Mic className="w-4 h-4 text-brand-600" />
            <span className="hidden sm:inline">Voice Note (VN)</span>
          </button>

          {/* Text Input */}
          <input
            type="text"
            placeholder="Ketik pesan slang (misal: 'nasi uduk 15rb bca', 'gaji 12jt mandiri')..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') sendMessage(inputVal);
            }}
            className="flex-1 px-4 py-2.5 rounded-xl border border-surface-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-surface-50/50"
          />

          <Button
            size="md"
            onClick={() => sendMessage(inputVal)}
            disabled={!inputVal.trim() || isLoading}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
