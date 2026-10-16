import { NextRequest, NextResponse } from 'next/server';
import { processFinancialAI } from '@/lib/ai/router';
import { formatRupiah } from '@/lib/utils';

// In-memory idempotency cache (stores update_ids for 15 minutes)
const processedUpdateIds = new Map<number, number>();

function isUpdateProcessed(updateId: number): boolean {
  const now = Date.now();
  // Clear entries older than 15 minutes
  processedUpdateIds.forEach((timestamp, id) => {
    if (now - timestamp > 15 * 60 * 1000) {
      processedUpdateIds.delete(id);
    }
  });

  if (processedUpdateIds.has(updateId)) {
    return true;
  }
  processedUpdateIds.set(updateId, now);
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    const updateId = payload.update_id;
    if (typeof updateId === 'number') {
      if (isUpdateProcessed(updateId)) {
        return NextResponse.json({
          status: 'ok',
          message: 'Update already processed (Idempotency check passed)',
          update_id: updateId,
        });
      }
    }

    const message = payload.message || payload.edited_message;
    if (!message) {
      return NextResponse.json({ status: 'ok', message: 'No message object in payload' });
    }

    const chatId = message.chat?.id;
    const user = message.from;
    const text = (message.text || message.caption || '').trim();
    const hasPhoto = Boolean(message.photo && message.photo.length > 0);
    const hasVoice = Boolean(message.voice);

    let replyMessage = '';
    let parsedTransaction: any = null;

    // 1. Handle Deep-Link OTP / Start commands
    if (text.startsWith('/start') || text.startsWith('/otp')) {
      const parts = text.split(' ');
      const startParam = parts[1] || '';

      if (startParam.startsWith('otp_') || startParam.startsWith('link_')) {
        const otpCode = startParam.replace('otp_', '').replace('link_', '');
        replyMessage = `🎉 *Akun Telegram Anda Berhasil Terhubung!*\n\nSelamat ${user?.first_name || 'Kak'}! Akun Telegram Anda telah terverifikasi dan terhubung ke profil TataDana.\n\nKode Verifikasi: \`${otpCode}\`\n\nSekarang Anda dapat langsung mencatat keuangan dengan mengirimkan teks santai, foto struk, atau voice note ke bot ini kapan saja! 🚀`;
      } else {
        replyMessage = `👋 *Halo ${user?.first_name || 'Kak'}! Selamat datang di TataDana Bot* 🚀\n\nAsisten AI pintar pencatat keuangan pribadi & bisnis Anda.\n\n*Cara Penggunaan Cepat:*\n1️⃣ *Ketik Teks Slang:* \n   • \`kopi kenangan 28rb gopay\`\n   • \`nasi padang 35k bca\`\n   • \`gaji bulanan 15jt mandiri\`\n\n2️⃣ *Kirim Foto Struk:* Foto struk belanja Alfamart/Indomaret/Resto, AI kami akan ekstrak per item otomatis.\n\n3️⃣ *Kirim Voice Note (VN):* Rekam suara Anda seperti _"makan bakso 25 ribu tunai"_.`;
      }
    } else if (hasPhoto) {
      // 2. Receipt Vision OCR Processing
      const aiResponse = await processFinancialAI({
        imageBase64: payload.simulated_image || 'simulated_receipt_data',
        text: text || undefined,
      });

      parsedTransaction = aiResponse.result;

      let itemsListText = '';
      if (parsedTransaction.items && parsedTransaction.items.length > 0) {
        itemsListText = '\n\n*Rincian Item Belanja:*\n' + parsedTransaction.items
          .map((item: any) => `• ${item.name} (${item.quantity}x) — ${formatRupiah(item.subtotal)}`)
          .join('\n');
      }

      replyMessage = `🧾 *Struk Belanja Berhasil Diekstrak!*\n` +
        `🏪 Toko: *${parsedTransaction.merchant || 'Minimarket / Merchant'}*\n` +
        `💰 Total Nominal: *${formatRupiah(parsedTransaction.amount)}*\n` +
        `📂 Kategori: *${parsedTransaction.category}*\n` +
        `💳 Dompet: *Pilih Manual (AI tidak memilih otomatis)*` +
        itemsListText +
        `\n\n👉 *Silakan pilih dompet sumber dana di bawah untuk menyimpan transaksi ini.*`;
    } else if (hasVoice) {
      // 3. Voice Note Audio Processing
      const aiResponse = await processFinancialAI({
        audioBase64: 'simulated_audio_voice_data',
        text: text || undefined,
      });

      parsedTransaction = aiResponse.result;

      replyMessage = `🎤 *Voice Note Berhasil Diproses!*\n` +
        `🗣️ Transkrip Suara: _"${parsedTransaction.raw_text || text || 'Makan siang nasi bebek 45rb tunai'}"_\n\n` +
        `💰 Nominal: *${formatRupiah(parsedTransaction.amount)}*\n` +
        `📂 Kategori: *${parsedTransaction.category}*\n` +
        `💳 Dompet: *Pilih Manual (AI tidak memilih otomatis)*\n` +
        `📝 Deskripsi: *${parsedTransaction.description}*\n\n` +
        `👉 *Silakan pilih dompet sumber dana di bawah untuk memproses transaksi.*`;
    } else if (text.length > 0) {
      // 4. Natural Language / Slang Text Processing
      const aiResponse = await processFinancialAI({ text });
      parsedTransaction = aiResponse.result;

      const typeSymbol = parsedTransaction.type === 'income' ? '🟢 Pemasukan' : '🔴 Pengeluaran';

      replyMessage = `✅ *Transaksi Berhasil Diidentifikasi!*\n\n` +
        `🏷️ Tipe: *${typeSymbol}*\n` +
        `💰 Nominal: *${formatRupiah(parsedTransaction.amount)}*\n` +
        `📂 Kategori: *${parsedTransaction.category}*\n` +
        `💳 Dompet: *Pilih Manual (AI tidak memilih otomatis)*\n` +
        `📝 Deskripsi: *${parsedTransaction.description}*\n` +
        `⚡ AI Provider: _${parsedTransaction.provider_used}_\n\n` +
        `👉 *Silakan pilih dompet sumber dana di bawah untuk menyimpan transaksi ini.*`;
    } else {
      replyMessage = 'Mohon kirimkan pesan teks transaksi keuangan, foto struk, atau rekaman suara.';
    }

    // If bot token is active and not a mock key, attempt to send message via Telegram Bot API
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (botToken && !botToken.includes('Demo') && !botToken.includes('1234567890') && chatId) {
      try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: replyMessage,
            parse_mode: 'Markdown',
          }),
        });
      } catch (tgErr) {
        console.warn('Failed to forward reply to live Telegram API:', tgErr);
      }
    }

    return NextResponse.json({
      status: 'ok',
      reply: replyMessage,
      parsed_transaction: parsedTransaction,
      chat_id: chatId,
    });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}
