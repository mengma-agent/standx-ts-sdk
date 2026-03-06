# standx-typescript-sdk 设计文档 & 测试验收文档

---

## 一、设计文档

### 1.1 项目概述

| 项目 | 内容 |
|------|------|
| **项目名称** | standx-typescript-sdk |
| **目标用户** | 前端开发者、Node.js 开发者、AI Agent |
| **TypeScript 版本** | 4.7+ |
| **运行环境** | Node.js 18+, Browser (ESM) |
| **许可证** | MIT |

### 1.2 特性

- **类型安全** - 完整的 TypeScript 类型定义
- **双环境** - 支持 Node.js 和浏览器
- **高性能** - 原生 async/await，WebSocket 连接池
- **完整 API** - REST + WebSocket 全覆盖
- **模块化** - 按需导入，Tree-shaking 友好

### 1.3 安装

```bash
npm install standx-sdk
# 或
yarn add standx-sdk
# 或
pnpm add standx-sdk
```

### 1.4 快速开始

```typescript
import { StandXClient } from 'standx-sdk';

const client = new StandXClient({
  privateKey: '0x...',
  // 或使用预生成的 JWT
  // jwt: 'eyJ...'
});

async function main() {
  // 市场数据
  const ticker = await client.market.ticker('BTC-USD');
  console.log(`BTC 价格: ${ticker.lastPrice}`);

  // 账户数据
  const positions = await client.account.positions();
  console.log('持仓:', positions);

  // 下单
  const order = await client.order.create({
    symbol: 'BTC-USD',
    side: 'buy',
    orderType: 'limit',
    qty: '0.1',
    price: '67000'
  });
  console.log('订单已创建:', order.id);
}

main();
```

---

## 二、API 设计

### 2.1 基础类型

```typescript
type OrderSide = 'buy' | 'sell';
type OrderType = 'limit' | 'market';
type TimeInForce = 'gtc' | 'ioc' | 'fok';
type MarginMode = 'cross' | 'isolated';
type OrderStatus = 'new' | 'partially_filled' | 'filled' | 'canceled' | 'rejected' | 'expired';
```

### 2.2 数据类型

```typescript
interface Ticker {
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

interface OrderBook {
  symbol: string;
  bids: [string, string][];
  asks: [string, string][];
  timestamp: string;
}

interface Kline {
  time: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

interface Position {
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

interface Order {
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

interface Balance {
  totalEquity: string;
  totalMargin: string;
  available: string;
  pnl24h: string;
  wallets: {
    asset: string;
    balance: string;
    available: string;
    locked: string;
  }[];
}
```

### 2.3 StandXClient

```typescript
interface ClientOptions {
  privateKey?: string;
  jwt?: string;
  apiUrl?: string;
  wsUrl?: string;
  timeout?: number;
  verbose?: boolean;
}

class StandXClient {
  constructor(options: ClientOptions);
  market: MarketAPI;
  account: AccountAPI;
  order: OrderAPI;
  leverage: LeverageAPI;
  margin: MarginAPI;
  ws: WebSocketAPI;
  close(): Promise<void>;
}
```

### 2.4 MarketAPI

```typescript
class MarketAPI {
  ticker(symbol: string): Promise<Ticker>;
  tickers(): Promise<Ticker[]>;
  depth(symbol: string, limit?: number): Promise<OrderBook>;
  trades(symbol: string, limit?: number): Promise<any[]>;
  kline(symbol: string, options?: {
    interval?: '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
    startTime?: number;
    endTime?: number;
    limit?: number;
  }): Promise<Kline[]>;
  funding(symbol: string, limit?: number): Promise<any[]>;
  symbols(): Promise<any[]>;
}
```

### 2.5 AccountAPI

```typescript
class AccountAPI {
  balances(): Promise<Balance>;
  positions(symbol?: string): Promise<Position[]>;
  orders(options?: {
    symbol?: string;
    status?: OrderStatus;
    limit?: number;
  }): Promise<Order[]>;
  history(options?: any): Promise<Order[]>;
}
```

### 2.6 OrderAPI

```typescript
interface CreateOrderParams {
  symbol: string;
  side: OrderSide;
  orderType: OrderType;
  qty: string;
  price?: string;
  timeInForce?: TimeInForce;
  tpPrice?: string;
  slPrice?: string;
}

class OrderAPI {
  create(params: CreateOrderParams): Promise<Order>;
  cancel(orderId: string, symbol: string): Promise<Order>;
  cancelAll(symbol?: string): Promise<{ cancelled: number }>;
  getOrder(orderId: string, symbol: string): Promise<Order>;
}
```

### 2.7 WebSocketAPI

```typescript
type PriceCallback = (data: Ticker) => void;
type DepthCallback = (data: OrderBook) => void;

class WebSocketAPI {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  subscribePrice(symbol: string, callback: PriceCallback): () => void;
  subscribeDepth(symbol: string, callback: DepthCallback): () => void;
  subscribeTrade(symbol: string, callback: any): () => void;
  subscribeOrder(callback: any): () => void;
  subscribePosition(callback: any): () => void;
  subscribeBalance(callback: any): () => void;
  subscribeFills(callback: any): () => void;
}
```

### 2.8 Auth

```typescript
class Auth {
  static generateJwt(
    privateKey: string,
    walletAddress: string,
    options?: {
      permissions?: string[];
      expiryDays?: number;
    }
  ): string;
  static verifyJwt(token: string): boolean;
}
```

---

## 三、测试验收文档

### 3.1 测试环境

| 环境 | 配置 |
|------|------|
| Node.js | 18.x, 20.x, 22.x |
| 浏览器 | Chrome 100+, Firefox 100+, Safari 15+ |
| 测试网络 | StandX Testnet |

### 3.2 单元测试

| 模块 | 测试项 | 预期结果 |
|------|--------|----------|
| Auth | generateJwt() 生成签名 | JWT 字符串有效 |
| Auth | verifyJwt() 验证签名 | true/false 正确 |
| MarketAPI | ticker() 返回数据 | 包含 lastPrice, markPrice |
| MarketAPI | depth() 订单簿 | bids/asks 数组格式正确 |
| MarketAPI | kline() K线数据 | open/high/low/close/volume |
| AccountAPI | positions() 持仓结构 | 包含 qty, entryPrice, unrealizedPnl |
| AccountAPI | balances() 余额结构 | 包含 equity, available |
| OrderAPI | create() 限价单 | 返回 id, status=new |
| OrderAPI | create() 市价单 | 返回 id, status=filled |
| OrderAPI | cancel() 取消订单 | status=canceled |
| WebSocket | connect() 连接 | ws.connected = true |
| WebSocket | subscribePrice() 推送 | callback 收到数据 |

### 3.3 集成测试

| 场景 | 步骤 | 验收标准 |
|------|------|----------|
| 完整交易 | 1. ticker 2. create order 3. query order 4. cancel | 订单状态正确 |
| 持仓操作 | 1. 开多仓 2. 查询持仓 3. 平仓 | 持仓数量正确 |
| WebSocket实时 | 1. 连接 2. 订阅 3. 等待成交推送 | 实时数据正确 |
| 认证过期 | 使用过期 jwt 调用 API | 抛出 AuthExpiredError |

### 3.4 验收标准

| 功能 | 条件 |
|------|------|
| 初始化 | 私钥或 JWT 可正常初始化 |
| 市场数据 | ticker/depth/trades/kline 全部返回正确 |
| 账户 | positions/balances/orders 全部正常 |
| 订单 | create/cancel/cancelAll 全部正常 |
| WebSocket | price/depth/trade 订阅正常 |
| 认证 | JWT 生成和验证正确 |

### 3.5 性能验收

| 指标 | 目标 |
|------|------|
| API 响应时间 | < 1 秒 |
| WebSocket 延迟 | < 500ms |
| SDK 启动时间 | < 2 秒 |
| 内存占用 | < 50MB (空闲) |

### 3.6 错误处理验收

| 场景 | 预期行为 |
|------|----------|
| 网络超时 | 抛出 TimeoutError |
| 认证失败 | 抛出 AuthError |
| 订单失败 | 抛出 OrderError 并包含原因 |
| WebSocket 断开 | 自动重连 (最多 3 次) |
| 限价单价格无效 | 抛出 ValidationError |

---

## 四、发布计划

| 版本 | 功能 | 状态 |
|------|------|------|
| 0.1.0 | MVP - 基础 REST API | ✅ Done |
| 0.2.0 | WebSocket 支持 | Todo |
| 0.3.0 | 策略模板 (网格) | Todo |
| 1.0.0 | 正式版 | Todo |
