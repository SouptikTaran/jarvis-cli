import express, { Request, Response } from 'express';
import open from 'open';
import { Logger } from '../utils/logger';

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export abstract class OAuthProvider {
  protected logger: Logger;
  protected config: OAuthConfig;
  protected tokens: OAuthTokens | null = null;

  constructor(config: OAuthConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  abstract getAuthorizationUrl(): string;
  abstract exchangeCodeForTokens(code: string): Promise<OAuthTokens>;
  abstract refreshAccessToken(refreshToken: string): Promise<OAuthTokens>;

  async authenticate(): Promise<OAuthTokens> {
    return new Promise((resolve, reject) => {
      const app = express();
      const server = app.listen(8888, '0.0.0.0', () => {
        this.logger.info(`OAuth server started on ${this.config.redirectUri.replace('/callback', '')}`);
      });

      // Timeout to prevent hanging
      const timeout = setTimeout(() => {
        server.close();
        reject(new Error('Authentication timeout - no response received'));
      }, 120000); // 2 minutes

      // Callback endpoint
      app.get('/callback', async (req: Request, res: Response) => {
        const { code, error } = req.query;

        clearTimeout(timeout);

        if (error) {
          res.send(`<h1>Authentication Failed</h1><p>Error: ${error}</p>`);
          this.closeServer(server);
          reject(new Error(`OAuth error: ${error}`));
          return;
        }

        if (!code || typeof code !== 'string') {
          res.send('<h1>Authentication Failed</h1><p>No authorization code received</p>');
          this.closeServer(server);
          reject(new Error('No authorization code received'));
          return;
        }

        try {
          // Exchange code for tokens
          const tokens = await this.exchangeCodeForTokens(code);
          this.tokens = tokens;

          res.send(`
            <html>
              <head><title>JARVIS Authentication</title></head>
              <body style="font-family: Arial; text-align: center; padding: 50px;">
                <h1 style="color: #00ff00;">✅ Authentication Successful!</h1>
                <p>You can close this window and return to JARVIS.</p>
                <script>setTimeout(() => window.close(), 3000);</script>
              </body>
            </html>
          `);

          this.closeServer(server);
          // Small delay to ensure response is sent before resolving
          setTimeout(() => resolve(tokens), 500);
        } catch (error) {
          res.send(`<h1>Authentication Failed</h1><p>Error: ${error}</p>`);
          this.closeServer(server);
          reject(error);
        }
      });

      // Open browser for authentication
      const authUrl = this.getAuthorizationUrl();
      this.logger.info('Opening browser for authentication...');
      open(authUrl).catch((err) => {
        this.logger.error('Failed to open browser:', err);
        this.logger.info(`Please manually open: ${authUrl}`);
      });
    });
  }

  private closeServer(server: any): void {
    server.close((err: any) => {
      if (err) {
        this.logger.error('Error closing OAuth server:', err);
      }
    });
  }

  getTokens(): OAuthTokens | null {
    return this.tokens;
  }

  setTokens(tokens: OAuthTokens): void {
    this.tokens = tokens;
  }

  isTokenExpired(): boolean {
    if (!this.tokens) return true;
    return Date.now() >= this.tokens.expiresAt;
  }

  async getValidAccessToken(): Promise<string> {
    if (!this.tokens) {
      throw new Error('Not authenticated. Please run authentication first.');
    }

    if (this.isTokenExpired() && this.tokens.refreshToken) {
      this.logger.debug('Access token expired, refreshing...');
      this.tokens = await this.refreshAccessToken(this.tokens.refreshToken);
    }

    return this.tokens.accessToken;
  }
}