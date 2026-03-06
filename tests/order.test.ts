import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrderAPI } from '../src/order';
import { ValidationError, AuthError, APIError } from '../src/errors';

// Mock global fetch
global.fetch = vi.fn();

describe('OrderAPI', () => {
  const mockJwt = 'test-jwt-token';
  let order: OrderAPI;

  beforeEach(() => {
    order = new OrderAPI({
      baseUrl: 'https://test.standx.com',
      jwt: mockJwt,
    });
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should throw ValidationError if symbol is missing', async () => {
      await expect(
        order.create({
          symbol: '',
          side: 'buy',
          orderType: 'limit',
          qty: '0.1',
          price: '67000',
        } as any)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if side is invalid', async () => {
      await expect(
        order.create({
          symbol: 'BTC-USD',
          side: 'invalid',
          orderType: 'limit',
          qty: '0.1',
          price: '67000',
        } as any)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if orderType is invalid', async () => {
      await expect(
        order.create({
          symbol: 'BTC-USD',
          side: 'buy',
          orderType: 'stop',
          qty: '0.1',
          price: '67000',
        } as any)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if qty is not positive', async () => {
      await expect(
        order.create({
          symbol: 'BTC-USD',
          side: 'buy',
          orderType: 'limit',
          qty: '0',
          price: '67000',
        } as any)
      ).rejects.toThrow(ValidationError);

      await expect(
        order.create({
          symbol: 'BTC-USD',
          side: 'buy',
          orderType: 'limit',
          qty: '-1',
          price: '67000',
        } as any)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if price missing for limit order', async () => {
      await expect(
        order.create({
          symbol: 'BTC-USD',
          side: 'buy',
          orderType: 'limit',
          qty: '0.1',
        } as any)
      ).rejects.toThrow(ValidationError);
    });

    it('should create order successfully', async () => {
      const mockResponse = {
        id: 'order-123',
        symbol: 'BTC-USD',
        side: 'buy',
        order_type: 'limit',
        qty: '0.1',
        fill_qty: '0',
        price: '67000',
        status: 'new',
        created_at: '2026-03-06T10:00:00Z',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await order.create({
        symbol: 'BTC-USD',
        side: 'buy',
        orderType: 'limit',
        qty: '0.1',
        price: '67000',
      });

      expect(result.id).toBe('order-123');
      expect(result.symbol).toBe('BTC-USD');
      expect(result.status).toBe('new');
    });

    it('should throw APIError on failed request', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: 'Insufficient balance' }),
      });

      await expect(
        order.create({
          symbol: 'BTC-USD',
          side: 'buy',
          orderType: 'limit',
          qty: '0.1',
          price: '67000',
        })
      ).rejects.toThrow(APIError);
    });

    it('should throw AuthError when jwt is missing on request', async () => {
      const orderNoAuth = new OrderAPI({
        baseUrl: 'https://test.standx.com',
        jwt: '',
      } as any);

      await expect(
        orderNoAuth.create({
          symbol: 'BTC-USD',
          side: 'buy',
          orderType: 'limit',
          qty: '0.1',
          price: '67000',
        })
      ).rejects.toThrow(AuthError);
    });
  });

  describe('cancel', () => {
    it('should cancel order successfully', async () => {
      const mockResponse = {
        id: 'order-123',
        symbol: 'BTC-USD',
        side: 'buy',
        order_type: 'limit',
        qty: '0.1',
        fill_qty: '0',
        price: '67000',
        status: 'canceled',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await order.cancel('order-123', 'BTC-USD');

      expect(result.status).toBe('canceled');
    });
  });

  describe('cancelAll', () => {
    it('should cancel all orders', async () => {
      const mockResponse = { cancelled: 5 };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await order.cancelAll('BTC-USD');

      expect(result.cancelled).toBe(5);
    });
  });
});
