// Basic types
export type OrderSide = 'buy' | 'sell';
export type OrderType = 'limit' | 'market';
export type TimeInForce = 'gtc' | 'ioc' | 'fok';
export type MarginMode = 'cross' | 'isolated';
export type OrderStatus = 'new' | 'partially_filled' | 'filled' | 'canceled' | 'rejected' | 'expired';

export interface ClientOptions {
  privateKey?: string;
  jwt?: string;
  apiUrl?: string;
  wsUrl?: string;
  timeout?: number;
  verbose?: boolean;
}

export interface Ticker {
  symbol: string;
  lastPrice: string;
  markPrice: string;
  indexPrice: string;
  high24h: string;
  low24h: string;
  volume24h: string;
  fundingRate: string;
  nextFundingTime: string;
}

export interface OrderBook {
  symbol: string;
  bids: [string, string][];
  asks: [string, string][];
  timestamp: string;
}

export interface Trade {
  id: string;
  time: string;
  price: string;
  qty: string;
  side: string;
}

export interface Kline {
  time: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

export interface Position {
  id: number;
  symbol: string;
  side: OrderSide;
  qty: string;
  entryPrice: string;
  markPrice: string;
  leverage: string;
  marginMode: MarginMode;
  unrealizedPnl: string;
  roe: string;
  liqPrice?: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  symbol: string;
  side: OrderSide;
  orderType: OrderType;
  qty: string;
  fillQty: string;
  price: string;
  status: OrderStatus;
  createdAt: string;
}

export interface Balance {
  totalEquity: string;
  totalMargin: string;
  available: string;
  pnl24h: string;
  wallets: Wallet[];
}

export interface Wallet {
  asset: string;
  balance: string;
  available: string;
  locked: string;
}

export interface CreateOrderParams {
  symbol: string;
  side: OrderSide;
  orderType: OrderType;
  qty: string;
  price?: string;
  timeInForce?: TimeInForce;
  tpPrice?: string;
  slPrice?: string;
}

export interface SymbolInfo {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
}

export interface FundingRate {
  symbol: string;
  fundingRate: string;
  markPrice: string;
  time: string;
}