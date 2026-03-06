import { ethers } from 'ethers';

/**
 * Auth utilities for JWT generation and verification
 */
export class Auth {
  private static readonly API_BASE = 'https://perps.standx.com';
  
  /**
   * Store for refresh tokens
   */
  private static refreshTokens: Map<string, { token: string; expiresAt: number }> = new Map();

  /**
   * Generate JWT token from wallet private key
   * Uses EIP-191 signed message format
   */
  static generateJwt(
    privateKey: string,
    walletAddress: string,
    options: {
      permissions?: string[];
      expiryDays?: number;
    } = {}
  ): string {
    const { permissions = ['trade', 'view'], expiryDays = 7 } = options;
    
    const now = Math.floor(Date.now() / 1000);
    const exp = now + expiryDays * 24 * 60 * 60;

    const payload = {
      sub: walletAddress,
      iss: 'standx-sdk',
      aud: this.API_BASE,
      exp,
      iat: now,
      permissions,
    };

    // Create JWT parts
    const header = { alg: 'ES256', typ: 'JWT' };
    const headerEncoded = Buffer.from(JSON.stringify(header)).toString('base64url');
    const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
    
    // Sign the message using wallet
    const message = `${headerEncoded}.${payloadEncoded}`;
    const wallet = new ethers.Wallet(privateKey);
    const signature = wallet.signMessageSync(message);
    
    // Convert signature to base64url
    const signatureEncoded = Buffer.from(signature.slice(2), 'hex').toString('base64url');
    
    return `${headerEncoded}.${payloadEncoded}.${signatureEncoded}`;
  }

  /**
   * Generate a refresh token
   */
  static generateRefreshToken(
    privateKey: string,
    walletAddress: string,
    options: {
      expiryDays?: number;
    } = {}
  ): string {
    const { expiryDays = 30 } = options;
    const now = Math.floor(Date.now() / 1000);
    const exp = now + expiryDays * 24 * 60 * 60;

    const payload = {
      sub: walletAddress,
      type: 'refresh',
      iss: 'standx-sdk',
      aud: this.API_BASE,
      exp,
      iat: now,
    };

    const header = { alg: 'ES256', typ: 'JWT' };
    const headerEncoded = Buffer.from(JSON.stringify(header)).toString('base64url');
    const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
    
    const message = `${headerEncoded}.${payloadEncoded}`;
    const wallet = new ethers.Wallet(privateKey);
    const signature = wallet.signMessageSync(message);
    
    const signatureEncoded = Buffer.from(signature.slice(2), 'hex').toString('base64url');
    
    const token = `${headerEncoded}.${payloadEncoded}.${signatureEncoded}`;
    
    // Store refresh token
    this.refreshTokens.set(walletAddress, { token, expiresAt: exp * 1000 });
    
    return token;
  }

  /**
   * Refresh an expired JWT using refresh token
   */
  static async refreshJwt(
    privateKey: string,
    walletAddress: string,
    options: {
      permissions?: string[];
      expiryDays?: number;
    } = {}
  ): Promise<string> {
    // Check if we have a stored refresh token
    const stored = this.refreshTokens.get(walletAddress);
    if (!stored || stored.expiresAt < Date.now()) {
      // Generate new JWT directly
      return this.generateJwt(privateKey, walletAddress, options);
    }
    
    return this.generateJwt(privateKey, walletAddress, options);
  }

  /**
   * Revoke a refresh token
   */
  static revokeRefreshToken(walletAddress: string): void {
    this.refreshTokens.delete(walletAddress);
  }

  /**
   * Verify JWT token (basic validation)
   */
  static verifyJwt(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;

      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get wallet address from private key
   */
  static getWalletAddress(privateKey: string): string {
    const wallet = new ethers.Wallet(privateKey);
    return wallet.address;
  }
}