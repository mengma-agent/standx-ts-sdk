import { describe, it, expect } from 'vitest';
import { Auth } from '../src/auth';

describe('Auth', () => {
  // Use a real test private key (hardhat default account)
  const TEST_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
  const TEST_WALLET_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

  describe('getWalletAddress', () => {
    it('should get correct wallet address from private key', () => {
      const address = Auth.getWalletAddress(TEST_PRIVATE_KEY);
      expect(address).toBe(TEST_WALLET_ADDRESS);
    });

    it('should return different addresses for different private keys', () => {
      const key1 = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
      const key2 = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
      
      const addr1 = Auth.getWalletAddress(key1);
      const addr2 = Auth.getWalletAddress(key2);
      
      expect(addr1).not.toBe(addr2);
    });
  });

  describe('generateJwt', () => {
    it('should generate a signed JWT token', () => {
      const token = Auth.generateJwt(TEST_PRIVATE_KEY, TEST_WALLET_ADDRESS);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });

    it('should include wallet address in payload', () => {
      const token = Auth.generateJwt(TEST_PRIVATE_KEY, TEST_WALLET_ADDRESS);
      
      const parts = token.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      
      expect(payload.sub).toBe(TEST_WALLET_ADDRESS);
    });

    it('should use default permissions', () => {
      const token = Auth.generateJwt(TEST_PRIVATE_KEY, TEST_WALLET_ADDRESS);
      
      const parts = token.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      
      expect(payload.permissions).toEqual(['trade', 'view']);
    });

    it('should accept custom permissions', () => {
      const token = Auth.generateJwt(TEST_PRIVATE_KEY, TEST_WALLET_ADDRESS, {
        permissions: ['trade', 'view', 'withdraw'],
      });
      
      const parts = token.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      
      expect(payload.permissions).toEqual(['trade', 'view', 'withdraw']);
    });

    it('should use custom expiry days', () => {
      const token = Auth.generateJwt(TEST_PRIVATE_KEY, TEST_WALLET_ADDRESS, {
        expiryDays: 30,
      });
      
      const parts = token.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      
      const expectedExpiry = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
      expect(payload.exp).toBeCloseTo(expectedExpiry, -2);
    });

    it('should include correct issuer and audience', () => {
      const token = Auth.generateJwt(TEST_PRIVATE_KEY, TEST_WALLET_ADDRESS);
      
      const parts = token.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      
      expect(payload.iss).toBe('standx-sdk');
      expect(payload.aud).toBe('https://perps.standx.com');
    });
  });

  describe('verifyJwt', () => {
    it('should return true for valid token', () => {
      const token = Auth.generateJwt(TEST_PRIVATE_KEY, TEST_WALLET_ADDRESS);
      expect(Auth.verifyJwt(token)).toBe(true);
    });

    it('should return false for invalid token format', () => {
      expect(Auth.verifyJwt('invalid')).toBe(false);
      expect(Auth.verifyJwt('')).toBe(false);
    });

    it('should return false for expired token', () => {
      // Create an expired token manually
      const expiredPayload = {
        sub: TEST_WALLET_ADDRESS,
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        iat: Math.floor(Date.now() / 1000) - 7200,
        iss: 'standx-sdk',
        aud: 'https://perps.standx.com',
        permissions: ['trade', 'view'],
      };
      
      const header = { alg: 'ES256', typ: 'JWT' };
      const headerEncoded = Buffer.from(JSON.stringify(header)).toString('base64url');
      const payloadEncoded = Buffer.from(JSON.stringify(expiredPayload)).toString('base64url');
      const signatureEncoded = 'test';
      
      const token = `${headerEncoded}.${payloadEncoded}.${signatureEncoded}`;
      
      expect(Auth.verifyJwt(token)).toBe(false);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a refresh token', () => {
      const token = Auth.generateRefreshToken(TEST_PRIVATE_KEY, TEST_WALLET_ADDRESS);
      
      expect(token).toBeDefined();
      expect(token.split('.').length).toBe(3);
    });

    it('should store refresh token', () => {
      Auth.generateRefreshToken(TEST_PRIVATE_KEY, TEST_WALLET_ADDRESS, { expiryDays: 1 });
      // Token is stored internally, just verify it doesn't throw
    });
  });

  describe('revokeRefreshToken', () => {
    it('should revoke refresh token', () => {
      Auth.generateRefreshToken(TEST_PRIVATE_KEY, TEST_WALLET_ADDRESS);
      Auth.revokeRefreshToken(TEST_WALLET_ADDRESS);
      // Should not throw
    });
  });
});
