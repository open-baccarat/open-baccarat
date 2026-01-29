// ============================================
// OpenBaccarat - 根布局
// ============================================

import type { Metadata } from 'next';
import { Space_Grotesk, JetBrains_Mono, Noto_Sans_SC } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { TooltipProvider } from '@/components/ui/tooltip';
import { I18nProvider } from '@/i18n/provider';

const spaceGrotesk = Space_Grotesk({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
});

const notoSansSC = Noto_Sans_SC({
  variable: '--font-chinese',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '700'],
});

export const metadata: Metadata = {
  title: 'OpenBaccarat - Transparent & Verifiable Baccarat',
  description: 'A fully open-source, transparent, and blockchain-verifiable baccarat gaming platform',
  keywords: ['Baccarat', '百家乐', 'Blockchain', 'Solana', 'Open Source', 'Transparent', 'Verifiable'],
  authors: [{ name: 'OpenBaccarat' }],
  openGraph: {
    title: 'OpenBaccarat - Transparent & Verifiable Baccarat',
    description: 'A fully open-source, transparent, and blockchain-verifiable baccarat gaming platform',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} ${notoSansSC.variable} font-sans antialiased bg-zinc-950 text-white min-h-screen flex flex-col`}
      >
        <I18nProvider>
          <TooltipProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </TooltipProvider>
        </I18nProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
