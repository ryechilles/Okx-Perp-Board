'use client';

import { APP_CONFIG } from '@/lib/config';

// P Logo SVG Component - matches the new flat minimal logo design
function PerpLogo({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
      {/* Background: 3x3 grid of green squares */}
      <g id="background">
        <rect x="0" y="0" width="341.333" height="341.333" fill="#a8f0cb"/>
        <rect x="341.333" y="0" width="341.333" height="341.333" fill="#47da93"/>
        <rect x="682.667" y="0" width="341.333" height="341.333" fill="#7beab5"/>
        <rect x="0" y="341.333" width="341.333" height="341.333" fill="#38bd7b"/>
        <rect x="341.333" y="341.333" width="341.333" height="341.333" fill="#4bcd8c"/>
        <rect x="682.667" y="341.333" width="341.333" height="341.333" fill="#98edc3"/>
        <rect x="0" y="682.667" width="341.333" height="341.333" fill="#22915c"/>
        <rect x="341.333" y="682.667" width="341.333" height="341.333" fill="#32b775"/>
        <rect x="682.667" y="682.667" width="341.333" height="341.333" fill="#4ada94"/>
      </g>
      {/* Letter P: Geometric flat design */}
      <g id="letter" fill="#ffffff" fillRule="evenodd">
        <path d="
          M 295 175
          L 540 175
          C 590 175 635 185 670 210
          C 705 235 730 270 745 315
          C 760 360 760 410 745 455
          C 730 500 705 535 670 560
          C 635 585 590 595 540 595
          L 455 595
          L 455 849
          L 295 849
          L 295 175
          Z
          M 455 315
          L 455 455
          L 520 455
          C 545 455 565 450 580 435
          C 595 420 600 400 600 385
          C 600 370 595 350 580 335
          C 565 320 545 315 520 315
          L 455 315
          Z
        "/>
      </g>
    </svg>
  );
}

// OKX Logo Component
function OkxLogo({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="currentColor" className={className}>
      <path d="M19.67 12.33h-7.34c-.18 0-.33.15-.33.33v7.34c0 .18.15.33.33.33h7.34c.18 0 .33-.15.33-.33v-7.34c0-.18-.15-.33-.33-.33z"/>
      <path d="M11.67 4h-7.34c-.18 0-.33.15-.33.33v7.34c0 .18.15.33.33.33h7.34c.18 0 .33-.15.33-.33V4.33c0-.18-.15-.33-.33-.33z"/>
      <path d="M27.67 4h-7.34c-.18 0-.33.15-.33.33v7.34c0 .18.15.33.33.33h7.34c.18 0 .33-.15.33-.33V4.33c0-.18-.15-.33-.33-.33z"/>
      <path d="M11.67 20h-7.34c-.18 0-.33.15-.33.33v7.34c0 .18.15.33.33.33h7.34c.18 0 .33-.15.33-.33v-7.34c0-.18-.15-.33-.33-.33z"/>
      <path d="M27.67 20h-7.34c-.18 0-.33.15-.33.33v7.34c0 .18.15.33.33.33h7.34c.18 0 .33-.15.33-.33v-7.34c0-.18-.15-.33-.33-.33z"/>
    </svg>
  );
}

export function Header() {
  return (
    <header className="px-4 sm:px-6 py-3 flex-shrink-0">
      <div className="max-w-[1600px] mx-auto w-full flex items-center justify-between">
        {/* Left: Logo + Title + Version */}
        <div className="flex items-center gap-3">
          <PerpLogo className="w-8 h-8 rounded-lg" />
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold text-gray-900">{APP_CONFIG.name}</span>
            <span className="text-xs text-gray-400 font-medium">{APP_CONFIG.versionDisplay}</span>
          </div>
        </div>

        {/* Right: Exchange Buttons */}
        <div className="flex items-center">
          <div className="inline-flex bg-gray-200 rounded-lg p-1 gap-0.5">
            <a
              href={APP_CONFIG.links.okx}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium bg-white text-gray-900 shadow-sm transition-all hover:bg-gray-50"
            >
              <OkxLogo className="w-4 h-4" />
              <span>OKX</span>
            </a>
            <button
              disabled
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium text-gray-400 cursor-not-allowed transition-all"
            >
              <span>Coming Soon</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
