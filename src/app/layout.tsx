import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TataDana | Smart Personal Finance & AI Telegram Bot Indonesia',
  description:
    'Catat keuangan harian & bisnis semudah chatting di Telegram dengan AI multimodal Gemini Flash, OCR struk kasir, dan integrasi multi-wallet.',
  keywords: [
    'tatadana',
    'fintech indonesia',
    'catat keuangan telegram',
    'bot telegram keuangan',
    'ai gemini keuangan',
    'aplikasi budget indonesia',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-[#FAFAF9] text-[#1C1917] antialiased">
        {children}
      </body>
    </html>
  );
}
