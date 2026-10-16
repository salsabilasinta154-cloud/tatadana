import { NextRequest, NextResponse } from 'next/server';
import { generateExcelReportBuffer } from '@/lib/export/excel-generator';
import { generatePDFReportBuffer } from '@/lib/export/pdf-generator';
import { INITIAL_CATEGORIES, INITIAL_WALLETS } from '@/lib/store/mock-data';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      transactions = [],
      wallets = INITIAL_WALLETS,
      categories = INITIAL_CATEGORIES,
      format = 'xlsx',
      startDate = '',
      endDate = '',
      userName = 'Pengguna TataDana',
    } = body;

    const timestamp = new Date().toISOString().slice(0, 10);

    if (format === 'pdf') {
      const pdfBuffer = generatePDFReportBuffer({
        transactions,
        wallets,
        categories,
        startDate,
        endDate,
        userName,
      });

      return new NextResponse(pdfBuffer as unknown as BodyInit, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="TataDana_Laporan_${timestamp}.pdf"`,
        },
      });
    }

    // Default: Excel .xlsx
    const excelBuffer = generateExcelReportBuffer({
      transactions,
      wallets,
      categories,
      startDate,
      endDate,
      userName,
    });

    return new NextResponse(excelBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="TataDana_Laporan_${timestamp}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating export:', error);
    return NextResponse.json(
      { error: 'Failed to generate report export', details: error.message },
      { status: 500 }
    );
  }
}
