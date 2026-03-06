# standx-sdk

StandX Exchange TypeScript SDK for Node.js and Browser

[![npm version](https://img.shields.io/npm/v/standx-sdk)](https://www.npmjs.com/package/standx-sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

## 特性

- 🌙 **类型安全** - 完整的 TypeScript 类型定义
- 🔄 **双环境** - 支持 Node.js 18+ 和浏览器
- ⚡ **高性能** - 原生 async/await，WebSocket 实时推送
- 🔌 **完整 API** - REST API + WebSocket 全覆盖
- 🧩 **模块化** - 按需导入，Tree-shaking 友好

## 安装

```bash
npm install standx-sdk
# 或
yarn add standx-sdk
# 或
pnpm add standx-sdk
```

## 快速开始

```typescript
import { StandXClient } from 'standx-sdk';

const client = new StandXClient({
  privateKey: '0x...', // 钱包私钥
  // 或使用预生成的 JWT
  // jwt: 'eyJ...'
});

async function main() {
  // 市场数据 (无需认证)
  const ticker = await client.market.ticker('BTC-USD');
  console.log(`BTC 价格: ${ticker.lastPrice}`);

  // 账户数据 (需要认证)
  const positions = await client.account.positions();
  console.log('持仓:', positions);

  // 创建订单 (需要认证)
  const order = await client.order.create({
    symbol: 'BTC-USD',
    side: 'buy',
    orderType: 'limit',
    qty: '0.1',
    price: '67000'
  });
  console.log('订单已创建:', order.id);

  // WebSocket 实时数据
  await client.ws.connect();
  client.ws.subscribePrice('BTC-USD', (ticker) => {
    console.log('价格更新:', ticker.lastPrice);
  });
}

main();
```

## 文档

- [快速开始](./docs/QUICKSTART.md)
- [API 参考](./docs/API.md)
- [认证指南](./docs/AUTH.md)
- [WebSocket 使用指南](./docs/WEBSOCKET.md)
- [测试指南](./docs/TEST.md)
- [设计文档](./docs/DESIGN.md)

## API 概览

### MarketAPI (无需认证)

```typescript
// 价格
await client.market.ticker('BTC-USD');
await client.market.tickers();

// 订单簿
await client.market.depth('BTC-USD', 20);

// 成交
await client.market.trades('BTC-USD');

// K线
await client.market.kline('BTC-USD', { interval: '1m' });

// 资金费率
await client.market.funding('BTC-USD');
```

### AccountAPI (需要认证)

```typescript
// 余额
await client.account.balances();

// 持仓
await client.account.positions();
await client.account.positions('BTC-USD');

// 订单
await client.account.orders();
await client.account.history();
```

### OrderAPI (需要认证)

```typescript
// 创建订单
await client.order.create({
  symbol: 'BTC-USD',
  side: 'buy',
  orderType: 'limit',
  qty: '0.1',
  price: '67000'
});

// 取消订单
await client.order.cancel('order_123', 'BTC-USD');
await client.order.cancelAll('BTC-USD');
```

### WebSocketAPI

```typescript
await client.ws.connect();

// 公开频道
client.ws.subscribePrice('BTC-USD', callback);
client.ws.subscribeDepth('BTC-USD', callback);
client.ws.subscribeTrade('BTC-USD', callback);

// 私有频道 (需要认证)
client.ws.subscribeOrder(callback);
client.ws.subscribePosition(callback);
client.ws.subscribeBalance(callback);
```

## 类型定义

SDK 提供完整的 TypeScript 类型：

```typescript
import type {
  Ticker,
  OrderBook,
  Position,
  Order,
  Balance,
  Kline,
  Trade
} from 'standx-sdk';
```

## 浏览器支持

Works in modern browsers. For older browsers, use a polyfill for `fetch` and `WebSocket`.

```html
<script type="module">
  import { StandXClient } from 'https://esm.sh/standx-sdk';
  
  const client = new StandXClient({ jwt: '...' });
</script>
```

## License

MIT
