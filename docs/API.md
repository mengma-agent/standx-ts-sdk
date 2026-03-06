# standx-sdk API 参考文档

## 目录

- [MarketAPI](#marketapi)
- [AccountAPI](#accountapi)
- [OrderAPI](#orderapi)
- [WebSocketAPI](#websocketapi)
- [Auth](#auth)

---

## MarketAPI

市场数据接口，无需认证。

### ticker()

获取指定交易对的 ticker 数据。

```typescript
const ticker = await client.market.ticker('BTC-USD');
```

**参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| symbol | string | 是 | 交易对，如 BTC-USD |

**返回:**
```typescript
interface Ticker {
  symbol: string;           // 交易对
  lastPrice: string;       // 最新价格
  markPrice: string;       // 标记价格
  indexPrice: string;      // 指数价格
  high24h: string;         // 24小时最高
  low24h: string;          // 24小时最低
  volume24h: string;       // 24小时成交量
  fundingRate: string;     // 资金费率
  nextFundingTime: string; // 下次资金费时间
}
```

---

### tickers()

获取所有交易对的 ticker 数据。

```typescript
const tickers = await client.market.tickers();
```

**返回:** `Ticker[]`

---

### depth()

获取订单簿深度数据。

```typescript
const orderBook = await client.market.depth('BTC-USD', 20);
```

**参数:**
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| symbol | string | 是 | - | 交易对 |
| limit | number | 否 | 20 | 深度数量 (最大 100) |

**返回:**
```typescript
interface OrderBook {
  symbol: string;           // 交易对
  bids: [string, string][]; // 买单 [[价格, 数量], ...]
  asks: [string, string][]; // 卖单 [[价格, 数量], ...]
  timestamp: string;        // 时间戳
}
```

---

### trades()

获取近期成交记录。

```typescript
const trades = await client.market.trades('BTC-USD', 50);
```

**参数:**
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| symbol | string | 是 | - | 交易对 |
| limit | number | 否 | 50 | 数量限制 (最大 100) |

**返回:**
```typescript
interface Trade {
  id: string;      // 成交ID
  time: string;   // 时间
  price: string;  // 价格
  qty: string;    // 数量
  side: string;   // 方向 (buy/sell)
}
```

---

### kline()

获取 K 线数据。

```typescript
const klines = await client.market.kline('BTC-USD', {
  interval: '1m',
  limit: 100
});
```

**参数:**
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| symbol | string | 是 | - | 交易对 |
| options.interval | string | 否 | '1m' | K线周期 |
| options.startTime | number | 否 | - | 开始时间 (毫秒) |
| options.endTime | number | 否 | - | 结束时间 (毫秒) |
| options.limit | number | 否 | 100 | 数量限制 (最大 1000) |

**interval 可选值:** `1m`, `5m`, `15m`, `1h`, `4h`, `1d`

**返回:** `Kline[]`
```typescript
interface Kline {
  time: number;   // 时间戳
  open: string;  // 开盘价
  high: string;  // 最高价
  low: string;   // 最低价
  close: string; // 收盘价
  volume: string;// 成交量
}
```

---

### funding()

获取资金费率历史。

```typescript
const funding = await client.market.funding('BTC-USD', 10);
```

**参数:**
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| symbol | string | 是 | - | 交易对 |
| limit | number | 否 | 10 | 数量限制 |

**返回:**
```typescript
interface FundingRate {
  symbol: string;      // 交易对
  fundingRate: string; // 资金费率
  markPrice: string;   // 标记价格
  time: string;        // 时间
}
```

---

### symbols()

获取所有可交易的交易对。

```typescript
const symbols = await client.market.symbols();
```

**返回:**
```typescript
interface SymbolInfo {
  symbol: string;      // 交易对 BTC-USD
  baseAsset: string;   // 基础资产 BTC
  quoteAsset: string;  // 报价资产 USD
}
```

---

## AccountAPI

账户接口，需要认证。

### balances()

获取账户余额。

```typescript
const balance = await client.account.balances();
```

**返回:**
```typescript
interface Balance {
  totalEquity: string;    // 总权益
  totalMargin: string;    // 总保证金
  available: string;      // 可用保证金
  pnl24h: string;         // 24小时盈亏
  wallets: Wallet[];      // 钱包列表
}

interface Wallet {
  asset: string;    // 资产
  balance: string;  // 余额
  available: string; // 可用
  locked: string;   // 锁定
}
```

---

### positions()

获取持仓列表。

```typescript
const positions = await client.account.positions();
// 或指定交易对
const btcPosition = await client.account.positions('BTC-USD');
```

**参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| symbol | string | 否 | 交易对，不填返回所有 |

**返回:** `Position[]`
```typescript
interface Position {
  id: number;            // 持仓ID
  symbol: string;        // 交易对
  side: OrderSide;       // 方向 (buy=LONG, sell=SHORT)
  qty: string;           // 数量
  entryPrice: string;    // 开仓价格
  markPrice: string;     // 标记价格
  leverage: string;      // 杠杆倍数
  marginMode: MarginMode;// 保证金模式
  unrealizedPnl: string; // 未实现盈亏
  roe: string;           // 投资回报率 (%)
  liqPrice?: string;     // 强平价格
  updatedAt: string;    // 更新时间
}
```

---

### orders()

获取当前挂单。

```typescript
const orders = await client.account.orders();
// 或带筛选条件
const openOrders = await client.account.orders({
  symbol: 'BTC-USD',
  status: 'open',
  limit: 10
});
```

**参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| options.symbol | string | 否 | 交易对 |
| options.status | string | 否 | 状态 |
| options.limit | number | 否 | 数量限制 |

**status 可选值:** `new`, `partially_filled`, `filled`, `canceled`, `rejected`, `expired`

**返回:** `Order[]`

---

### history()

获取历史订单。

```typescript
const history = await client.account.history({
  symbol: 'BTC-USD',
  limit: 50
});
```

**参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| options.symbol | string | 否 | 交易对 |
| options.startTime | number | 否 | 开始时间 (毫秒) |
| options.endTime | number | 否 | 结束时间 (毫秒) |
| options.limit | number | 否 | 数量限制 |

**返回:** `Order[]`

---

## OrderAPI

订单接口，需要认证。

### create()

创建订单。

```typescript
// 限价单
const order = await client.order.create({
  symbol: 'BTC-USD',
  side: 'buy',
  orderType: 'limit',
  qty: '0.1',
  price: '67000',
  timeInForce: 'gtc'
});

// 市价单
const marketOrder = await client.order.create({
  symbol: 'BTC-USD',
  side: 'buy',
  orderType: 'market',
  qty: '0.1'
});

// 带止盈止损
const orderWithTP = await client.order.create({
  symbol: 'BTC-USD',
  side: 'buy',
  orderType: 'limit',
  qty: '0.1',
  price: '67000',
  tpPrice: '68000',  // 止盈
  slPrice: '66000'   // 止损
});
```

**参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| symbol | string | 是 | 交易对 |
| side | string | 是 | 方向 (buy/sell) |
| orderType | string | 是 | 类型 (limit/market) |
| qty | string | 是 | 数量 |
| price | string | 限价单必填 | 价格 |
| timeInForce | string | 否 | 有效期 (gtc/ioc/fok) |
| tpPrice | string | 否 | 止盈价格 |
| slPrice | string | 否 | 止损价格 |

**timeInForce 可选值:**
- `gtc` - Good Till Cancel (成交为止)
- `ioc` - Immediate or Cancel (立即成交，否则取消)
- `fok` - Fill or Kill (全部成交，否则取消)

**返回:**
```typescript
interface Order {
  id: string;         // 订单ID
  symbol: string;    // 交易对
  side: OrderSide;   // 方向
  orderType: OrderType; // 类型
  qty: string;       // 委托数量
  fillQty: string;   // 已成交数量
  price: string;    // 价格
  status: OrderStatus; // 状态
  createdAt: string; // 创建时间
}
```

---

### cancel()

取消订单。

```typescript
await client.order.cancel('order_123456', 'BTC-USD');
```

**参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| orderId | string | 是 | 订单ID |
| symbol | string | 是 | 交易对 |

**返回:** `Order` (status = 'canceled')

---

### cancelAll()

取消所有挂单。

```typescript
// 取消指定交易对所有挂单
await client.order.cancelAll('BTC-USD');

// 取消所有挂单
await client.cancelAll();
```

**参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| symbol | string | 否 | 交易对，不填取消所有 |

**返回:**
```typescript
{
  cancelled: number;  // 取消数量
}
```

---

### getOrder()

查询订单详情。

```typescript
const order = await client.order.getOrder('order_123456', 'BTC-USD');
```

**参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| orderId | string | 是 | 订单ID |
| symbol | string | 是 | 交易对 |

**返回:** `Order`

---

## WebSocketAPI

WebSocket 实时数据接口。

### connect()

建立 WebSocket 连接。

```typescript
await client.ws.connect();
```

---

### disconnect()

断开连接。

```typescript
await client.ws.disconnect();
```

---

### subscribePrice()

订阅价格实时更新。

```typescript
// 订阅
const unsubscribe = client.ws.subscribePrice('BTC-USD', (ticker) => {
  console.log('价格更新:', ticker.lastPrice);
});

// 取消订阅
unsubscribe();
```

**参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| symbol | string | 是 | 交易对 |
| callback | function | 是 | 回调函数 |

**回调参数:**
```typescript
(data: Ticker) => void
```

---

### subscribeDepth()

订阅订单簿实时更新。

```typescript
const unsubscribe = client.ws.subscribeDepth('BTC-USD', (orderBook) => {
  console.log('买单:', orderBook.bids);
  console.log('卖单:', orderBook.asks);
});
```

**回调参数:**
```typescript
(data: OrderBook) => void
```

---

### subscribeTrade()

订阅成交实时推送。

```typescript
const unsubscribe = client.ws.subscribeTrade('BTC-USD', (trade) => {
  console.log('最新成交:', trade.price, trade.qty);
});
```

**回调参数:**
```typescript
(data: Trade) => void
```

---

### subscribeOrder() (需要认证)

订阅订单更新。

```typescript
await client.ws.connect();
const unsubscribe = client.ws.subscribeOrder((order) => {
  console.log('订单更新:', order.status);
});
```

---

### subscribePosition() (需要认证)

订阅持仓更新。

```typescript
const unsubscribe = client.ws.subscribePosition((position) => {
  console.log('持仓更新:', position.qty, position.unrealizedPnl);
});
```

---

### subscribeBalance() (需要认证)

订阅余额更新。

```typescript
const unsubscribe = client.ws.subscribeBalance((balance) => {
  console.log('余额更新:', balance.available);
});
```

---

## Auth

认证工具类。

### generateJwt()

生成 JWT Token。

```typescript
import { Auth } from 'standx-sdk';

const jwt = Auth.generateJwt(
  '0x...',           // 私钥
  '0x...',           // 钱包地址
  {
    permissions: ['trade', 'view'],  // 权限
    expiryDays: 7                    // 过期天数
  }
);
```

**参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| privateKey | string | 是 | 钱包私钥 |
| walletAddress | string | 是 | 钱包地址 |
| options.permissions | string[] | 否 | 权限列表 |
| options.expiryDays | number | 否 | 过期天数 |

**返回:** `string` (JWT Token)

---

### verifyJwt()

验证 JWT Token。

```typescript
const isValid = Auth.verifyJwt(token);
console.log('Token 有效:', isValid);
```

**参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| token | string | 是 | JWT Token |

**返回:** `boolean`

---

### getWalletAddress()

从私钥获取钱包地址。

```typescript
const address = Auth.getWalletAddress('0x...');
console.log('钱包地址:', address);
```

**参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| privateKey | string | 是 | 钱包私钥 |

**返回:** `string` (钱包地址)
