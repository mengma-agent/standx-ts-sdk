# 认证指南

## 目录

- [概述](#概述)
- [初始化方式](#初始化方式)
- [JWT Token](#jwt-token)
- [权限](#权限)
- [常见问题](#常见问题)

---

## 概述

standx-sdk 支持两种认证方式：

1. **私钥认证** - 直接传入钱包私钥
2. **JWT Token** - 传入预生成的 JWT

---

## 初始化方式

### 方式一：私钥认证

```typescript
import { StandXClient } from 'standx-sdk';

const client = new StandXClient({
  privateKey: '0x1234...'  // 钱包私钥
});
```

SDK 会自动：
1. 从私钥推导钱包地址
2. 生成 JWT Token
3. 用于所有需要认证的 API 调用

### 方式二：JWT Token

```typescript
import { StandXClient, Auth } from 'standx-sdk';

// 先自行生成 Token
const jwt = Auth.generateJwt(
  '0x1234...',
  '0xwallet-address',
  { permissions: ['trade', 'view'] }
);

// 使用 Token 初始化
const client = new StandXClient({
  jwt: jwt
});
```

### 方式三：使用环境变量

```typescript
const client = new StandXClient({
  privateKey: process.env.WALLET_PRIVATE_KEY
});
```

---

## JWT Token

### 生成 JWT

```typescript
import { Auth } from 'standx-sdk';

const token = Auth.generateJwt(
  privateKey: string,      // 钱包私钥
  walletAddress: string,   // 钱包地址
  options: {
    permissions?: string[], // 权限列表
    expiryDays?: number    // 过期天数
  }
);
```

**示例：**

```typescript
// 基本用法
const token = Auth.generateJwt(
  '0xabc123...',
  '0xwallet...'
);

// 自定义权限和过期时间
const tokenWithOptions = Auth.generateJwt(
  '0xabc123...',
  '0xwallet...',
  {
    permissions: ['trade'],      // 只允许交易
    expiryDays: 30               // 30天过期
  }
);
```

### 验证 JWT

```typescript
const isValid = Auth.verifyJwt(token);

if (isValid) {
  console.log('Token 有效');
} else {
  console.log('Token 无效或已过期');
}
```

### Token 结构

JWT 包含以下 claims：

```typescript
{
  sub: '0xwallet-address',  // 主题：钱包地址
  iss: 'standx-sdk',         // 发行者
  aud: 'https://perps.standx.com', // 受众
  exp: 1234567890,          // 过期时间 (Unix 时间戳)
  iat: 1234567890,          // 签发时间
  permissions: ['trade', 'view']  // 权限
}
```

---

## 权限

### 可用权限

| 权限 | 说明 |
|------|------|
| `view` | 查看账户余额、持仓、订单 |
| `trade` | 创建订单、取消订单 |
| `withdraw` | 提现 (如有) |

### 权限组合

```typescript
// 只读权限
permissions: ['view']

// 交易权限
permissions: ['view', 'trade']

// 全部权限
permissions: ['view', 'trade', 'withdraw']
```

### 默认权限

如果不指定权限，默认使用 `['trade', 'view']`。

---

## 常见问题

### Q: 如何判断客户端是否已认证？

```typescript
const client = new StandXClient({ jwt: token });

if (client.isAuthenticated()) {
  console.log('已认证');
} else {
  console.log('未认证或 Token 已过期');
}
```

### Q: Token 过期了怎么办？

```typescript
if (!client.isAuthenticated()) {
  // 重新生成 Token
  const newToken = Auth.generateJwt(privateKey, walletAddress);
  // 重新初始化客户端
  const newClient = new StandXClient({ jwt: newToken });
}
```

### Q: 私钥安全吗？

SDK 不会存储您的私钥。私钥仅在初始化时用于生成 JWT，之后不会在内存中长期保存。

**建议：**
- 使用环境变量存储私钥
- 不要将私钥硬编码在代码中
- 生产环境使用钱包签名服务

### Q: 支持哪些钱包？

支持任何兼容以太坊的钱包私钥（ECDSA secp256k1）。

```typescript
// 支持的私钥格式
const privateKey = '0x1234...';  // 带 0x 前缀
const privateKey = '1234...';    // 不带前缀
```

### Q: 如何获取钱包地址？

```typescript
import { Auth } from 'standx-sdk';

const address = Auth.getWalletAddress('0xabc123...');
console.log(address); // '0x...'
```

---

## 安全建议

1. **不要在客户端暴露私钥**
   - 前端应用建议使用钱包签名
   - 后端服务使用环境变量

2. **最小权限原则**
   - 只授予必要的权限
   - 短期 Token 比长期更安全

3. **Token 过期处理**
   - 定期刷新 Token
   - 实现自动重连机制

4. **HTTPS**
   - 生产环境必须使用 HTTPS
   - 验证服务器证书
