import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '班級抽籤與分組工具 | 課堂隨機點名與小組分配',
  description: '專為教師設計的課堂互動輔助網站，支援 CSV 上傳與貼上名單，具備豐富動畫、音效的隨機抽籤及視覺化自動分組功能。',
  openGraph: {
    title: '班級抽籤與分組工具',
    description: '專為教師設計的課堂互動輔助網站，支援隨機抽籤（動畫與音效）與自動分組功能。',
    type: 'website',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="zh-TW">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
