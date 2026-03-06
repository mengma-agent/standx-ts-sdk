import type { CreateOrderParams, Order } from '../types';
import { APIError, TimeoutError, AuthError, ValidationError } from '../errors';

const DEFAULT_API_URL = 'https://perps.standx.com';

export class OrderAPI {
  private baseUrl: string;
  private timeout: number;
  private jwt: string;

  constructor(options: {
    baseUrl?: string;
    timeout?: number;
    jwt: string;
  }) {
    this.baseUrl = options.baseUrl || DEFAULT_API_URL;
    this.timeout = options.timeout || 30000;
    this.jwt = options.jwt;
  }

  /**
   * Validate order parameters
   */
  private validateOrderParams(params: CreateOrderParams): void {
    if (!params.symbol) {
      throw new ValidationError('Symbol is required');
    }
    if (!params.side || !['buy', 'sell'].includes(params.side)) {
      throw new ValidationError('Side must be "buy" or "sell"');
    }
    if (!params.orderType || !['limit', 'market'].includes(params.orderType)) {
      throw new ValidationError('OrderType must be "limit" or "market"');
    }
    if (!params.qty || parseFloat(params.qty) <= 0) {
      throw new ValidationError('Quantity must be a positive number');
    }
    if (params.orderType === 'limit' && (!params.price || parseFloat(params.price) <= 0)) {
      throw new ValidationError('Price is required for limit orders');
    }
  }

  private async request<T>(endpoint: string, method: string = 'GET', body?: any): Promise<T> {
    if (!this.jwt) {
      throw new AuthError('JWT token is required for order operations');
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.jwt}`,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(this.timeout),
      });

      if (response.status === 401) {
        throw new AuthError('Invalid or expired JWT token');
      }

      if (!response.ok) {
        let errorDetails: any = {};
        try {
          errorDetails = await response.json();
        } catch { /* ignore */ }
        throw new APIError(
          errorDetails.message || `Order Error: ${response.status}`,
          response.status,
          errorDetails
        );
      }

      return response.json();
    } catch (err: any) {
      if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
        throw new TimeoutError('Request timeout', { endpoint, method, body });
      }
      if (err instanceof APIError || err instanceof AuthError || err instanceof ValidationError) throw err;
      throw new APIError(err.message || 'Unknown error', undefined, { endpoint, method, body, originalError: err });
    }
  }

  /**
   * Create a new order
   */
  async create(params: CreateOrderParams): Promise<Order> {
    this.validateOrderParams(params);
    const data = await this.request<any>('/api/place_order', 'POST', {
      symbol: params.symbol,
      side: params.side,
      order_type: params.orderType,
      qty: params.qty,
      price: params.price,
      time_in_force: params.timeInForce || 'gtc',
      tp_price: params.tpPrice,
      sl_price: params.slPrice,
    });

    return {
      id: data.id || data.order_id || '',
      symbol: data.symbol || params.symbol,
      side: data.side === 'buy' ? 'buy' : 'sell',
      orderType: data.order_type || data.type || params.orderType,
      qty: data.qty || params.qty,
      fillQty: data.fill_qty || '0',
      price: data.price || params.price || '0',
      status: data.status || 'new',
      createdAt: data.created_at || new Date().toISOString(),
    };
  }

  /**
   * Cancel an order
   */
  async cancel(orderId: string, symbol: string): Promise<Order> {
    const data = await this.request<any>('/api/cancel_order', 'POST', {
      orderId,
      symbol,
    });

    return {
      id: data.id || orderId,
      symbol: data.symbol || symbol,
      side: data.side || 'buy',
      orderType: data.order_type || 'limit',
      qty: data.qty || '0',
      fillQty: data.fill_qty || '0',
      price: data.price || '0',
      status: 'canceled',
      createdAt: data.created_at || '',
    };
  }

  /**
   * Cancel all orders
   */
  async cancelAll(symbol?: string): Promise<{ cancelled: number }> {
    const data = await this.request<any>('/api/cancel_all_orders', 'POST', {
      symbol: symbol || '',
    });

    return {
      cancelled: data.cancelled || data.count || 0,
    };
  }

  /**
   * Get order details
   */
  async getOrder(orderId: string, symbol: string): Promise<Order> {
    const data = await this.request<any>(`/api/query_order?order_id=${orderId}&symbol=${symbol}`);

    return {
      id: data.id || orderId,
      symbol: data.symbol || symbol,
      side: data.side === 'buy' ? 'buy' : 'sell',
      orderType: data.order_type || data.type || 'limit',
      qty: data.qty || '0',
      fillQty: data.fill_qty || '0',
      price: data.price || '0',
      status: data.status || 'new',
      createdAt: data.created_at || '',
    };
  }
}