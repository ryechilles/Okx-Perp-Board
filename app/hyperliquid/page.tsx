'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui';

export default function HyperliquidPage() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-muted">
      {/* Header */}
      <div className="bg-card shadow-sm">
        <Header />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <HyperliquidLogo className="w-12 h-12" />
            <h2 className="text-xl font-semibold text-foreground">Hyperliquid</h2>
            <p className="text-sm text-muted-foreground text-center">
              Hyperliquid perpetual market dashboard is coming soon.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="px-6 flex-shrink-0">
        <div className="max-w-[1600px] mx-auto w-full">
          <Footer />
        </div>
      </div>
    </div>
  );
}

function HyperliquidLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#00FF6F" />
      <path
        d="M10 10.5L16 7L22 10.5V21.5L16 25L10 21.5V10.5Z"
        stroke="#000"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M16 7V25"
        stroke="#000"
        strokeWidth="1.5"
      />
      <path
        d="M10 10.5L22 21.5"
        stroke="#000"
        strokeWidth="1.5"
      />
      <path
        d="M22 10.5L10 21.5"
        stroke="#000"
        strokeWidth="1.5"
      />
    </svg>
  );
}
