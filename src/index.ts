import type { ClientOptions } from './types';
import { Auth } from './auth';
import { MarketAPI } from './market';
import { AccountAPI } from './account';
import { OrderAPI } from './order';
import { WebSocketAPI } from './ws';

const DEFAULT_API_URL = 'https://perps.standx.com';
const DEFAULT_WS_URL = 'wss://perps.standx.com/ws-stream/v1';

export class StandXClient {
  public market: MarketAPI;
  public account: AccountAPI;
  public order: OrderAPI;
  public ws: WebSocketAPI;

  private options: Required<ClientOptions>;
  private jwt: string;

  constructor(options: ClientOptions = {}) {
    // Set defaults
    this.options = {
      privateKey: options.privateKey || '',
      jwt: options.jwt || '',
      apiUrl: options.apiUrl || DEFAULT_API_URL,
      wsUrl: options.wsUrl || DEFAULT_WS_URL,
      timeout: options.timeout || 30000,
      verbose: options.verbose || false,
    };

    // Generate JWT from private key if provided
    if (this.options.privateKey && !this.options.jwt) {
      const walletAddress = Auth.getWalletAddress(this.options.privateKey);
      this.jwt = Auth.generateJwt(this.options.privateKey, walletAddress);
    } else {
      this.jwt = this.options.jwt;
    }

    // Initialize APIs
    this.market = new MarketAPI({
      baseUrl: this.options.apiUrl,
      timeout: this.options.timeout,
    });

    this.account = new AccountAPI({
      baseUrl: this.options.apiUrl,
      timeout: this.options.timeout,
      jwt: this.jwt,
    });

    this.order = new OrderAPI({
      baseUrl: this.options.apiUrl,
      timeout: this.options.timeout,
      jwt: this.jwt,
    });

    this.ws = new WebSocketAPI({
      wsUrl: this.options.wsUrl,
      jwt: this.jwt,
    });

    if (this.options.verbose) {
      console.log('StandXClient initialized');
    }
  }

  /**
   * Close all connections
   */
  async close(): Promise<void> {
    await this.ws.disconnect();
  }

  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    return !!this.jwt && Auth.verifyJwt(this.jwt);
  }

  /**
   * Get JWT token
   */
  getToken(): string {
    return this.jwt;
  }
}

export { Auth } from './auth';
export * from './types';