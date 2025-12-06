import axios from 'axios';
import { OAuthProvider, OAuthConfig, OAuthTokens } from './oauth';
import { Logger } from '../utils/logger';

export class SpotifyOAuth extends OAuthProvider {
  private readonly authEndpoint = 'https://accounts.spotify.com/authorize';
  private readonly tokenEndpoint = 'https://accounts.spotify.com/api/token';

  constructor(config: OAuthConfig, logger: Logger) {
    super(config, logger);
  }

  getAuthorizationUrl(): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(' '),
      show_dialog: 'true'
    });

    return `${this.authEndpoint}?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
    try {
      this.logger.debug('Exchanging authorization code for tokens...');

      const response = await axios.post(
        this.tokenEndpoint,
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.config.redirectUri,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
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
      this.logger.error('Failed to exchange code for tokens:', error);
      throw new Error('Failed to get Spotify access token');
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
    try {
      this.logger.debug('Refreshing Spotify access token...');

      const response = await axios.post(
        this.tokenEndpoint,
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const { access_token, expires_in, refresh_token } = response.data;

      return {
        accessToken: access_token,
        refreshToken: refresh_token || refreshToken, // Use new token if provided, else keep old
        expiresAt: Date.now() + expires_in * 1000
      };
    } catch (error) {
      this.logger.error('Failed to refresh access token:', error);
      throw new Error('Failed to refresh Spotify access token');
    }
  }
}