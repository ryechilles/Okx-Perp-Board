import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Perp Board',
  description: 'OKX Perpetual Futures Dashboard with RSI indicators',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Standard favicon */}
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        {/* Apple touch icon */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        {/* Safari pinned tab */}
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#22B96A" />
        <meta name="theme-color" content="#22B96A" />
      </head>
      <body>{children}</body>
    </html>
  );
}
