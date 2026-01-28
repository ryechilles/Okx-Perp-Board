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
    <div className="flex items-center gap-6 mb-4">
      <div className="flex items-end gap-0.5">
        <PerpLogo className="w-7 h-7 rounded-md" />
        <div className="text-lg font-semibold text-gray-900 leading-none pb-0.5">
          erp Board <span className="text-xs text-gray-400 font-normal">v2.2</span>
        </div>
      </div>
      
      <div className="inline-flex bg-gray-100 rounded-lg p-1 gap-0.5">
        <button className="px-4 py-2 rounded-md text-sm font-medium bg-white text-gray-900 shadow-sm">
          OKX
        </button>
        <button className="px-4 py-2 rounded-md text-sm font-medium text-gray-400 cursor-not-allowed">
          Coming soon
        </button>
      </div>
      
      {/* Social Links */}
      <div className="flex items-center gap-3 ml-auto">
        <a 
          href="https://x.com/ryechilles" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center w-8 h-8 text-gray-300 hover:text-gray-900 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </a>
        <a 
          href="https://github.com/ryechilles/Perp-Board" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center w-8 h-8 text-gray-300 hover:text-gray-900 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        </a>
      </div>
    </div>
  );
}
