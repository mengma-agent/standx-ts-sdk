import { ethers } from 'ethers';

/**
 * Auth utilities for JWT generation and verification
 */
export class Auth {
  private static readonly API_BASE = 'https://perps.standx.com';

  /**
   * Generate JWT token from wallet private key
   */
  static generateJwt(
    _privateKey: string,
    walletAddress: string,
    options: {
      permissions?: string[];
      expiryDays?: number;
    } = {}
  ): string {
    const { permissions = ['trade', 'view'], expiryDays = 7 } = options;

    const payload = {
      sub: walletAddress,
      iss: 'standx-sdk',
      aud: this.API_BASE,
      exp: Math.floor(Date.now() / 1000) + expiryDays * 24 * 60 * 60,
      iat: Math.floor(Date.now() / 1000),
      permissions,
    };

    // Note: Actual JWT signing requires wallet signature
    // This is a placeholder - actual implementation depends on StandX auth flow
    const token = Buffer.from(JSON.stringify(payload)).toString('base64');
    return token;
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