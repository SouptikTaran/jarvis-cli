import axios from 'axios';
import { BaseTool, ToolDefinition, ToolResult } from './base';
import { TokenStorage } from '../../config/tokenStorage';
import { GoogleOAuth } from '../../auth/google';
import { Logger } from '../../utils/logger';

const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1';

/**
 * Base class for Gmail tools with shared authentication logic
 */
abstract class GmailBaseTool extends BaseTool {
  constructor(
    protected tokenStorage: TokenStorage,
    protected googleAuth: GoogleOAuth,
    protected logger: Logger
  ) {
    super();
  }

  /**
   * Get valid access token, refreshing if necessary
   */
  protected async getAccessToken(): Promise<string> {
    let tokens = await this.tokenStorage.loadTokens('google');
    
    if (!tokens) {
      throw new Error('Gmail not authenticated. Please run: jarvis auth google');
    }

    // Check if token is expired (with 5 min buffer)
    if (Date.now() >= tokens.expiresAt - 300000) {
      this.logger.debug('Google token expired, refreshing...');
      tokens = await this.googleAuth.refreshAccessToken(tokens.refreshToken);
      await this.tokenStorage.saveTokens('google', tokens);
    }

    return tokens.accessToken;
  }

  /**
   * Make authenticated request to Gmail API
   */
  protected async makeGmailRequest(method: string, endpoint: string, data?: any): Promise<any> {
    const accessToken = await this.getAccessToken();
    
    try {
      const response = await axios({
        method,
        url: `${GMAIL_API_BASE}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        data
      });

      return response.data;
    } catch (error: any) {
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.error?.message || 'Unknown error';
        throw new Error(`Gmail API error (${status}): ${message}`);
      }
      throw error;
    }
  }

  /**
   * Decode base64url string
   */
  protected decodeBase64Url(str: string): string {
    try {
      const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
      return Buffer.from(base64, 'base64').toString('utf-8');
    } catch (error) {
      return str;
    }
  }
}

/**
 * Get unread email count
 */
export class GetUnreadCountTool extends GmailBaseTool {
  definition: ToolDefinition = {
    name: 'get_unread_count',
    description: 'Get the count of unread emails in inbox',
    category: 'system',
    parameters: []
  };

  async execute(parameters: Record<string, any>): Promise<ToolResult> {
    try {
      const response = await this.makeGmailRequest(
        'GET',
        '/users/me/messages?labelIds=INBOX&labelIds=UNREAD&maxResults=1'
      );

      const count = response.resultSizeEstimate || 0;

      return {
        success: true,
        data: { unreadCount: count },
        message: count === 0 ? 'No unread emails' : `You have ${count} unread email${count !== 1 ? 's' : ''}`
      };
    } catch (error) {
      this.logger.error('Failed to get unread count:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get unread count'
      };
    }
  }
}

/**
 * List recent emails
 */
export class ListEmailsTool extends GmailBaseTool {
  definition: ToolDefinition = {
    name: 'list_emails',
    description: 'List recent emails from inbox. Use when user asks about emails, messages, or inbox.',
    category: 'system',
    parameters: [
      {
        name: 'max_results',
        type: 'number',
        description: 'Maximum number of emails to return (default: 10)',
        required: false
      },
      {
        name: 'unread_only',
        type: 'boolean',
        description: 'Show only unread emails (default: false)',
        required: false
      }
    ]
  };

  async execute(parameters: Record<string, any>): Promise<ToolResult> {
    try {
      const maxResults = parameters.max_results || 10;
      const unreadOnly = parameters.unread_only || false;

      let query = 'labelIds=INBOX';
      if (unreadOnly) {
        query += '&labelIds=UNREAD';
      }

      const listResponse = await this.makeGmailRequest(
        'GET',
        `/users/me/messages?${query}&maxResults=${maxResults}`
      );

      const messages = listResponse.messages || [];

      if (messages.length === 0) {
        return {
          success: true,
          data: [],
          message: unreadOnly ? 'No unread emails' : 'No emails found'
        };
      }

      // Fetch details for each message
      const emailDetails = await Promise.all(
        messages.slice(0, 5).map(async (msg: any) => {
          try {
            const details = await this.makeGmailRequest('GET', `/users/me/messages/${msg.id}?format=metadata`);
            const headers = details.payload?.headers || [];
            
            const getHeader = (name: string) => {
              const header = headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase());
              return header?.value || '';
            };

            return {
              id: msg.id,
              from: getHeader('From'),
              subject: getHeader('Subject'),
              date: getHeader('Date'),
              snippet: details.snippet
            };
          } catch (error) {
            return null;
          }
        })
      );

      const validEmails = emailDetails.filter(e => e !== null);
      
      const message = validEmails.map((email, i) => {
        const from = email.from.replace(/<.*>/, '').trim();
        return `${i + 1}. From: ${from}\n   Subject: ${email.subject}\n   ${email.snippet}`;
      }).join('\n\n');

      return {
        success: true,
        data: validEmails,
        message: `Recent emails (${validEmails.length}):\n\n${message}`
      };
    } catch (error) {
      this.logger.error('Failed to list emails:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list emails'
      };
    }
  }
}

/**
 * Send an email
 */
export class SendEmailTool extends GmailBaseTool {
  definition: ToolDefinition = {
    name: 'send_email',
    description: 'Send an email via Gmail',
    category: 'system',
    parameters: [
      {
        name: 'to',
        type: 'string',
        description: 'Recipient email address',
        required: true
      },
      {
        name: 'subject',
        type: 'string',
        description: 'Email subject',
        required: true
      },
      {
        name: 'body',
        type: 'string',
        description: 'Email body/message',
        required: true
      }
    ]
  };

  async execute(parameters: Record<string, any>): Promise<ToolResult> {
    try {
      const { to, subject, body } = parameters;

      // Create email in RFC 2822 format
      const email = [
        `To: ${to}`,
        `Subject: ${subject}`,
        '',
        body
      ].join('\r\n');

      // Encode in base64url
      const encodedEmail = Buffer.from(email)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      await this.makeGmailRequest('POST', '/users/me/messages/send', {
        raw: encodedEmail
      });

      return {
        success: true,
        message: `Email sent to ${to}`
      };
    } catch (error) {
      this.logger.error('Failed to send email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email'
      };
    }
  }
}

/**
 * Search emails
 */
export class SearchEmailsTool extends GmailBaseTool {
  definition: ToolDefinition = {
    name: 'search_emails',
    description: 'Search emails by query (sender, subject, content, etc.)',
    category: 'system',
    parameters: [
      {
        name: 'query',
        type: 'string',
        description: 'Search query (e.g., "from:someone@example.com", "subject:meeting", "invoice")',
        required: true
      },
      {
        name: 'max_results',
        type: 'number',
        description: 'Maximum number of results (default: 10)',
        required: false
      }
    ]
  };

  async execute(parameters: Record<string, any>): Promise<ToolResult> {
    try {
      const query = encodeURIComponent(parameters.query);
      const maxResults = parameters.max_results || 10;

      const listResponse = await this.makeGmailRequest(
        'GET',
        `/users/me/messages?q=${query}&maxResults=${maxResults}`
      );

      const messages = listResponse.messages || [];

      if (messages.length === 0) {
        return {
          success: true,
          data: [],
          message: `No emails found for: "${parameters.query}"`
        };
      }

      // Fetch details for first few messages
      const emailDetails = await Promise.all(
        messages.slice(0, 5).map(async (msg: any) => {
          try {
            const details = await this.makeGmailRequest('GET', `/users/me/messages/${msg.id}?format=metadata`);
            const headers = details.payload?.headers || [];
            
            const getHeader = (name: string) => {
              const header = headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase());
              return header?.value || '';
            };

            return {
              id: msg.id,
              from: getHeader('From'),
              subject: getHeader('Subject'),
              date: getHeader('Date'),
              snippet: details.snippet
            };
          } catch (error) {
            return null;
          }
        })
      );

      const validEmails = emailDetails.filter(e => e !== null);
      
      const message = validEmails.map((email, i) => {
        const from = email.from.replace(/<.*>/, '').trim();
        return `${i + 1}. From: ${from}\n   Subject: ${email.subject}\n   ${email.snippet}`;
      }).join('\n\n');

      return {
        success: true,
        data: validEmails,
        message: `Found ${messages.length} emails:\n\n${message}`
      };
    } catch (error) {
      this.logger.error('Failed to search emails:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search emails'
      };
    }
  }
}
