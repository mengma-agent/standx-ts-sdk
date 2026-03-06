# standx-sdk

StandX Exchange TypeScript SDK for Node.js and Browser

## Features

- Type-safe TypeScript SDK
- REST API coverage (Market, Account, Order)
- WebSocket real-time data
- JWT authentication
- Dual environment: Node.js 18+ and Browser

## Installation

```bash
npm install standx-sdk
# or
yarn add standx-sdk
# or
pnpm add standx-sdk
```

## Quick Start

```typescript
import { StandXClient } from 'standx-sdk';

const client = new StandXClient({
  privateKey: '0x...', // wallet private key
  // or use pre-generated JWT
  // jwt: 'eyJ...'
});

// Get market data
const ticker = await client.market.ticker('BTC-USD');
console.log(`BTC Price: ${ticker.lastPrice}`);

// Get account data
const positions = await client.account.positions();
console.log('Positions:', positions);

// Create order
const order = await client.order.create({
  symbol: 'BTC-USD',
  side: 'buy',
  orderType: 'limit',
  qty: '0.1',
  price: '67000',
});
console.log('Order created:', order.id);

// WebSocket real-time data
await client.ws.connect();
client.ws.subscribePrice('BTC-USD', (ticker) => {
  console.log('Price update:', ticker.lastPrice);
});
```

## API Reference

### MarketAPI

```typescript
// Ticker
await client.market.ticker(symbol: string): Promise<Ticker>
await client.market.tickers(): Promise<Ticker[]>

// Order Book
await client.market.depth(symbol: string, limit?: number): Promise<OrderBook>

// Trades
await client.market.trades(symbol: string, limit?: number): Promise<Trade[]>

// K-line
await client.market.kline(symbol: string, options?: {...}): Promise<Kline[]>

// Funding
await client.market.funding(symbol: string, limit?: number): Promise<FundingRate[]>
```

### AccountAPI

```typescript
await client.account.balances(): Promise<Balance>
await client.account.positions(symbol?: string): Promise<Position[]>
await client.account.orders(options?: {...}): Promise<Order[]>
await client.account.history(options?: {...}): Promise<Order[]>
```

### OrderAPI

```typescript
await client.order.create(params: CreateOrderParams): Promise<Order>
await client.order.cancel(orderId: string, symbol: string): Promise<Order>
await client.order.cancelAll(symbol?: string): Promise<{ cancelled: number }>
await client.order.getOrder(orderId: string, symbol: string): Promise<Order>
```

### WebSocketAPI

```typescript
await client.ws.connect(): Promise<void>
await client.ws.disconnect(): Promise<void>

// Public channels
const unsubscribe = client.ws.subscribePrice(symbol, callback)
const unsubscribe = client.ws.subscribeDepth(symbol, callback)
const unsubscribe = client.ws.subscribeTrade(symbol, callback)

// Private channels (require auth)
const unsubscribe = client.ws.subscribeOrder(callback)
const unsubscribe = client.ws.subscribePosition(callback)
const unsubscribe = client.ws.subscribeBalance(callback)
```

## TypeScript

This SDK is written in TypeScript and provides full type definitions.

## Browser Support

Works in modern browsers. For older browsers, use a polyfill for `fetch` and `WebSocket`.

## License

MIT