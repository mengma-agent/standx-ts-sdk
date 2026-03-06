import { describe, it, expect } from 'vitest';
import { Auth } from '../src/auth';

describe('Auth', () => {
  describe('getWalletAddress', () => {
    it('should get correct wallet address from private key', () => {
      // Test with a known private key
      const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
      const address = Auth.getWalletAddress(privateKey);
      
      // This is the default hardhat account address
      expect(address).toBe('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
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
    it('should generate a base64 encoded token', () => {
      const walletAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
      const token = Auth.generateJwt('0x...', walletAddress);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      // The current implementation creates a simple base64 encoded JSON (not real JWT)
      expect(token.length).toBeGreaterThan(0);
    });

    it('should include wallet address in payload', () => {
      const walletAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
      const token = Auth.generateJwt('0x...', walletAddress);
      
      const parts = token.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      
      expect(payload.sub).toBe(walletAddress);
    });

    it('should use default permissions', () => {
      const token = Auth.generateJwt('0x...', '0x123');
      
      const parts = token.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      
      expect(payload.permissions).toEqual(['trade', 'view']);
    });

    it('should accept custom permissions', () => {
      const token = Auth.generateJwt('0x...', '0x123', {
        permissions: ['trade', 'view', 'withdraw'],
      });
      
      const parts = token.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      
      expect(payload.permissions).toEqual(['trade', 'view', 'withdraw']);
    });

    it('should use custom expiry days', () => {
      const token = Auth.generateJwt('0x...', '0x123', {
        expiryDays: 30,
      });
      
      const parts = token.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      
      const expectedExpiry = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
      expect(payload.exp).toBeCloseTo(expectedExpiry, -2);
    });
  });

  describe('verifyJwt', () => {
    it('should return true for valid token', () => {
      const token = Auth.generateJwt('0x...', '0x123');
      expect(Auth.verifyJwt(token)).toBe(true);
    });

    it('should return false for invalid token format', () => {
      expect(Auth.verifyJwt('invalid')).toBe(false);
      expect(Auth.verifyJwt('')).toBe(false);
    });

    it('should return false for expired token', () => {
      // Create an expired token manually
      const expiredPayload = {
        sub: '0x123',
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      };
      
      const token = Buffer.from(JSON.stringify(expiredPayload)).toString('base64');
      
      expect(Auth.verifyJwt(token)).toBe(false);
    });
  });
});
