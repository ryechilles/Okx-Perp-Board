import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Perp Board',
  description: 'OKX Perpetual Futures Dashboard with RSI indicators',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
