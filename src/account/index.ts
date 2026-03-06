import type { Balance, Position, Order, OrderStatus } from '../types';
import { APIError, TimeoutError, AuthError } from '../errors';

const DEFAULT_API_URL = 'https://perps.standx.com';

export class AccountAPI {
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

  private async request<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    if (!this.jwt) {
      throw new AuthError('JWT token is required for authenticated endpoints');
    }

    const url = new URL(`${this.baseUrl}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        url.searchParams.append(key, value);
      }
    });

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.jwt}`,
        },
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
          errorDetails.message || `API Error: ${response.status} ${response.statusText}`,
          response.status,
          errorDetails
        );
      }

      return response.json();
    } catch (err: any) {
      if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
        throw new TimeoutError('Request timeout', { endpoint, params });
      }
      if (err instanceof APIError || err instanceof AuthError) throw err;
      throw new APIError(err.message || 'Unknown error', undefined, { endpoint, params, originalError: err });
    }
  }

  /**
   * Get account balances
   */
  async balances(): Promise<Balance> {
    const data = await this.request<any>('/api/query_balance');
    return {
      totalEquity: data.total_equity || data.equity || '0',
      totalMargin: data.total_margin || data.margin || '0',
      available: data.cross_available || data.available || '0',
      pnl24h: data.pnl_24h || '0',
      wallets: (data.wallets || []).map((w: any) => ({
        asset: w.asset || 'USD',
        balance: w.balance || '0',
        available: w.available || '0',
        locked: w.locked || '0',
      })),
    };
  }

  /**
   * Get positions
   */
  async positions(symbol?: string): Promise<Position[]> {
    const params: Record<string, string> = {};
    if (symbol) params.symbol = symbol;

    const data = await this.request<any[]>('/api/query_position', params);
    return data.map((item) => ({
      id: item.id || 0,
      symbol: item.symbol,
      side: item.side === 'buy' ? 'buy' : 'sell',
      qty: item.qty || item.size || '0',
      entryPrice: item.entry_price || '0',
      markPrice: item.mark_price || '0',
      leverage: item.leverage || '1',
      marginMode: item.margin_mode || 'cross',
      unrealizedPnl: item.upnl || item.unrealized_pnl || '0',
      roe: item.roe || '0',
      liqPrice: item.liq_price,
      updatedAt: item.updated_at || item.time || '',
    }));
  }

  /**
   * Get orders
   */
  async orders(options: {
    symbol?: string;
    status?: OrderStatus;
    limit?: number;
  } = {}): Promise<Order[]> {
    const params: Record<string, string> = {};
    if (options.symbol) params.symbol = options.symbol;
    if (options.status) params.status = options.status;
    if (options.limit) params.limit = String(options.limit);

    const data = await this.request<any[]>('/api/query_orders', params);
    return data.map((item) => ({
      id: item.id || item.order_id || '',
      symbol: item.symbol,
      side: item.side === 'buy' ? 'buy' : 'sell',
      orderType: item.order_type || item.type || 'limit',
      qty: item.qty || item.quantity || '0',
      fillQty: item.fill_qty || item.filled || '0',
      price: item.price || '0',
      status: item.status || 'new',
      createdAt: item.created_at || item.time || '',
    }));
  }

  /**
   * Get order history
   */
  async history(options: {
    symbol?: string;
    startTime?: number;
    endTime?: number;
    limit?: number;
  } = {}): Promise<Order[]> {
    const params: Record<string, string> = {};
    if (options.symbol) params.symbol = options.symbol;
    if (options.startTime) params.start_time = String(options.startTime);
    if (options.endTime) params.end_time = String(options.endTime);
    if (options.limit) params.limit = String(options.limit);

    const data = await this.request<any[]>('/api/query_history_orders', params);
    return data.map((item) => ({
      id: item.id || item.order_id || '',
      symbol: item.symbol,
      side: item.side === 'buy' ? 'buy' : 'sell',
      orderType: item.order_type || item.type || 'limit',
      qty: item.qty || item.quantity || '0',
      fillQty: item.fill_qty || item.filled || '0',
      price: item.price || '0',
      status: item.status || 'filled',
      createdAt: item.created_at || item.time || '',
    }));
  }
}