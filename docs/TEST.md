# 测试指南

## 目录

- [测试环境](#测试环境)
- [单元测试](#单元测试)
- [集成测试](#集成测试)
- [E2E 测试](#e2e-测试)
- [测试覆盖率](#测试覆盖率)
- [Mock 数据](#mock-数据)
- [CI/CD](#cicd)

---

## 测试环境

### 环境要求

| 环境 | 版本 |
|------|------|
| Node.js | 18.x, 20.x, 22.x |
| npm | 9.x+ |
| TypeScript | 5.3+ |

### 安装测试依赖

```bash
npm install
```

### 运行测试

```bash
# 运行所有测试
npm test

# 监听模式
npm run test:watch

# 覆盖率
npm run test:coverage
```

---

## 单元测试

### 测试 Auth 模块

```typescript
// tests/auth.test.ts
import { describe, it, expect } from 'vitest';
import { Auth } from '../src/auth';

describe('Auth', () => {
  const TEST_PRIVATE_KEY = '0xtest...';
  const TEST_WALLET = '0xwallet...';

  describe('generateJwt', () => {
    it('should generate valid JWT token', () => {
      const token = Auth.generateJwt(TEST_PRIVATE_KEY, TEST_WALLET);
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include correct payload', () => {
      const token = Auth.generateJwt(TEST_PRIVATE_KEY, TEST_WALLET, {
        permissions: ['trade', 'view'],
        expiryDays: 7
      });

      const payload = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64').toString()
      );

      expect(payload.sub).toBe(TEST_WALLET);
      expect(payload.permissions).toContain('trade');
      expect(payload.permissions).toContain('view');
    });

    it('should respect expiry days', () => {
      const token = Auth.generateJwt(TEST_PRIVATE_KEY, TEST_WALLET, {
        expiryDays: 30
      });

      const payload = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64').toString()
      );

      const expectedExp = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
      expect(payload.exp).toBeCloseTo(expectedExp, -2);
    });
  });

  describe('verifyJwt', () => {
    it('should return true for valid token', () => {
      const token = Auth.generateJwt(TEST_PRIVATE_KEY, TEST_WALLET);
      expect(Auth.verifyJwt(token)).toBe(true);
    });

    it('should return false for expired token', () => {
      // Create expired token manually
      const payload = {
        sub: TEST_WALLET,
        exp: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
      };
      const token = Buffer.from(JSON.stringify(payload)).toString('base64') + '.sig';

      expect(Auth.verifyJwt(token)).toBe(false);
    });

    it('should return false for invalid token', () => {
      expect(Auth.verifyJwt('invalid-token')).toBe(false);
    });
  });

  describe('getWalletAddress', () => {
    it('should return correct wallet address', () => {
      const address = Auth.getWalletAddress(TEST_PRIVATE_KEY);
      expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });
  });
});
```

### 测试 MarketAPI

```typescript
// tests/market.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MarketAPI } from '../src/market';

// Mock fetch
global.fetch = vi.fn();

describe('MarketAPI', () => {
  let marketAPI: MarketAPI;

  beforeEach(() => {
    marketAPI = new MarketAPI({ baseUrl: 'https://test.standx.com' });
    vi.clearAllMocks();
  });

  describe('ticker', () => {
    it('should return ticker data', async () => {
      const mockResponse = {
        symbol: 'BTC-USD',
        last_price: '67000',
        mark_price: '67000',
        index_price: '66980',
        high_price_24h: '68000',
        low_price_24h: '66000',
        volume_24h: '12345',
        funding_rate: '0.0001'
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const ticker = await marketAPI.ticker('BTC-USD');

      expect(ticker.symbol).toBe('BTC-USD');
      expect(ticker.lastPrice).toBe('67000');
      expect(ticker.markPrice).toBe('67000');
    });

    it('should handle API error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(marketAPI.ticker('INVALID'))
        .rejects.toThrow('API Error: 404 Not Found');
    });
  });

  describe('depth', () => {
    it('should return order book', async () => {
      const mockResponse = {
        symbol: 'BTC-USD',
        bids: [['67000', '1.5'], ['66999', '2.0']],
        asks: [['67001', '1.0'], ['67002', '2.5']],
        timestamp: '1704067200000'
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const depth = await marketAPI.depth('BTC-USD', 20);

      expect(depth.bids).toHaveLength(2);
      expect(depth.asks).toHaveLength(2);
      expect(depth.bids[0][0]).toBe('67000');
    });
  });

  describe('kline', () => {
    it('should return kline data', async () => {
      const mockResponse = [
        { time: 1704067200000, open: '67000', high: '67100', low: '66900', close: '67050', volume: '123' }
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const klines = await marketAPI.kline('BTC-USD', { interval: '1m' });

      expect(klines).toHaveLength(1);
      expect(klines[0].open).toBe('67000');
    });
  });
});
```

### 测试 OrderAPI

```typescript
// tests/order.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrderAPI } from '../src/order';

global.fetch = vi.fn();

describe('OrderAPI', () => {
  let orderAPI: OrderAPI;
  const JWT = 'test-jwt';

  beforeEach(() => {
    orderAPI = new OrderAPI({
      baseUrl: 'https://test.standx.com',
      jwt: JWT
    });
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create limit order', async () => {
      const mockResponse = {
        id: 'order_123',
        symbol: 'BTC-USD',
        side: 'buy',
        order_type: 'limit',
        qty: '0.1',
        fill_qty: '0',
        price: '67000',
        status: 'new',
        created_at: '2024-01-01T00:00:00Z'
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const order = await orderAPI.create({
        symbol: 'BTC-USD',
        side: 'buy',
        orderType: 'limit',
        qty: '0.1',
        price: '67000'
      });

      expect(order.id).toBe('order_123');
      expect(order.status).toBe('new');
      expect(order.price).toBe('67000');
    });

    it('should create market order', async () => {
      const mockResponse = {
        id: 'order_456',
        status: 'filled'
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const order = await orderAPI.create({
        symbol: 'BTC-USD',
        side: 'buy',
        orderType: 'market',
        qty: '0.1'
      });

      expect(order.status).toBe('filled');
    });
  });

  describe('cancel', () => {
    it('should cancel order', async () => {
      const mockResponse = {
        id: 'order_123',
        status: 'canceled'
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const order = await orderAPI.cancel('order_123', 'BTC-USD');

      expect(order.status).toBe('canceled');
    });
  });
});
```

---

## 集成测试

集成测试需要真实 API 环境或测试网。

```typescript
// tests/integration.test.ts
import { describe, it, expect } from 'vitest';
import { StandXClient } from '../src';

// 跳过集成测试 (需要真实环境)
const TEST_PRIVATE_KEY = process.env.TEST_PRIVATE_KEY;
const SKIP_INTEGRATION = !TEST_PRIVATE_KEY;

describe.skipIf(SKIP_INTEGRATION)('Integration Tests', () => {
  let client: StandXClient;

  beforeAll(() => {
    client = new StandXClient({
      privateKey: TEST_PRIVATE_KEY!
    });
  });

  it('should get ticker', async () => {
    const ticker = await client.market.ticker('BTC-USD');
    expect(ticker.lastPrice).toBeTruthy();
  });

  it('should create and cancel order', async () => {
    // Get current price
    const ticker = await client.market.ticker('BTC-USD');
    const price = parseFloat(ticker.lastPrice);

    // Create order
    const order = await client.order.create({
      symbol: 'BTC-USD',
      side: 'buy',
      orderType: 'limit',
      qty: '0.001',
      price: String(price * 0.9) // 低于市价
    });

    expect(order.id).toBeTruthy();

    // Cancel order
    const cancelled = await client.order.cancel(order.id, 'BTC-USD');
    expect(cancelled.status).toBe('canceled');
  });

  it('should get positions', async () => {
    const positions = await client.account.positions();
    expect(Array.isArray(positions)).toBe(true);
  });
});
```

---

## E2E 测试

端到端测试使用 Playwright。

```typescript
// tests/e2e.spec.ts
import { test, expect } from '@playwright/test';

test('SDK integration', async ({ page }) => {
  // 测试 WebSocket 连接等
});
```

---

## 测试覆盖率

运行覆盖率：

```bash
npm run test:coverage
```

目标覆盖率：

| 模块 | 覆盖率目标 |
|------|-----------|
| types | 100% |
| auth | 100% |
| market | 90% |
| account | 90% |
| order | 90% |
| ws | 80% |
| 整体 | 85% |

---

## Mock 数据

### 创建 Mock Server

```typescript
// tests/mocks/server.ts
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

export const server = setupServer(
  http.get('https://perps.standx.com/api/query_symbol_price', () => {
    return HttpResponse.json({
      symbol: 'BTC-USD',
      last_price: '67000',
      mark_price: '67000'
    });
  }),

  http.post('https://perps.standx.com/api/place_order', () => {
    return HttpResponse.json({
      id: 'order_123',
      status: 'new'
    });
  })
);

beforeAll(() => server.listen => server.resetHandlers());
afterAll(()());
afterEach(() => server.close());
```

---

## CI/CD

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run linter
        run: npm run lint
        
      - name: Run typecheck
        run: npm run typecheck
        
      - name: Run tests
        run: npm run test:coverage
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## 测试最佳实践

1. **AAA 模式**: Arrange (准备) → Act (执行) → Assert (断言)
2. **每个测试一个断言**: 便于定位问题
3. **使用描述性名称**: `should return valid ticker data`
4. **Mock 外部依赖**: 不依赖真实 API
5. **分离单元和集成测试**: 集成测试标记为 `skipIf`
