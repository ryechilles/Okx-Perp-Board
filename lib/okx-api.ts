import { OKXTicker, RSIData, ProcessedTicker } from './types';
import { calculateRSI, calculate7DChange, processTicker, Mutex, RateLimiter } from './utils';

const OKX_WS_PUBLIC = 'wss://ws.okx.com:8443/ws/v5/public';
const OKX_REST_BASE = 'https://www.okx.com/api/v5';

// Global mutex for RSI fetching to prevent concurrent API calls
const rsiMutex = new Mutex();
const rateLimiter = new RateLimiter(8, 1000); // 8 requests per second max

export type TickerUpdateCallback = (tickers: Map<string, ProcessedTicker>) => void;
export type StatusCallback = (status: 'connecting' | 'live' | 'error', time?: Date) => void;

export class OKXWebSocket {
  private ws: WebSocket | null = null;
  private tickers: Map<string, ProcessedTicker> = new Map();
  private onUpdate: TickerUpdateCallback;
  private onStatus: StatusCallback;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private pingInterval: NodeJS.Timeout | null = null;
  private isConnected = false;

  constructor(onUpdate: TickerUpdateCallback, onStatus: StatusCallback) {
    this.onUpdate = onUpdate;
    this.onStatus = onStatus;
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    
    this.onStatus('connecting');
    
    try {
      this.ws = new WebSocket(OKX_WS_PUBLIC);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Subscribe to SWAP tickers
        const subscribeMsg = {
          op: 'subscribe',
          args: [{
            channel: 'tickers',
            instType: 'SWAP'
          }]
        };
        this.ws?.send(JSON.stringify(subscribeMsg));
        
        // Start ping interval
        this.startPing();
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle pong
          if (data.event === 'pong' || data.op === 'pong') {
            return;
          }
          
          // Handle subscription confirmation
          if (data.event === 'subscribe') {
            console.log('Subscribed to tickers');
            this.onStatus('live', new Date());
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
          console.error('Error parsing WS message:', e);
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.onStatus('error');
      };
      
      this.ws.onclose = () => {
        console.log('WebSocket closed');
        this.isConnected = false;
        this.stopPing();
        
        // Attempt reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
          console.log(`Reconnecting in ${delay}ms...`);
          setTimeout(() => this.connect(), delay);
        } else {
          this.onStatus('error');
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.onStatus('error');
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

  disconnect(): void {
    this.stopPing();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  getTickers(): Map<string, ProcessedTicker> {
    return new Map(this.tickers);
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

// Fetch RSI data for a single instrument with mutex protection
export async function fetchRSIForInstrument(instId: string): Promise<RSIData | null> {
  await rsiMutex.acquire();
  
  try {
    await rateLimiter.waitForSlot();
    
    // Fetch daily candles for RSI and 7D change
    const response = await fetch(`${OKX_REST_BASE}/market/candles?instId=${instId}&bar=1D&limit=30`);
    const data = await response.json();
    
    let rsi7: number | null = null;
    let rsi14: number | null = null;
    let change7d: number | null = null;
    let change4h: number | null = null;
    
    if (data.code === '0' && data.data && data.data.length >= 15) {
      const candles = [...data.data].reverse();
      const closes = candles.map((c: string[]) => parseFloat(c[4]));
      
      rsi7 = calculateRSI(closes, 7);
      rsi14 = calculateRSI(closes, 14);
      change7d = calculate7DChange(candles.map((c: string[]) => c.map(parseFloat)));
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

// Fetch CoinGecko market cap data
export async function fetchMarketCapData(): Promise<Map<string, { marketCap: number; rank: number }>> {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false'
    );
    const data = await response.json();
    
    const result = new Map<string, { marketCap: number; rank: number }>();
    data.forEach((coin: { symbol: string; market_cap: number }, index: number) => {
      const symbol = coin.symbol.toUpperCase();
      result.set(symbol, {
        marketCap: coin.market_cap,
        rank: index + 1
      });
    });
    
    return result;
  } catch (error) {
    console.error('Failed to fetch CoinGecko data:', error);
    return new Map();
  }
}
