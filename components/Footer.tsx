'use client';

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <div className="border-t border-gray-200 py-4 flex items-center justify-center">
      <span className="text-xs text-gray-400">
        Copyright © {currentYear}
      </span>
    </div>
  );
}
