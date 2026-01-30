import { NextResponse } from 'next/server';

// CoinGecko API proxy to avoid CORS and rate limit issues
// Cache the response for 5 minutes to reduce API calls
const cache: Record<string, { data: unknown; timestamp: number }> = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page') || '1';

  // Check cache first (per page)
  const cacheKey = `page_${page}`;
  const cached = cache[cacheKey];
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`[CoinGecko Proxy] Returning cached page ${page}`);
    return NextResponse.json(cached.data);
  }

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=${page}&sparkline=true`,
      {
        headers: {
          'Accept': 'application/json',
        },
        // Cache on server side
        next: { revalidate: 300 } // 5 minutes
      }
    );

    if (!response.ok) {
      console.error(`[CoinGecko Proxy] API error: ${response.status}`);
      return NextResponse.json(
        { error: `CoinGecko API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Update cache for this page
    cache[cacheKey] = { data, timestamp: Date.now() };
    console.log(`[CoinGecko Proxy] Cached page ${page}, ${Array.isArray(data) ? data.length : 0} coins`);

    return NextResponse.json(data);
  } catch (error) {
    console.error('[CoinGecko Proxy] Failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from CoinGecko' },
      { status: 500 }
    );
  }
}
