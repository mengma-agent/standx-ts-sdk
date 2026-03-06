# WebSocket 使用指南

## 目录

- [概述](#概述)
- [连接管理](#连接管理)
- [订阅频道](#订阅频道)
- [公开频道](#公开频道)
- [私有频道](#私有频道)
- [消息格式](#消息格式)
- [示例代码](#示例代码)
- [最佳实践](#最佳实践)

---

## 概述

WebSocket 提供实时数据推送，包括：
- 价格更新
- 订单簿变化
- 成交记录
- 订单状态更新
- 持仓变化
- 余额变化

---

## 连接管理

### 建立连接

```typescript
await client.ws.connect();
console.log('WebSocket 已连接');
```

### 断开连接

```typescript
await client.ws.disconnect();
console.log('WebSocket 已断开');
```

### 自动重连

SDK 内置自动重连机制：
- 最多重连 3 次
- 每次重连间隔 3 秒
- 重连后会重新订阅所有频道

```typescript
// 自定义重连配置 (如有需要)
const ws = new WebSocketAPI({
  wsUrl: 'wss://perps.standx.com/ws-stream/v1',
  jwt: token
});
```

---

## 订阅频道

### 订阅

```typescript
// 订阅价格更新
const unsubPrice = client.ws.subscribePrice('BTC-USD', (data) => {
  console.log(data.lastPrice);
});

//订单簿
const 订阅 unsubDepth = client.ws.subscribeDepth('BTC-USD', (data) => {
  console.log(data.bids, data.asks);
});
```

### 取消订阅

```typescript
// 调用订阅返回的函数
unsubPrice();
unsubDepth();
```

**注意：** 取消订阅是异步的，调用后几个消息周期内可能还会收到推送。

---

## 公开频道

公开频道无需认证即可使用。

### 价格订阅

```typescript
client.ws.subscribePrice('BTC-USD', (ticker) => {
  console.log(`
    交易对: ${ticker.symbol}
    最新价: ${ticker.lastPrice}
    标记价: ${ticker.markPrice}
    24h最高: ${ticker.high24h}
    24h最低: ${ticker.low24h}
    资金费率: ${ticker.fundingRate}
  `);
});
```

### 订单簿订阅

```typescript
client.ws.subscribeDepth('BTC-USD', (orderBook) => {
  const bestBid = orderBook.bids[0];
  const bestAsk = orderBook.asks[0];
  
  console.log(`
    最佳买价: ${bestBid[0]} (${bestBid[1]})
    最佳卖价: ${bestAsk[0]} (${bestAsk[1]})
  `);
});
```

### 成交订阅

```typescript
client.ws.subscribeTrade('BTC-USD', (trade) => {
  console.log(`
    时间: ${trade.time}
    价格: ${trade.price}
    数量: ${trade.qty}
    方向: ${trade.side}
  `);
});
```

---

## 私有频道

私有频道需要认证（初始化时传入 jwt 或 privateKey）。

### 订单更新

```typescript
// 确保已连接且已认证
await client.ws.connect();

client.ws.subscribeOrder((order) => {
  console.log(`
    订单ID: ${order.id}
    状态: ${order.status}
    成交数量: ${order.fillQty}
  `);
});
```

### 持仓更新

```typescript
client.ws.subscribePosition((position) => {
  console.log(`
    交易对: ${position.symbol}
    方向: ${position.side}
    数量: ${position.qty}
    未实现盈亏: ${position.unrealizedPnl}
    盈亏率: ${position.roe}%
  `);
});
```

### 余额更新

```typescript
client.ws.subscribeBalance((balance) => {
  console.log(`
    总权益: ${balance.totalEquity}
    可用保证金: ${balance.available}
    24h盈亏: ${balance.pnl24h}
  `);
});
```

### 成交记录

```typescript
client.ws.subscribeFills((fill) => {
  console.log(`
    时间: ${fill.time}
    价格: ${fill.price}
    数量: ${fill.qty}
    方向: ${fill.side}
  `);
});
```

---

## 消息格式

### 订阅消息

```typescript
// 订阅
{ "channel": "price", "symbol": "BTC-USD" }

// 取消订阅
{ "channel": "price", "symbol": "BTC-USD", "action": "unsubscribe" }
```

### 推送消息

```typescript
// 价格推送
{
  "channel": "price",
  "symbol": "BTC-USD",
  "data": {
    "last_price": "67000.00",
    "mark_price": "67000.00",
    "index_price": "66980.00",
    "high_price_24h": "68000.00",
    "low_price_24h": "66000.00",
    "volume_24h": "12345.67",
    "funding_rate": "0.0001"
  }
}

// 订单簿推送
{
  "channel": "depth_book",
  "symbol": "BTC-USD",
  "data": {
    "bids": [["67000", "1.5"], ["66999", "2.0"]],
    "asks": [["67001", "1.0"], ["67002", "2.5"]],
    "timestamp": "1704067200000"
  }
}
```

---

## 示例代码

### 完整示例

```typescript
import { StandXClient } from 'standx-sdk';

async function main() {
  // 初始化客户端
  const client = new StandXClient({
    privateKey: process.env.PRIVATE_KEY
  });

  // 连接 WebSocket
  await client.ws.connect();
  console.log('已连接');

  // 订阅多个频道
  const unsubPrice = client.ws.subscribePrice('BTC-USD', (t) => {
    console.log('BTC:', t.lastPrice);
  });

  const unsubETH = client.ws.subscribePrice('ETH-USD', (t) => {
    console.log('ETH:', t.lastPrice);
  });

  const unsubOrder = client.ws.subscribeOrder((o) => {
    console.log('订单状态:', o.status);
  });

  const unsubPosition = client.ws.subscribePosition((p) => {
    console.log('持仓更新:', p.qty, p.unrealizedPnl);
  });

  // 保持连接 60 秒
  await new Promise(r => setTimeout(r, 60000));

  // 取消订阅
  unsubPrice();
  unsubETH();
  unsubOrder();
  unsubPosition();

  // 断开连接
  await client.ws.disconnect();
}

main().catch(console.error);
```

### 多交易对监控

```typescript
const symbols = ['BTC-USD', 'ETH-USD', 'SOL-USD'];

for (const symbol of symbols) {
  client.ws.subscribePrice(symbol, (ticker) => {
    console.log(`${symbol}: ${ticker.lastPrice}`);
  });
}
```

### 价格提醒

```typescript
client.ws.subscribePrice('BTC-USD', (ticker) => {
  const price = parseFloat(ticker.lastPrice);
  
  if (price >= 70000) {
    console.log('🚨 BTC 突破 70000!');
  } else if (price <= 60000) {
    console.log('📉 BTC 跌破 60000!');
  }
});
```

---

## 最佳实践

### 1. 正确处理连接

```typescript
async function withReconnect() {
  try {
    await client.ws.connect();
  } catch (e) {
    console.error('连接失败:', e);
    // 实现自定义重连逻辑
    setTimeout(withReconnect, 5000);
  }
}
```

### 2. 避免内存泄漏

```typescript
// 组件卸载时取消订阅
onUnmount(() => {
  unsubPrice();
  unsubDepth();
  client.ws.disconnect();
});
```

### 3. 批量订阅

```typescript
// 推荐：先连接再订阅
await client.ws.connect();

// 一次性订阅多个
['BTC-USD', 'ETH-USD'].forEach(symbol => {
  client.ws.subscribePrice(symbol, handlePrice);
});
```

### 4. 错误处理

```typescript
client.ws.subscribePrice('BTC-USD', (ticker) => {
  try {
    // 处理数据
    processPrice(ticker);
  } catch (e) {
    console.error('处理价格数据失败:', e);
  }
});
```

### 5. 限流处理

如果推送频率过高，可以考虑节流：

```typescript
import { throttle } from 'lodash';

const handlePrice = throttle((ticker) => {
  updateUI(ticker);
}, 1000); // 最多每秒更新一次

client.ws.subscribePrice('BTC-USD', handlePrice);
```
