import type { Ticker, OrderBook, Trade, Kline, SymbolInfo, FundingRate } from '../types';

const DEFAULT_API_URL = 'https://perps.standx.com';

export class MarketAPI {
  private baseUrl: string;
  private timeout: number;

  constructor(options: { baseUrl?: string; timeout?: number } = {}) {
    this.baseUrl = options.baseUrl || DEFAULT_API_URL;
    this.timeout = options.timeout || 30000;
  }

  private async request<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get ticker for a symbol
   */
  async ticker(symbol: string): Promise<Ticker> {
    const data = await this.request<any>('/api/query_symbol_price', { symbol });
    return {
      symbol: data.symbol || symbol,
      lastPrice: data.last_price || '0',
      markPrice: data.mark_price || '0',
      indexPrice: data.index_price || '0',
      high24h: data.high_price_24h || '0',
      low24h: data.low_price_24h || '0',
      volume24h: data.volume_24h || '0',
      fundingRate: data.funding_rate || '0',
      nextFundingTime: data.next_funding_time || '',
    };
  }

  /**
   * Get all tickers
   */
  async tickers(): Promise<Ticker[]> {
    const data = await this.request<any[]>('/api/query_symbol_price');
    return data.map((item) => ({
      symbol: item.symbol,
      lastPrice: item.last_price || '0',
      markPrice: item.mark_price || '0',
      indexPrice: item.index_price || '0',
      high24h: item.high_price_24h || '0',
      low24h: item.low_price_24h || '0',
      volume24h: item.volume_24h || '0',
      fundingRate: item.funding_rate || '0',
      nextFundingTime: item.next_funding_time || '',
    }));
  }

  /**
   * Get order book depth
   */
  async depth(symbol: string, limit: number = 20): Promise<OrderBook> {
    const data = await this.request<any>('/api/query_depth_book', { symbol, limit: String(limit) });
    return {
      symbol: data.symbol || symbol,
      bids: data.bids || [],
      asks: data.asks || [],
      timestamp: data.timestamp || String(Date.now()),
    };
  }

  /**
   * Get recent trades
   */
  async trades(symbol: string, limit: number = 50): Promise<Trade[]> {
    const data = await this.request<any[]>('/api/public_trade', {
      symbol,
      limit: String(limit),
    });
    return data.map((item) => ({
      id: item.id || '',
      time: item.time || item.created_at || String(Date.now()),
      price: item.price || '0',
      qty: item.qty || item.quantity || '0',
      side: item.side || '',
    }));
  }

  /**
   * Get kline/candlestick data
   */
  async kline(
    symbol: string,
    options: {
      interval?: '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
      startTime?: number;
      endTime?: number;
      limit?: number;
    } = {}
  ): Promise<Kline[]> {
    const params: Record<string, string> = { symbol };
    if (options.interval) params.interval = options.interval;
    if (options.startTime) params.start_time = String(options.startTime);
    if (options.endTime) params.end_time = String(options.endTime);
    if (options.limit) params.limit = String(options.limit);

    const data = await this.request<any>('/api/kline', params);
    return data.map((item: any) => ({
      time: item.time || item.t || 0,
      open: item.open || '0',
      high: item.high || '0',
      low: item.low || '0',
      close: item.close || '0',
      volume: item.volume || '0',
    }));
  }

  /**
   * Get funding rate history
   */
  async funding(symbol: string, limit: number = 10): Promise<FundingRate[]> {
    const data = await this.request<any[]>('/api/funding', {
      symbol,
      limit: String(limit),
    });
    return data.map((item) => ({
      symbol: item.symbol || symbol,
      fundingRate: item.funding_rate || '0',
      markPrice: item.mark_price || '0',
      time: item.time || item.created_at || '',
    }));
  }

  /**
   * Get all trading symbols
   */
  async symbols(): Promise<SymbolInfo[]> {
    const data = await this.request<any[]>('/api/symbols');
    return data.map((item) => ({
      symbol: item.symbol,
      baseAsset: item.base_asset,
      quoteAsset: item.quote_asset,
    }));
  }
}