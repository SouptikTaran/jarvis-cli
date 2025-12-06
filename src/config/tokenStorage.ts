import fs from 'fs';
import path from 'path';
import os from 'os';
import { TokenEncryption } from './encryption';
import { OAuthTokens } from '../auth/oauth';
import { Logger } from '../utils/logger';

export interface StoredTokens {
  spotify?: OAuthTokens;
  google?: OAuthTokens;
}

/**
 * Manages secure storage and retrieval of OAuth tokens
 */
export class TokenStorage {
  private storageDir: string;
  private tokensFile: string;
  private keyFile: string;
  private encryption: TokenEncryption;
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    this.storageDir = path.join(os.homedir(), '.jarvis');
    this.tokensFile = path.join(this.storageDir, 'tokens.json');
    this.keyFile = path.join(this.storageDir, '.key');

    // Ensure storage directory exists
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }

    // Initialize encryption
    this.encryption = new TokenEncryption(this.getOrCreateEncryptionKey());
  }

  /**
   * Get or create encryption key
   */
  private getOrCreateEncryptionKey(): string {
    if (fs.existsSync(this.keyFile)) {
      return fs.readFileSync(this.keyFile, 'utf8').trim();
    }

    const key = TokenEncryption.generateKey();
    fs.writeFileSync(this.keyFile, key, { mode: 0o600 }); // Owner read/write only
    return key;
  }

  /**
   * Save tokens for a specific service
   */
  async saveTokens(service: 'spotify' | 'google', tokens: OAuthTokens): Promise<void> {
    try {
      const allTokens = await this.loadAllTokens();
      allTokens[service] = tokens;

      const plaintext = JSON.stringify(allTokens, null, 2);
      const encrypted = this.encryption.encrypt(plaintext);

      fs.writeFileSync(this.tokensFile, encrypted, { mode: 0o600 });
      this.logger.debug(`Tokens saved for ${service}`);
    } catch (error) {
      this.logger.error(`Failed to save tokens for ${service}:`, error);
      throw new Error(`Failed to save tokens for ${service}`);
    }
  }

  /**
   * Load tokens for a specific service
   */
  async loadTokens(service: 'spotify' | 'google'): Promise<OAuthTokens | null> {
    try {
      const allTokens = await this.loadAllTokens();
      return allTokens[service] || null;
    } catch (error) {
      this.logger.error(`Failed to load tokens for ${service}:`, error);
      return null;
    }
  }

  /**
   * Load all stored tokens
   */
  private async loadAllTokens(): Promise<StoredTokens> {
    if (!fs.existsSync(this.tokensFile)) {
      return {};
    }

    try {
      const encrypted = fs.readFileSync(this.tokensFile, 'utf8');
      const plaintext = this.encryption.decrypt(encrypted);
      return JSON.parse(plaintext);
    } catch (error) {
      this.logger.error('Failed to load tokens:', error);
      return {};
    }
  }

  /**
   * Delete tokens for a specific service
   */
  async deleteTokens(service: 'spotify' | 'google'): Promise<void> {
    try {
      const allTokens = await this.loadAllTokens();
      delete allTokens[service];

      if (Object.keys(allTokens).length === 0) {
        // If no tokens left, delete the file
        if (fs.existsSync(this.tokensFile)) {
          fs.unlinkSync(this.tokensFile);
        }
      } else {
        const plaintext = JSON.stringify(allTokens, null, 2);
        const encrypted = this.encryption.encrypt(plaintext);
        fs.writeFileSync(this.tokensFile, encrypted, { mode: 0o600 });
      }

      this.logger.debug(`Tokens deleted for ${service}`);
    } catch (error) {
      this.logger.error(`Failed to delete tokens for ${service}:`, error);
      throw new Error(`Failed to delete tokens for ${service}`);
    }
  }

  /**
   * Check if tokens exist for a service
   */
  async hasTokens(service: 'spotify' | 'google'): Promise<boolean> {
    const tokens = await this.loadTokens(service);
    return tokens !== null;
  }

  /**
   * Clear all stored tokens
   */
  async clearAll(): Promise<void> {
    try {
      if (fs.existsSync(this.tokensFile)) {
        fs.unlinkSync(this.tokensFile);
      }
      this.logger.debug('All tokens cleared');
    } catch (error) {
      this.logger.error('Failed to clear all tokens:', error);
      throw new Error('Failed to clear all tokens');
    }
  }
}
