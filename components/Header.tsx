'use client';

// P Logo SVG Component - matches the new logo design
function PerpLogo({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      {/* Row 1 */}
      <rect x="0" y="0" width="100" height="100" fill="#8FE8BD"/>
      <rect x="100" y="0" width="100" height="100" fill="#5DD99A"/>
      <rect x="200" y="0" width="100" height="100" fill="#7DE8B5"/>
      {/* Row 2 */}
      <rect x="0" y="100" width="100" height="100" fill="#4AC98A"/>
      <rect x="100" y="100" width="100" height="100" fill="#5DDB9C"/>
      <rect x="200" y="100" width="100" height="100" fill="#8EEDC0"/>
      {/* Row 3 */}
      <rect x="0" y="200" width="100" height="100" fill="#3AAF75"/>
      <rect x="100" y="200" width="100" height="100" fill="#4EC98D"/>
      <rect x="200" y="200" width="100" height="100" fill="#6DDBA8"/>
      {/* P Letter */}
      <text x="150" y="215" textAnchor="middle" fontFamily="Inter, ui-sans-serif, system-ui, -apple-system, sans-serif" fontSize="210" fontWeight="700" fill="#FFFFFF">P</text>
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
        <span className="text-[10px] text-gray-400">v2.3.2</span>
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
