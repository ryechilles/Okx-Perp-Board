import { OKXTicker, RSIData, ProcessedTicker, FundingRateData, ListingData, OKXInstrument, OKXFundingRate } from './types';
import { calculateRSI, calculate7DChange, processTicker, Mutex, RateLimiter } from './utils';

const OKX_WS_PUBLIC = 'wss://ws.okx.com:8443/ws/v5/public';
const OKX_REST_BASE = 'https://www.okx.com/api/v5';

// Global mutex for RSI fetching to prevent concurrent API calls
const rsiMutex = new Mutex();
const rateLimiter = new RateLimiter(8, 1000); // 8 requests per second max

export type TickerUpdateCallback = (tickers: Map<string, ProcessedTicker>) => void;
export type StatusCallback = (status: 'connecting' | 'live' | 'error', time?: Date) => void;

// Hybrid data manager: WebSocket for TOP 25 + REST polling for the rest
export class OKXHybridDataManager {
  private ws: WebSocket | null = null;
  private tickers: Map<string, ProcessedTicker> = new Map();
  private onUpdate: TickerUpdateCallback;
  private onStatus: StatusCallback;
  private top25InstIds: string[] = [];
  private allInstIds: string[] = [];
  private restPollInterval: NodeJS.Timeout | null = null;
  private wsReconnectTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private wsConnected = false;

  constructor(onUpdate: TickerUpdateCallback, onStatus: StatusCallback) {
    this.onUpdate = onUpdate;
    this.onStatus = onStatus;
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    this.onStatus('connecting');

    // Step 1: Fetch all tickers via REST to get initial data and determine TOP 25
    await this.fetchAllTickers();

    // Step 2: Connect WebSocket for TOP 25
    this.connectWebSocket();

    // Step 3: Start REST polling for non-TOP 25 (every 5 seconds)
    this.startRestPolling();
  }

  private async fetchAllTickers(): Promise<void> {
    try {
      const response = await fetch(`${OKX_REST_BASE}/market/tickers?instType=SWAP`);
      const data = await response.json();

      if (data.code === '0' && data.data) {
        const usdtSwaps: ProcessedTicker[] = [];

        data.data.forEach((ticker: OKXTicker) => {
          if (ticker.instId.endsWith('-USDT-SWAP')) {
            const processed = processTicker(ticker);
            this.tickers.set(ticker.instId, processed);
            usdtSwaps.push(processed);
          }
        });

        // Sort by 24h volume in USD (volCcy24h * price) descending
        usdtSwaps.sort((a, b) => {
          const volA = (parseFloat(a.volCcy24h) || 0) * a.priceNum;
          const volB = (parseFloat(b.volCcy24h) || 0) * b.priceNum;
          return volB - volA;
        });

        // TOP 25 for WebSocket
        this.top25InstIds = usdtSwaps.slice(0, 25).map(t => t.instId);
        this.allInstIds = usdtSwaps.map(t => t.instId);

        this.onUpdate(new Map(this.tickers));
        this.onStatus('live', new Date());
      }
    } catch (error) {
      console.error('Error fetching initial tickers:', error);
      this.onStatus('error');
    }
  }

  private connectWebSocket(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    if (this.top25InstIds.length === 0) return;

    try {
      this.ws = new WebSocket(OKX_WS_PUBLIC);

      this.ws.onopen = () => {
        console.log('WebSocket connected, subscribing to TOP 25...');
        this.wsConnected = true;

        // Subscribe to TOP 25 in batches (max 20 per message to be safe)
        const batchSize = 20;
        for (let i = 0; i < this.top25InstIds.length; i += batchSize) {
          const batch = this.top25InstIds.slice(i, i + batchSize);
          const subscribeMsg = {
            op: 'subscribe',
            args: batch.map(instId => ({
              channel: 'tickers',
              instId: instId
            }))
          };
          this.ws?.send(JSON.stringify(subscribeMsg));
        }

        // Start ping interval
        this.startPing();
      };

      this.ws.onmessage = (event) => {
        const rawData = event.data;

        // Handle pong (plain text, not JSON)
        if (rawData === 'pong') {
          return;
        }

        try {
          const data = JSON.parse(rawData);

          // Handle subscription confirmation
          if (data.event === 'subscribe') {
            console.log('Subscribed:', data.arg?.instId || 'batch');
            return;
          }

          // Handle error
          if (data.event === 'error') {
            console.error('WebSocket error:', data.msg);
            return;
          }

          // Handle ticker data
          if (data.arg?.channel === 'tickers' && data.data) {
            data.data.forEach((ticker: OKXTicker) => {
              const processed = processTicker(ticker);
              this.tickers.set(ticker.instId, processed);
            });
            this.onUpdate(new Map(this.tickers));
            this.onStatus('live', new Date());
          }
        } catch (e) {
          // Ignore parse errors for non-JSON messages
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket closed');
        this.wsConnected = false;
        this.stopPing();

        // Reconnect after 3 seconds
        if (this.isRunning) {
          this.wsReconnectTimeout = setTimeout(() => {
            this.connectWebSocket();
          }, 3000);
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      // Retry after 5 seconds
      if (this.isRunning) {
        this.wsReconnectTimeout = setTimeout(() => {
          this.connectWebSocket();
        }, 5000);
      }
    }
  }

  private startPing(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send('ping');
      }
    }, 25000);
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private startRestPolling(): void {
    // Poll every 5 seconds for all tickers (updates non-TOP 25)
    this.restPollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${OKX_REST_BASE}/market/tickers?instType=SWAP`);
        const data = await response.json();

        if (data.code === '0' && data.data) {
          let updated = false;

          data.data.forEach((ticker: OKXTicker) => {
            if (ticker.instId.endsWith('-USDT-SWAP')) {
              // Only update non-TOP 25 via REST (TOP 25 updated by WebSocket)
              if (!this.wsConnected || !this.top25InstIds.includes(ticker.instId)) {
                const processed = processTicker(ticker);
                this.tickers.set(ticker.instId, processed);
                updated = true;
              }
            }
          });

          if (updated) {
            this.onUpdate(new Map(this.tickers));
            // Only update status if WebSocket is not connected
            if (!this.wsConnected) {
              this.onStatus('live', new Date());
            }
          }
        }
      } catch (error) {
        console.error('REST polling error:', error);
      }
    }, 5000);
  }

  stop(): void {
    this.isRunning = false;

    // Stop WebSocket
    this.stopPing();
    if (this.wsReconnectTimeout) {
      clearTimeout(this.wsReconnectTimeout);
      this.wsReconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    // Stop REST polling
    if (this.restPollInterval) {
      clearInterval(this.restPollInterval);
      this.restPollInterval = null;
    }
  }

  getTickers(): Map<string, ProcessedTicker> {
    return new Map(this.tickers);
  }

  getTop50InstIds(): string[] {
    return [...this.top25InstIds];
  }
}

// Fetch all tickers via REST (fallback)
export async function fetchTickersREST(): Promise<ProcessedTicker[]> {
  try {
    const response = await fetch(`${OKX_REST_BASE}/market/tickers?instType=SWAP`);
    const data = await response.json();
    
    if (data.code === '0' && data.data) {
      return data.data.map((t: OKXTicker) => processTicker(t));
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch tickers:', error);
    return [];
  }
}

// Fetch spot symbols
export async function fetchSpotSymbols(): Promise<Set<string>> {
  try {
    const response = await fetch(`${OKX_REST_BASE}/market/tickers?instType=SPOT`);
    const data = await response.json();
    
    if (data.code === '0' && data.data) {
      const symbols = new Set<string>();
      data.data.forEach((t: OKXTicker) => {
        const parts = t.instId.split('-');
        symbols.add(`${parts[0]}-${parts[1]}`);
      });
      return symbols;
    }
    return new Set();
  } catch (error) {
    console.error('Failed to fetch spot symbols:', error);
    return new Set();
  }
}

// Fetch listing dates for all SWAP instruments
export async function fetchListingDates(): Promise<Map<string, ListingData>> {
  try {
    const response = await fetch(`${OKX_REST_BASE}/public/instruments?instType=SWAP`);
    const data = await response.json();
    
    const result = new Map<string, ListingData>();
    if (data.code === '0' && data.data) {
      data.data.forEach((inst: OKXInstrument) => {
        if (inst.listTime) {
          result.set(inst.instId, {
            listTime: parseInt(inst.listTime, 10)
          });
        }
      });
    }
    return result;
  } catch (error) {
    console.error('Failed to fetch listing dates:', error);
    return new Map();
  }
}

// Fetch funding rates for all SWAP instruments
export async function fetchFundingRates(): Promise<Map<string, FundingRateData>> {
  try {
    // First get the list of all SWAP instruments
    const response = await fetch(`${OKX_REST_BASE}/public/instruments?instType=SWAP`);
    const instData = await response.json();
    
    if (instData.code !== '0' || !instData.data) {
      return new Map();
    }
    
    const result = new Map<string, FundingRateData>();
    const instIds = instData.data
      .filter((inst: OKXInstrument) => inst.instId.includes('-USDT-'))
      .map((inst: OKXInstrument) => inst.instId);
    
    // Fetch funding rates in batches
    const batchSize = 20;
    for (let i = 0; i < instIds.length; i += batchSize) {
      const batch = instIds.slice(i, i + batchSize);
      
      // Fetch each instrument's funding rate
      const promises = batch.map(async (instId: string) => {
        try {
          const res = await fetch(`${OKX_REST_BASE}/public/funding-rate?instId=${instId}`);
          const data = await res.json();
          
          if (data.code === '0' && data.data && data.data[0]) {
            const fr = data.data[0] as OKXFundingRate;
            const fundingTime = parseInt(fr.fundingTime, 10) || 0;
            const nextFundingTime = parseInt(fr.nextFundingTime, 10) || 0;
            
            // Calculate settlement interval in hours
            let settlementInterval = 8; // default
            if (fundingTime && nextFundingTime) {
              const diffMs = nextFundingTime - fundingTime;
              const diffHours = Math.round(diffMs / (1000 * 60 * 60));
              if (diffHours > 0 && diffHours <= 8) {
                settlementInterval = diffHours;
              }
            }
            
            return {
              instId,
              data: {
                fundingRate: parseFloat(fr.fundingRate) || 0,
                nextFundingRate: parseFloat(fr.nextFundingRate) || 0,
                fundingTime,
                nextFundingTime,
                settlementInterval,
                lastUpdated: Date.now()
              }
            };
          }
          return null;
        } catch {
          return null;
        }
      });
      
      const results = await Promise.all(promises);
      results.forEach(r => {
        if (r) result.set(r.instId, r.data);
      });
      
      // Small delay between batches
      if (i + batchSize < instIds.length) {
        await new Promise(r => setTimeout(r, 100));
      }
    }
    
    return result;
  } catch (error) {
    console.error('Failed to fetch funding rates:', error);
    return new Map();
  }
}

// Fetch RSI data for a single instrument with mutex protection
export async function fetchRSIForInstrument(instId: string): Promise<RSIData | null> {
  await rsiMutex.acquire();
  
  try {
    await rateLimiter.waitForSlot();
    
    // Fetch daily candles for RSI and 7D change
    // Need more candles for RSI to converge properly (TradingView uses ~100+ bars)
    const response = await fetch(`${OKX_REST_BASE}/market/candles?instId=${instId}&bar=1D&limit=100`);
    const data = await response.json();
    
    let rsi7: number | null = null;
    let rsi14: number | null = null;
    let rsiW7: number | null = null;
    let rsiW14: number | null = null;
    let change7d: number | null = null;
    let change4h: number | null = null;
    
    if (data.code === '0' && data.data && data.data.length >= 15) {
      // OKX returns newest first, include current candle to match OKX's own RSI display
      const candles = [...data.data].reverse();
      const closes = candles.map((c: string[]) => parseFloat(c[4]));

      rsi7 = calculateRSI(closes, 7);
      rsi14 = calculateRSI(closes, 14);
      change7d = calculate7DChange(candles.map((c: string[]) => c.map(parseFloat)));
    }
    
    // Small delay before weekly request
    await new Promise(r => setTimeout(r, 100));
    await rateLimiter.waitForSlot();
    
    // Fetch weekly candles for weekly RSI
    // Need more candles for RSI to converge properly
    try {
      const responseW = await fetch(`${OKX_REST_BASE}/market/candles?instId=${instId}&bar=1W&limit=100`);
      const dataW = await responseW.json();

      if (dataW.code === '0' && dataW.data && dataW.data.length >= 15) {
        // Include current candle to match OKX's own RSI display
        const candlesW = [...dataW.data].reverse();
        const closesW = candlesW.map((c: string[]) => parseFloat(c[4]));

        rsiW7 = calculateRSI(closesW, 7);
        rsiW14 = calculateRSI(closesW, 14);
      }
    } catch (e) {
      console.warn(`Weekly RSI data failed for ${instId}`);
    }
    
    // Small delay before 4H request
    await new Promise(r => setTimeout(r, 100));
    await rateLimiter.waitForSlot();
    
    // Fetch 4H candles for 4H change
    try {
      const response4h = await fetch(`${OKX_REST_BASE}/market/candles?instId=${instId}&bar=4H&limit=2`);
      const data4h = await response4h.json();
      
      if (data4h.code === '0' && data4h.data && data4h.data.length >= 2) {
        const currentClose = parseFloat(data4h.data[0][4]);
        const prevClose = parseFloat(data4h.data[1][4]);
        if (prevClose > 0) {
          change4h = ((currentClose - prevClose) / prevClose) * 100;
        }
      }
    } catch (e) {
      console.warn(`4H data failed for ${instId}`);
    }
    
    return {
      rsi7,
      rsi14,
      rsiW7,
      rsiW14,
      change7d,
      change4h,
      lastUpdated: Date.now()
    };
  } catch (error) {
    console.error(`Failed to fetch RSI for ${instId}:`, error);
    return null;
  } finally {
    rsiMutex.release();
  }
}

// Batch fetch RSI for multiple instruments with priority
export async function fetchRSIBatch(
  instIds: string[],
  existingData: Map<string, RSIData>,
  onProgress: (text: string) => void,
  onUpdate: (instId: string, data: RSIData) => void,
  priorityCount: number = 50 // Prioritize first 50 tokens
): Promise<void> {
  // Filter out instruments that already have recent RSI data (within 5 minutes)
  const staleThreshold = 5 * 60 * 1000; // 5 minutes
  const now = Date.now();
  
  const toFetch = instIds.filter(id => {
    const existing = existingData.get(id);
    if (!existing) return true;
    return now - existing.lastUpdated > staleThreshold;
  });
  
  if (toFetch.length === 0) {
    onProgress('');
    return;
  }
  
  // Prioritize first N tokens (based on rank/visibility)
  const priorityBatch = toFetch.slice(0, priorityCount);
  const remainingBatch = toFetch.slice(priorityCount);
  
  // Process priority batch first
  for (let i = 0; i < priorityBatch.length; i++) {
    const instId = priorityBatch[i];
    onProgress(`RSI ${i + 1}/${priorityBatch.length} (Priority)`);
    
    const rsiData = await fetchRSIForInstrument(instId);
    if (rsiData) {
      onUpdate(instId, rsiData);
    }
    
    // Delay between requests
    if (i < priorityBatch.length - 1) {
      await new Promise(r => setTimeout(r, 300));
    }
  }
  
  // Process remaining batch at lower frequency
  for (let i = 0; i < remainingBatch.length; i++) {
    const instId = remainingBatch[i];
    onProgress(`RSI ${priorityBatch.length + i + 1}/${toFetch.length}`);
    
    const rsiData = await fetchRSIForInstrument(instId);
    if (rsiData) {
      onUpdate(instId, rsiData);
    }
    
    // Longer delay for non-priority items
    if (i < remainingBatch.length - 1) {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  
  onProgress('');
}

// Fetch CoinGecko market cap data with pagination (up to 500 coins)
export async function fetchMarketCapData(): Promise<Map<string, { marketCap: number; rank: number; logo?: string }>> {
  const result = new Map<string, { marketCap: number; rank: number; logo?: string }>();
  
  try {
    // Fetch page 1 (1-250)
    const response1 = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false'
    );
    const data1 = await response1.json();
    
    if (Array.isArray(data1)) {
      data1.forEach((coin: { symbol: string; market_cap: number; market_cap_rank: number; image: string }) => {
        const symbol = coin.symbol.toUpperCase();
        const existing = result.get(symbol);
        // Only set if not exists OR if this coin has higher rank (lower number = better)
        if (!existing || (coin.market_cap_rank && coin.market_cap_rank < existing.rank)) {
          result.set(symbol, {
            marketCap: coin.market_cap,
            rank: coin.market_cap_rank || 9999,
            logo: coin.image
          });
        }
      });
    }
    
    // Small delay before page 2
    await new Promise(r => setTimeout(r, 500));
    
    // Fetch page 2 (251-500)
    const response2 = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=2&sparkline=false'
    );
    const data2 = await response2.json();
    
    if (Array.isArray(data2)) {
      data2.forEach((coin: { symbol: string; market_cap: number; market_cap_rank: number; image: string }) => {
        const symbol = coin.symbol.toUpperCase();
        const existing = result.get(symbol);
        // Only set if not exists OR if this coin has higher rank (lower number = better)
        if (!existing || (coin.market_cap_rank && coin.market_cap_rank < existing.rank)) {
          result.set(symbol, {
            marketCap: coin.market_cap,
            rank: coin.market_cap_rank || 9999,
            logo: coin.image
          });
        }
      });
    }
    
    return result;
  } catch (error) {
    console.error('Failed to fetch CoinGecko data:', error);
    return result;
  }
}
