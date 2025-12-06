import axios from 'axios';
import { OAuthProvider, OAuthConfig, OAuthTokens } from './oauth';
import { Logger } from '../utils/logger';

export class GoogleOAuth extends OAuthProvider {
  private readonly authEndpoint = 'https://accounts.google.com/o/oauth2/v2/auth';
  private readonly tokenEndpoint = 'https://oauth2.googleapis.com/token';

  constructor(config: OAuthConfig, logger: Logger) {
    super(config, logger);
  }

  getAuthorizationUrl(): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent'
    });

    return `${this.authEndpoint}?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
    try {
      this.logger.debug('Exchanging authorization code for Google tokens...');

      const response = await axios.post(
        this.tokenEndpoint,
        {
          code,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          redirect_uri: this.config.redirectUri,
          grant_type: 'authorization_code'
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const { access_token, refresh_token, expires_in } = response.data;

      return {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: Date.now() + expires_in * 1000
      };
    } catch (error) {
      this.logger.error('Failed to exchange code for Google tokens:', error);
      throw new Error('Failed to get Google access token');
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
    try {
      this.logger.debug('Refreshing Google access token...');

      const response = await axios.post(
        this.tokenEndpoint,
        {
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const { access_token, expires_in } = response.data;

      return {
        accessToken: access_token,
        refreshToken: refreshToken, // Google doesn't return new refresh token
        expiresAt: Date.now() + expires_in * 1000
      };
    } catch (error) {
      this.logger.error('Failed to refresh Google access token:', error);
      throw new Error('Failed to refresh Google access token');
    }
  }
}