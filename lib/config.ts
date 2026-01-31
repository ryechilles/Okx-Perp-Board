/**
 * Application Configuration
 *
 * Centralized configuration for the app.
 * Update VERSION here and it will reflect everywhere.
 */

export const APP_CONFIG = {
  name: 'Perp Board',
  title: 'Perp Board — OKX Perpetual Market Dashboard',
  version: '2.6.1',
  versionDisplay: 'v2.6.1',
  description: 'Real-time OKX perpetual futures dashboard. Funding rates, RSI signals, market cap and momentum at a glance.',
  author: 'ryechilles',
  links: {
    okx: 'https://okx.com/join/95869751',
    telegram: 'https://t.me/perp_board',
    twitter: 'https://x.com/ryechilles',
    github: 'https://github.com/ryechilles/Perp-Board',
  },
} as const;

export const { name, version, versionDisplay, description } = APP_CONFIG;
