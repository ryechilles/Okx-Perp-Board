'use client';

interface FooterProps {
  language: 'en' | 'zh';
  onLanguageChange: (lang: 'en' | 'zh') => void;
}

export function Footer({ language, onLanguageChange }: FooterProps) {
  const currentYear = new Date().getFullYear();
  
  return (
    <div className="border-t border-gray-200 mt-6">
      <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          Copyright © {currentYear}
        </span>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <button
            onClick={() => onLanguageChange('zh')}
            className={`hover:text-gray-700 transition-colors ${language === 'zh' ? 'text-gray-700 font-medium' : ''}`}
          >
            中文
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={() => onLanguageChange('en')}
            className={`hover:text-gray-700 transition-colors ${language === 'en' ? 'text-gray-700 font-medium' : ''}`}
          >
            English
          </button>
        </div>
      </div>
    </div>
  );
}
