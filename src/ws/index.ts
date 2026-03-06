import type { Ticker, OrderBook, Trade, Position, Order, Balance } from '../types';

const DEFAULT_WS_URL = 'wss://perps.standx.com/ws-stream/v1';

type PriceCallback = (data: Ticker) => void;
type DepthCallback = (data: OrderBook) => void;
type TradeCallback = (data: Trade) => void;
type OrderCallback = (data: Order) => void;
type PositionCallback = (data: Position) => void;
type BalanceCallback = (data: Balance) => void;

interface Subscription {
  channel: string;
  symbol?: string;
  callback: any;
}

export class WebSocketAPI {
  private wsUrl: string;
  private jwt?: string;
  private ws: WebSocket | null = null;
  private subscriptions: Subscription[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectDelay = 3000;
  private isConnected = false;

  constructor(options: { wsUrl?: string; jwt?: string } = {}) {
    this.wsUrl = options.wsUrl || DEFAULT_WS_URL;
    this.jwt = options.jwt;
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.wsUrl);

        this.ws.onopen = () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;

          // Authenticate if JWT provided
          if (this.jwt) {
            this.send({ channel: 'auth', token: this.jwt });
          }

          // Resubscribe to all channels
          this.subscriptions.forEach((sub) => {
            this.send({ channel: sub.channel, symbol: sub.symbol });
          });

          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (e) {
            console.error('Failed to parse WebSocket message:', e);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          this.isConnected = false;
          this.handleDisconnect();
        };
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  async disconnect(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.subscriptions = [];
  }

  private send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private handleMessage(data: any): void {
    const { channel, symbol, data: payload } = data;

    // Find matching subscriptions
    const subs = this.subscriptions.filter((s) => s.channel === channel);
    subs.forEach((sub) => {
      if (sub.callback) {
        switch (channel) {
          case 'price':
            sub.callback(this.parseTicker(payload, symbol));
            break;
          case 'depth_book':
            sub.callback(this.parseOrderBook(payload, symbol));
            break;
          case 'public_trade':
            sub.callback(this.parseTrade(payload));
            break;
          case 'order':
            sub.callback(this.parseOrder(payload));
            break;
          case 'position':
            sub.callback(this.parsePosition(payload));
            break;
          case 'balance':
            sub.callback(this.parseBalance(payload));
            break;
        }
      }
    });
  }

  private handleDisconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... attempt ${this.reconnectAttempts}`);
      setTimeout(() => {
        this.connect().catch(console.error);
      }, this.reconnectDelay);
    }
  }

  private parseTicker(data: any, symbol: string): Ticker {
    return {
      symbol: symbol || data.symbol || '',
      lastPrice: data.last_price || data.price || '0',
      markPrice: data.mark_price || '0',
      indexPrice: data.index_price || '0',
      high24h: data.high_price_24h || '0',
      low24h: data.low_price_24h || '0',
      volume24h: data.volume_24h || '0',
      fundingRate: data.funding_rate || '0',
      nextFundingTime: data.next_funding_time || '',
    };
  }

  private parseOrderBook(data: any, symbol: string): OrderBook {
    return {
      symbol: symbol || data.symbol || '',
      bids: data.bids || [],
      asks: data.asks || [],
      timestamp: data.timestamp || String(Date.now()),
    };
  }

  private parseTrade(data: any): Trade {
    return {
      id: data.id || '',
      time: data.time || data.created_at || String(Date.now()),
      price: data.price || '0',
      qty: data.qty || data.quantity || '0',
      side: data.side || '',
    };
  }

  private parseOrder(data: any): Order {
    return {
      id: data.id || data.order_id || '',
      symbol: data.symbol || '',
      side: data.side === 'buy' ? 'buy' : 'sell',
      orderType: data.order_type || 'limit',
      qty: data.qty || '0',
      fillQty: data.fill_qty || '0',
      price: data.price || '0',
      status: data.status || 'new',
      createdAt: data.created_at || '',
    };
  }

  private parsePosition(data: any): Position {
    return {
      id: data.id || 0,
      symbol: data.symbol || '',
      side: data.side === 'buy' ? 'buy' : 'sell',
      qty: data.qty || '0',
      entryPrice: data.entry_price || '0',
      markPrice: data.mark_price || '0',
      leverage: data.leverage || '1',
      marginMode: data.margin_mode || 'cross',
      unrealizedPnl: data.upnl || '0',
      roe: data.roe || '0',
      liqPrice: data.liq_price,
      updatedAt: data.updated_at || '',
    };
  }

  private parseBalance(data: any): Balance {
    return {
      totalEquity: data.equity || '0',
      totalMargin: data.margin || '0',
      available: data.available || '0',
      pnl24h: data.pnl_24h || '0',
      wallets: (data.wallets || []).map((w: any) => ({
        asset: w.asset || 'USD',
        balance: w.balance || '0',
        available: w.available || '0',
        locked: w.locked || '0',
      })),
    };
  }

  // Public subscriptions

  subscribePrice(symbol: string, callback: PriceCallback): () => void {
    const sub: Subscription = { channel: 'price', symbol, callback };
    this.subscriptions.push(sub);

    if (this.isConnected) {
      this.send({ channel: 'price', symbol });
    }

    return () => {
      const idx = this.subscriptions.indexOf(sub);
      if (idx >= 0) this.subscriptions.splice(idx, 1);
      if (this.isConnected) {
        this.send({ channel: 'price', symbol, action: 'unsubscribe' });
      }
    };
  }

  subscribeDepth(symbol: string, callback: DepthCallback): () => void {
    const sub: Subscription = { channel: 'depth_book', symbol, callback };
    this.subscriptions.push(sub);

    if (this.isConnected) {
      this.send({ channel: 'depth_book', symbol });
    }

    return () => {
      const idx = this.subscriptions.indexOf(sub);
      if (idx >= 0) this.subscriptions.splice(idx, 1);
      if (this.isConnected) {
        this.send({ channel: 'depth_book', symbol, action: 'unsubscribe' });
      }
    };
  }

  subscribeTrade(symbol: string, callback: TradeCallback): () => void {
    const sub: Subscription = { channel: 'public_trade', symbol, callback };
    this.subscriptions.push(sub);

    if (this.isConnected) {
      this.send({ channel: 'public_trade', symbol });
    }

    return () => {
      const idx = this.subscriptions.indexOf(sub);
      if (idx >= 0) this.subscriptions.splice(idx, 1);
    };
  }

  // Private subscriptions (require auth)

  subscribeOrder(callback: OrderCallback): () => void {
    const sub: Subscription = { channel: 'order', callback };
    this.subscriptions.push(sub);

    if (this.isConnected && this.jwt) {
      this.send({ channel: 'order' });
    }

    return () => {
      const idx = this.subscriptions.indexOf(sub);
      if (idx >= 0) this.subscriptions.splice(idx, 1);
    };
  }

  subscribePosition(callback: PositionCallback): () => void {
    const sub: Subscription = { channel: 'position', callback };
    this.subscriptions.push(sub);

    if (this.isConnected && this.jwt) {
      this.send({ channel: 'position' });
    }

    return () => {
      const idx = this.subscriptions.indexOf(sub);
      if (idx >= 0) this.subscriptions.splice(idx, 1);
    };
  }

  subscribeBalance(callback: BalanceCallback): () => void {
    const sub: Subscription = { channel: 'balance', callback };
    this.subscriptions.push(sub);

    if (this.isConnected && this.jwt) {
      this.send({ channel: 'balance' });
    }

    return () => {
      const idx = this.subscriptions.indexOf(sub);
      if (idx >= 0) this.subscriptions.splice(idx, 1);
    };
  }

  subscribeFills(callback: TradeCallback): () => void {
    const sub: Subscription = { channel: 'trade', callback };
    this.subscriptions.push(sub);

    if (this.isConnected && this.jwt) {
      this.send({ channel: 'trade' });
    }

    return () => {
      const idx = this.subscriptions.indexOf(sub);
      if (idx >= 0) this.subscriptions.splice(idx, 1);
    };
  }
}