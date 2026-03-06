# 快速开始

## 环境要求

- Node.js 18.0.0 或更高版本
- 或现代浏览器 (Chrome 100+, Firefox 100+, Safari 15+)

## 安装

```bash
npm install standx-sdk
```

## 第一个示例

### 1. 初始化客户端

```typescript
import { StandXClient } from 'standx-sdk';

// 方式一：使用私钥
const client = new StandXClient({
  privateKey: '0xyour-private-key...'
});

// 方式二：使用 JWT
const client = new StandXClient({
  jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
});
```

### 2. 获取市场数据

```typescript
async function getPrice() {
  // 获取单个交易对价格
  const btc = await client.market.ticker('BTC-USD');
  console.log(`BTC: $${btc.lastPrice}`);

  // 获取所有交易对价格
  const all = await client.market.tickers();
  all.forEach(t => console.log(`${t.symbol}: $${t.lastPrice}`));
}

getPrice();
```

### 3. 查看账户

```typescript
async function checkAccount() {
  // 余额
  const bal = await client.account.balances();
  console.log(`权益: $${bal.totalEquity}`);
  console.log(`可用: $${bal.available}`);

  // 持仓
  const pos = await client.account.positions();
  pos.forEach(p => {
    console.log(`${p.symbol} ${p.side} ${p.qty} @ ${p.entryPrice}`);
  });
}
```

### 4. 下单

```typescript
async function trade() {
  // 限价单
  const order = await client.order.create({
    symbol: 'BTC-USD',
    side: 'buy',
    orderType: 'limit',
    qty: '0.01',
    price: '65000',
    timeInForce: 'gtc'
  });

  console.log('订单ID:', order.id);
  console.log('状态:', order.status);
}
```

### 5. WebSocket 实时数据

```typescript
async function realtime() {
  // 连接
  await client.ws.connect();

  // 订阅价格
  const unsub = client.ws.subscribePrice('BTC-USD', (ticker) => {
    console.log('最新价:', ticker.lastPrice);
  });

  // 60秒后取消订阅
  setTimeout(() => {
    unsub();
    client.ws.disconnect();
  }, 60000);
}
```

---

## 完整示例：交易机器人

```typescript
import { StandXClient } from 'standx-sdk';

const client = new StandXClient({
  privateKey: process.env.PRIVATE_KEY!
});

async function bot() {
  const SYMBOL = 'BTC-USD';
  const PRICE_ALERT = 70000;

  // 1. 连接 WebSocket
  await client.ws.connect();

  // 2. 订阅价格
  client.ws.subscribePrice(SYMBOL, async (ticker) => {
    const price = parseFloat(ticker.lastPrice);

    console.log(`当前价格: $${price}`);

    // 3. 价格达到目标时下单
    if (price >= PRICE_ALERT) {
      console.log('价格达到目标，下单!');

      try {
        const order = await client.order.create({
          symbol: SYMBOL,
          side: 'sell',
          orderType: 'market',
          qty: '0.01'
        });

        console.log('订单完成:', order.status);
      } catch (e) {
        console.error('下单失败:', e);
      }
    }
  });

  // 4. 订阅持仓更新
  client.ws.subscribePosition((pos) => {
    if (pos.symbol === SYMBOL) {
      console.log(`持仓更新: ${pos.side} ${pos.qty} @ ${pos.entryPrice}`);
      console.log(`未实现盈亏: $${pos.unrealizedPnl}`);
    }
  });
}

bot().catch(console.error);
```

---

## 常见问题

### Q: 如何获取私钥？

```typescript
// 从环境变量
const privateKey = process.env.WALLET_PRIVATE_KEY;

// 或使用钱包
import { Wallet } from 'ethers';
const wallet = Wallet.createRandom();
const privateKey = wallet.privateKey;
```

### Q: 需要测试网吗？

```typescript
// 使用测试网 API
const client = new StandXClient({
  privateKey: '...',
  apiUrl: 'https://testnet.standx.com',
  wsUrl: 'wss://testnet.standx.com/ws'
});
```

### Q: 如何处理错误？

```typescript
try {
  const order = await client.order.create({...});
} catch (e: any) {
  if (e.message.includes('401')) {
    console.log('认证失败，请检查 Token');
  } else if (e.message.includes('balance')) {
    console.log('余额不足');
  } else {
    console.error('下单失败:', e.message);
  }
}
```

### Q: 如何优雅退出？

```typescript
async function shutdown() {
  console.log('正在关闭...');
  await client.ws.disconnect();
  await client.close();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
```

---

## 下一步

- 阅读 [API 参考](./API.md) 了解完整 API
- 阅读 [认证指南](./AUTH.md) 了解安全最佳实践
- 阅读 [WebSocket 指南](./WEBSOCKET.md) 了解实时数据
- 阅读 [测试指南](./TEST.md) 了解如何测试
