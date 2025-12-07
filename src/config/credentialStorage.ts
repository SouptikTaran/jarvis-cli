import fs from 'fs';
import path from 'path';
import os from 'os';
import { TokenEncryption } from './encryption';
import { Logger } from '../utils/logger';

export interface StoredCredentials {
  geminiApiKey?: string;
  spotifyClientId?: string;
  spotifyClientSecret?: string;
  googleClientId?: string;
  googleClientSecret?: string;
}

/**
 * Manages secure storage of API credentials
 */
export class CredentialStorage {
  private storageDir: string;
  private credFile: string;
  private keyFile: string;
  private encryption: TokenEncryption;
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    this.storageDir = path.join(os.homedir(), '.jarvis');
    this.credFile = path.join(this.storageDir, 'credentials.json');
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
   * Check if credentials exist
   */
  hasCredentials(): boolean {
    return fs.existsSync(this.credFile);
  }

  /**
   * Save all credentials
   */
  async saveCredentials(credentials: StoredCredentials): Promise<void> {
    try {
      // Merge with existing credentials
      const existing = await this.loadCredentials();
      const merged = { ...existing, ...credentials };

      const plaintext = JSON.stringify(merged, null, 2);
      const encrypted = this.encryption.encrypt(plaintext);

      fs.writeFileSync(this.credFile, encrypted, { mode: 0o600 });
      this.logger.debug('Credentials saved securely');
    } catch (error) {
      this.logger.error('Failed to save credentials:', error);
      throw new Error('Failed to save credentials');
    }
  }

  /**
   * Load all credentials
   */
  async loadCredentials(): Promise<StoredCredentials> {
    if (!fs.existsSync(this.credFile)) {
      return {};
    }

    try {
      const encrypted = fs.readFileSync(this.credFile, 'utf8');
      const plaintext = this.encryption.decrypt(encrypted);
      return JSON.parse(plaintext);
    } catch (error) {
      this.logger.error('Failed to load credentials:', error);
      return {};
    }
  }

  /**
   * Get specific credential
   */
  async getCredential(key: keyof StoredCredentials): Promise<string | undefined> {
    const credentials = await this.loadCredentials();
    return credentials[key];
  }

  /**
   * Check if specific credential exists
   */
  async hasCredential(key: keyof StoredCredentials): Promise<boolean> {
    const value = await this.getCredential(key);
    return !!value;
  }

  /**
   * Delete all credentials
   */
  deleteCredentials(): void {
    if (fs.existsSync(this.credFile)) {
      fs.unlinkSync(this.credFile);
      this.logger.debug('Credentials deleted');
    }
  }

  /**
   * Get credentials as environment variables format
   */
  async toEnvFormat(): Promise<Record<string, string>> {
    const credentials = await this.loadCredentials();
    const env: Record<string, string> = {};

    if (credentials.geminiApiKey) {
      env.GEMINI_API_KEY = credentials.geminiApiKey;
    }
    if (credentials.spotifyClientId) {
      env.SPOTIFY_CLIENT_ID = credentials.spotifyClientId;
    }
    if (credentials.spotifyClientSecret) {
      env.SPOTIFY_CLIENT_SECRET = credentials.spotifyClientSecret;
    }
    if (credentials.googleClientId) {
      env.GOOGLE_CLIENT_ID = credentials.googleClientId;
    }
    if (credentials.googleClientSecret) {
      env.GOOGLE_CLIENT_SECRET = credentials.googleClientSecret;
    }

    return env;
  }
}
