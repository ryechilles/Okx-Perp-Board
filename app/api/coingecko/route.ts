import { NextResponse } from 'next/server';

// CoinGecko API proxy to avoid CORS and rate limit issues
// Cache the response for 5 minutes to reduce API calls
let cachedData: { data: unknown; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page') || '1';

  // Check cache first
  const cacheKey = `page_${page}`;
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
    return NextResponse.json(cachedData.data);
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

    // Update cache
    cachedData = { data, timestamp: Date.now() };

    return NextResponse.json(data);
  } catch (error) {
    console.error('[CoinGecko Proxy] Failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from CoinGecko' },
      { status: 500 }
    );
  }
}
