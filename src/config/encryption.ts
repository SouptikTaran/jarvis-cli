import crypto from 'crypto';

/**
 * Encryption utility for securing OAuth tokens
 * Uses AES-256-GCM for authenticated encryption
 */
export class TokenEncryption {
  private algorithm = 'aes-256-gcm';
  private key: Buffer;

  constructor(encryptionKey: string) {
    // Derive a 32-byte key from the provided key
    this.key = crypto.scryptSync(encryptionKey, 'salt', 32);
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv) as crypto.CipherGCM;
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Combine iv, authTag, and encrypted data
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  decrypt(ciphertext: string): string {
    const parts = ciphertext.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const ivHex = parts[0]!;
    const authTagHex = parts[1]!;
    const encryptedData = parts[2]!;
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv) as crypto.DecipherGCM;
    decipher.setAuthTag(authTag);
    
    const decrypted = decipher.update(encryptedData, 'hex', 'utf8') + decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Generate a random encryption key
   */
  static generateKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
