import { NextRequest, NextResponse } from 'next/server';
import { processFinancialAI } from '@/lib/ai/router';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, imageBase64, audioBase64, providerMode, forcedProvider, userId } = body;

    if (!text && !imageBase64 && !audioBase64) {
      return NextResponse.json(
        { error: 'Wajib menyertakan input teks, foto struk, atau audio rekaman.' },
        { status: 400 }
      );
    }

    const { result, log } = await processFinancialAI(
      { text, imageBase64, audioBase64 },
      { providerMode, forcedProvider, userId }
    );

    return NextResponse.json({
      success: true,
      data: result,
      telemetry: {
        provider: log.provider,
        model: log.model,
        latency_ms: log.latency_ms,
        token_count: log.token_count,
        status: log.status,
      },
    });
  } catch (error: any) {
    console.error('AI parse error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
