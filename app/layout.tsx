import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/react';
import { APP_CONFIG } from '@/lib/config';
import { TooltipProvider } from '@/components/ui';
import './globals.css';

export const metadata: Metadata = {
  title: APP_CONFIG.title,
  description: APP_CONFIG.description,
  authors: [{ name: APP_CONFIG.author }],
  other: {
    version: APP_CONFIG.version,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Force desktop view on mobile - min 1200px width */}
        <meta name="viewport" content="width=1200, initial-scale=0.35, maximum-scale=2, user-scalable=yes" />
        {/* Version meta tag */}
        <meta name="version" content={APP_CONFIG.version} />
        {/* Standard favicon */}
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        {/* Apple touch icon */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        {/* Safari pinned tab */}
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#22B96A" />
        <meta name="theme-color" content="#22B96A" />
      </head>
      <body>
        <TooltipProvider>
          {children}
        </TooltipProvider>
        <Analytics />
      </body>
    </html>
  );
}
