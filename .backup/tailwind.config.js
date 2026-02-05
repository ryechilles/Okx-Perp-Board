/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  // Safelist for dynamic class names used in constants
  safelist: [
    // AHR999 zone colors
    'bg-green-500', 'bg-emerald-400', 'bg-orange-400', 'bg-red-400', 'bg-red-600',
    'text-green-600', 'text-emerald-500', 'text-orange-500', 'text-red-500', 'text-red-600',
    // RSI pill styles
    'bg-green-300', 'bg-green-400', 'text-green-800',
    'bg-red-500', 'text-white',
  ],
  theme: {
    extend: {
      colors: {
        border: '#e5e5e5',
        background: '#fafafa',
        foreground: '#1a1a1a',
        muted: '#666',
        'muted-foreground': '#999',
      },
    },
  },
  plugins: [],
}
