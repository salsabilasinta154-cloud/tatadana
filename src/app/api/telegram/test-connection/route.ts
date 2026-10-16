import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const token = searchParams.get('token') || process.env.TELEGRAM_BOT_TOKEN;

  return handleTelegramConnectionTest(token, null);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = body.token || process.env.TELEGRAM_BOT_TOKEN;
    const action = body.action; // 'test' | 'set_webhook' | 'delete_webhook'
    const webhookUrl = body.webhook_url || `${process.env.NEXT_PUBLIC_APP_URL || 'https://tatadana.id'}/api/telegram/webhook`;

    return handleTelegramConnectionTest(token, action, webhookUrl);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

async function handleTelegramConnectionTest(
  token: string | undefined,
  action: string | null,
  webhookUrl?: string
) {
  if (!token) {
    return NextResponse.json(
      {
        success: false,
        message: 'Bot token belum diatur. Masukkan TELEGRAM_BOT_TOKEN di .env atau settings.',
      },
      { status: 400 }
    );
  }

  // If mock/demo token, return successful simulated telemetry
  if (token.includes('Demo') || token.includes('1234567890')) {
    return NextResponse.json({
      success: true,
      mode: 'simulator_ready',
      bot: {
        id: 7123456789,
        is_bot: true,
        first_name: 'TataDana FinTech Bot',
        username: 'TataDanaBot',
        can_join_groups: true,
        can_read_all_group_messages: false,
        supports_inline_queries: false,
      },
      webhook: {
        url: webhookUrl || 'https://tatadana.id/api/telegram/webhook',
        has_custom_certificate: false,
        pending_update_count: 0,
        last_error_date: null,
        last_error_message: null,
        max_connections: 40,
        ip_address: '149.154.167.220',
      },
      message: 'Koneksi ke Bot Telegram aktif & responsif (Simulator Mode Siap Digunakan)',
    });
  }

  // Live Telegram Bot API Test
  try {
    const getMeRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const getMeData = await getMeRes.json();

    if (!getMeData.ok) {
      return NextResponse.json({
        success: false,
        error: `Telegram API error: ${getMeData.description || 'Token tidak valid'}`,
        code: getMeData.error_code,
      });
    }

    let webhookData: any = null;

    if (action === 'set_webhook' && webhookUrl) {
      const setHookRes = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhookUrl,
          drop_pending_updates: false,
        }),
      });
      webhookData = await setHookRes.json();
    } else {
      const getHookRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
      webhookData = await getHookRes.json();
    }

    return NextResponse.json({
      success: true,
      mode: 'live_telegram',
      bot: getMeData.result,
      webhook: webhookData?.result || webhookData,
      message: 'Koneksi bot Telegram resmi berhasil diverifikasi!',
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: `Gagal menghubungi server Telegram: ${error.message}`,
    });
  }
}
