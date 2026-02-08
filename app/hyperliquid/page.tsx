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

// Hyperliquid Logo (official brand asset) - Mint green for decorative use
function HyperliquidLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 144 144" fill="#97FCE4" xmlns="http://www.w3.org/2000/svg">
      <path d="M144 71.6991C144 119.306 114.866 134.582 99.5156 120.98C86.8804 109.889 83.1211 86.4521 64.116 84.0456C39.9942 81.0113 37.9057 113.133 22.0334 113.133C3.5504 113.133 0 86.2428 0 72.4315C0 58.3063 3.96809 39.0542 19.736 39.0542C38.1146 39.0542 39.1588 66.5722 62.132 65.1073C85.0007 63.5379 85.4184 34.8689 100.247 22.6271C113.195 12.0593 144 23.4641 144 71.6991Z" />
    </svg>
  );
}
