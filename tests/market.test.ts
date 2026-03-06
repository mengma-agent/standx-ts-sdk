import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MarketAPI } from '../src/market';
import { ValidationError, APIError, TimeoutError } from '../src/errors';

// Mock global fetch
global.fetch = vi.fn();

describe('MarketAPI', () => {
  let market: MarketAPI;

  beforeEach(() => {
    market = new MarketAPI({ baseUrl: 'https://test.standx.com' });
    vi.clearAllMocks();
  });

  describe('ticker', () => {
    it('should fetch ticker successfully', async () => {
      const mockResponse = {
        symbol: 'BTC-USD',
        last_price: '67000',
        mark_price: '67100',
        index_price: '66900',
        high_price_24h: '68000',
        low_price_24h: '66000',
        volume_24h: '1000000',
        funding_rate: '0.0001',
        next_funding_time: '2026-03-06T08:00:00Z',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await market.ticker('BTC-USD');

      expect(result.symbol).toBe('BTC-USD');
      expect(result.lastPrice).toBe('67000');
      expect(result.markPrice).toBe('67100');
    });

    it('should throw ValidationError for empty symbol', async () => {
      await expect(market.ticker('')).rejects.toThrow(ValidationError);
      await expect(market.ticker('  ')).rejects.toThrow(ValidationError);
    });

    it('should throw APIError for failed request', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ message: 'Server error' }),
      });

      await expect(market.ticker('BTC-USD')).rejects.toThrow(APIError);
    });
  });

  describe('tickers', () => {
    it('should fetch all tickers', async () => {
      const mockResponse = [
        { symbol: 'BTC-USD', last_price: '67000' },
        { symbol: 'ETH-USD', last_price: '3500' },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await market.tickers();

      expect(result).toHaveLength(2);
      expect(result[0].symbol).toBe('BTC-USD');
      expect(result[1].symbol).toBe('ETH-USD');
    });
  });

  describe('depth', () => {
    it('should fetch order book', async () => {
      const mockResponse = {
        symbol: 'BTC-USD',
        bids: [['67000', '1.5'], ['66900', '2.0']],
        asks: [['67100', '1.0'], ['67200', '2.5']],
        timestamp: '1709700000000',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await market.depth('BTC-USD', 20);

      expect(result.symbol).toBe('BTC-USD');
      expect(result.bids).toHaveLength(2);
      expect(result.asks).toHaveLength(2);
    });
  });

  describe('trades', () => {
    it('should fetch recent trades', async () => {
      const mockResponse = [
        { id: '1', price: '67000', qty: '0.5', side: 'buy', time: '1709700000000' },
        { id: '2', price: '67050', qty: '0.3', side: 'sell', time: '1709700001000' },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await market.trades('BTC-USD');

      expect(result).toHaveLength(2);
      expect(result[0].price).toBe('67000');
    });
  });

  describe('kline', () => {
    it('should fetch kline data', async () => {
      const mockResponse = [
        { time: 1709700000, open: '67000', high: '67100', low: '66900', close: '67050', volume: '1000' },
        { time: 1709700060, open: '67050', high: '67200', low: '67000', close: '67100', volume: '1500' },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await market.kline('BTC-USD', { interval: '1m', limit: 10 });

      expect(result).toHaveLength(2);
      expect(result[0].open).toBe('67000');
      expect(result[1].close).toBe('67100');
    });
  });
});
