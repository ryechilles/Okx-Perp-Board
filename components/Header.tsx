'use client';

// P Logo SVG Component
function PerpLogo({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="100" height="100" fill="#9EF4C8"/>
      <rect x="100" y="0" width="100" height="100" fill="#22E27E"/>
      <rect x="200" y="0" width="100" height="100" fill="#6CF0AE"/>
      <rect x="0" y="100" width="100" height="100" fill="#12C76E"/>
      <rect x="100" y="100" width="100" height="100" fill="#29E98D"/>
      <rect x="200" y="100" width="100" height="100" fill="#A6F8D1"/>
      <rect x="0" y="200" width="100" height="100" fill="#0A8A4B"/>
      <rect x="100" y="200" width="100" height="100" fill="#22B96A"/>
      <rect x="200" y="200" width="100" height="100" fill="#2EF29A"/>
      <text x="150" y="210" textAnchor="middle" fontFamily="Inter, ui-sans-serif, system-ui" fontSize="200" fontWeight="800" fill="#FFFFFF">P</text>
    </svg>
  );
}

export function Header() {
  return (
    <div className="flex items-center gap-4 mb-4 flex-wrap">
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <PerpLogo className="w-6 h-6 rounded" />
        <span className="text-base font-semibold text-gray-900 whitespace-nowrap">
          Perp Board
        </span>
        <span className="text-[10px] text-gray-400">v2.2</span>
      </div>
      
      <div className="inline-flex bg-gray-100 rounded-lg p-1 gap-0.5">
        <button className="px-3 py-1.5 rounded-md text-sm font-medium bg-white text-gray-900 shadow-sm">
          OKX
        </button>
        <button className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-400 cursor-not-allowed">
          Coming soon
        </button>
      </div>
    </div>
  );
}
