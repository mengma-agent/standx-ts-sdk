import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebSocketAPI } from '../src/ws';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.OPEN;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: ((error: any) => void) | null = null;

  constructor(public url: string) {
    setTimeout(() => this.onopen?.(), 0);
  }

  send(data: string) {
    // Mock send
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.();
  }
}

// @ts-ignore
global.WebSocket = MockWebSocket;

describe('WebSocketAPI', () => {
  let ws: WebSocketAPI;

  beforeEach(() => {
    ws = new WebSocketAPI({
      wsUrl: 'wss://test.standx.com/ws',
    });
  });

  afterEach(async () => {
    await ws.disconnect();
  });

  describe('constructor', () => {
    it('should create WebSocketAPI with default URL', () => {
      const wsDefault = new WebSocketAPI();
      expect(wsDefault).toBeDefined();
    });

    it('should create WebSocketAPI with custom URL', () => {
      const wsCustom = new WebSocketAPI({
        wsUrl: 'wss://custom.standx.com/ws',
      });
      expect(wsCustom).toBeDefined();
    });
  });

  describe('connect', () => {
    it('should connect successfully', async () => {
      await expect(ws.connect()).resolves.toBeUndefined();
    });
  });

  describe('subscribePrice', () => {
    it('should add price subscription', async () => {
      await ws.connect();
      const callback = vi.fn();
      const unsubscribe = ws.subscribePrice('BTC-USD', callback);
      
      expect(unsubscribe).toBeDefined();
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('subscribeDepth', () => {
    it('should add depth subscription', async () => {
      await ws.connect();
      const callback = vi.fn();
      const unsubscribe = ws.subscribeDepth('BTC-USD', callback);
      
      expect(unsubscribe).toBeDefined();
    });
  });

  describe('subscribeTrade', () => {
    it('should add trade subscription', async () => {
      await ws.connect();
      const callback = vi.fn();
      const unsubscribe = ws.subscribeTrade('BTC-USD', callback);
      
      expect(unsubscribe).toBeDefined();
    });
  });

  describe('subscribeOrder', () => {
    it('should add order subscription with JWT', async () => {
      const wsWithAuth = new WebSocketAPI({
        wsUrl: 'wss://test.standx.com/ws',
        jwt: 'test-jwt',
      });
      
      await wsWithAuth.connect();
      const callback = vi.fn();
      const unsubscribe = wsWithAuth.subscribeOrder(callback);
      
      expect(unsubscribe).toBeDefined();
    });
  });

  describe('subscribePosition', () => {
    it('should add position subscription with JWT', async () => {
      const wsWithAuth = new WebSocketAPI({
        jwt: 'test-jwt',
      });
      
      await wsWithAuth.connect();
      const callback = vi.fn();
      const unsubscribe = wsWithAuth.subscribePosition(callback);
      
      expect(unsubscribe).toBeDefined();
    });
  });

  describe('subscribeBalance', () => {
    it('should add balance subscription with JWT', async () => {
      const wsWithAuth = new WebSocketAPI({
        jwt: 'test-jwt',
      });
      
      await wsWithAuth.connect();
      const callback = vi.fn();
      const unsubscribe = wsWithAuth.subscribeBalance(callback);
      
      expect(unsubscribe).toBeDefined();
    });
  });

  describe('disconnect', () => {
    it('should disconnect successfully', async () => {
      await ws.connect();
      await expect(ws.disconnect()).resolves.toBeUndefined();
    });
  });
});
